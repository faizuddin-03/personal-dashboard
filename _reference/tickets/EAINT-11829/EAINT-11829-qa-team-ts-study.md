# EAINT-11829 — QA Team test script study (2026-10-27)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study of another QA engineer's TS. Nothing here was checked against the live system.

## Sources read

1. **Own workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-11829 - [eAuto-Application] Cronjob Updated Application Status from Approved to Expired when UCD Creation Completed when Hardcopy & Acc Created = Registered.md` (captured 27/10/2026, 8:50:45 pm). It holds **one header row only**: "R1 | TS No. | Application Status |  | Expected Result | QA | Test Result (P/F)" (Sheet1, R1). No scenarios.
2. **Where the scenarios really are:** sheet "EAINT-11829" inside the EAINT-11536 workbook, text copy `_reference/sharepoint/qa-team-ts/EAINT-11536-🔴[eAuto-Pre-Application and Application] To Add Two Columns for Pre-Application Listing and Application Listing.md`, lines 51-79. All scenario quotes below come from that sheet. `knowledge/cr-test-scenario-catalogue.md` row 018 already says: "Header only; scenarios live in 014 sheet EAINT-11829".
3. **Jira capture:** `_reference/tickets/Studying/EAINT-11829/EAINT-11829-jira.md` (27/10/2026, 5:29:06 pm). One attachment "image-20260623-032007.png" — not in the repo, **not read**.
4. **Earlier study of the same sheet:** `_reference/tickets/EAINT-11536/EAINT-11536-qa-team-ts-study.md` (2026-10-27).
5. **Knowledge:** `knowledge/flow-ucd-onboarding.md` rule 5 (lines 413-419), `knowledge/business-rules-from-test-scenarios.md` (lines 801-806), `knowledge/flow-application-reactivation.md` (lines 239, 250-252), `knowledge/production-regression-scope.md` (lines 421-423, 932), `knowledge/cr-test-scenario-catalogue.md` (rows 018, 357).
6. **Code-side notes:** `lib/eautoFlows/modules/onboarding.ts` lines 551-643, `lib/eautoFlows/modules/qa-tools.ts` lines 459, 487.
7. **lib/ticketStudies.ts:** no EAINT-11829 entry; it appears only in the `related` list of the EAINT-11868 study (line 926).
8. **Not found:** `_reference/tickets/EAINT-11829/` did not exist before this file. No SRD (this is a Bug ticket; Jira lists no SRD).

## 1. Header

1. **Ticket:** EAINT-11829 — "[eAuto-Application] Cronjob Updated Application Status from "Approved" to "Expired" when UCD Creation Completed when Hardcopy & Acc Created = "Registered"" (Jira Summary). **Bug**, Status **Done**, Priority Medium.
2. **Fix version:** "S30.9-20260630 🌚 (2026-06-30)" (Jira item 4). "ETA for Testing (cf 10057): 2026-06-26" (Jira item 7).
3. **Module / portal:** **Onboarding Application** — BackOffice expiry cronjob plus the dealer's OB (onboarding) form link.
4. **Workbook (own):** "EAINT-11829 - [eAuto-Application] Cronjob Updated ... = Registered.xlsx", library "eAuto - CR Test Scenarios", modified 23/06/2026, 4:58:53 pm. Catalogue id **#018**. One sheet, "Sheet1", header only.
5. **Workbook (with scenarios):** EAINT-11536 workbook (catalogue #014), sheet **EAINT-11829**.
6. **Scenarios:** **22** — 15 patched (11829_TS01-TS15) + 7 natural case (NAT11829_TS01-TS07).
7. **Results:** **22/22 PASS**. No Fail, no blank result.
8. **Tester (QA column):** "AZFAR" on R3-R19, "Azfar" on R25-R31. Jira QA field: "Muhammad Amirul Azfar Bin Kamarulazam". Reporter: Lim Yi Link (business analyst role) [unconfirmed role].
9. **Dates in the sheet:** none per row. Only "Natural Case - Need to wait until ((30/06/2026) 12 a.m.)" (sheet EAINT-11829, R24).

## 2. What the ticket changed

1. **Bug:** "Application Status is updated from "Approved" to "Expired" by the cronjob after 90 days, even when the UCD creation has already been completed (Hardcopy & Acc Created = "Registered")." (Jira Description, Current Behaviour). Reported against "Environment: Production".
2. **Fix:** "The cronjob should exclude applications where Hardcopy & Acc Created = "Registered" from the auto-expiry logic." (Jira Description, Expected Behaviour).
3. **Expected status:** "Application Status remain as "Approved" even if the application link was generated more than 90 days ago, as long as the UCD creation is completed" (Jira Description, Expected Behaviour).
4. **As the TS shows it:** the TS does not test only the Registered fix. It re-tests the **whole expiry job** — every status and every Hardcopy & Acc Created state — to prove nothing else changed (sheet EAINT-11829, Sections A-C).

## 3. Scenarios

### Section A — "Will Be Expired by Cronjob After 90 Days" (R2)

Expected for TS01-TS08 (R3-R10): "Cronjob updates Application Status to "Expired" after 90 days" + "- Application Status = Expired" + "- Expired email notification received" + "- OB link → Application Link Expired popup displayed → Redirect to Application Link Expired page".

1. **11829_TS01** — Sdn Bhd / Bhd, **New** → Expired (R3).
2. **11829_TS02** — Sole Proprietorship / Partnership, **Draft** → Expired (R4).
3. **11829_TS03** — LLP, **Pending** → Expired (R5).
4. **11829_TS04** — Business Trading (Sarawak), **Re-evaluate** → Expired (R6).
5. **11829_TS05** — Sdn Bhd / Bhd, **Approved**, Hardcopy "-" → Expired (R7).
6. **11829_TS06** — Sole Proprietorship / Partnership, **Approved**, "Pending UCD" → Expired (R8).
7. **11829_TS07** — LLP, **Approved**, "Pending UCD - Incomplete Docs" → Expired (R9).
8. **11829_TS08** — Business Trading (Sabah), **Approved**, "Pending Assignee" → Expired (R10).
9. **11829_TS09** — Business Trading (Sarawak), already **Expired**. "Application is already Expired cronjob makes no further change" + "- NO additional email notification sent" (R11).

### Section B — "Will NOT Be Expired by Cronjob (Exception Cases)" (R12)

10. **11829_TS10** — Sdn Bhd / Bhd, **Rejected**. "After 90 days Application Status will remain as Rejected" + "- Will NOT received OB form link expired email notification" + "- Application Link redirect to Application Payment Success page" (R13).
11. **11829_TS11** — Sole Proprietorship / Partnership, **Approved + Registered**. "After 90 days Application Status will remain as Approved" + same no-email and Payment Success lines (R14). **This is the bug-fix case.**

### Section C — "Existing Application" (R15)

12. **11829_TS12** — Sdn Bhd / Bhd, Pending → Expired (R16).
13. **11829_TS13** — Sole Proprietorship / Partnership, Approved + Pending UCD → Expired (R17).
14. **11829_TS14** — Sdn Bhd / Bhd, Approved + "Registred" (typo in sheet) → stays Approved (R18).
15. **11829_TS15** — Sdn Bhd / Bhd, Rejected → stays Rejected (R19).

### Natural case — "Need to wait until ((30/06/2026) 12 a.m.)" (R24)

16. **NAT11829_TS01-TS04** — Approved with "-", "Pending UCD", "Pending UCD - Incomplete Docs", "Pending Assignee" → Expired (R25-R28).
17. **NAT11829_TS05** — LLP, Pending → Expired (R29).
18. **NAT11829_TS06** — Sole Proprietorship / Partnership, Approved + Registered → stays Approved (R30).
19. **NAT11829_TS07** — Sdn Bhd / Bhd, Rejected → stays Rejected (R31).

## 4. Business rules and system behaviour

1. **What expires:** New, Draft, Pending, Re-evaluate, and Approved with Hardcopy & Acc Created "-", "Pending UCD", "Pending UCD - Incomplete Docs" or "Pending Assignee" (sheet EAINT-11829, R3-R10).
2. **What never expires:** Rejected (R13, R19, R31) and **Approved + Registered** (R14, R18, R30).
3. **Clock start in the TS:** "Ask dev to patch Submission Date to 90 days before today" (R3 step 3). The TS treats **Submission Date** as the 90-day start.
4. **Expired email once only:** "- NO additional email notification sent" for an already-Expired record (R11).
5. **Expired link:** "OB link → Application Link Expired popup displayed → Redirect to Application Link Expired page" (R3). Same text on every expiring row.
6. **Not-expired link:** "Application Link redirect to Application Payment Success page" — for Rejected (R13) and Approved + Registered (R14). Rejected landing on "Payment Success" is accepted as PASS; whether that is intended is [unconfirmed].
7. **Hardcopy & Acc Created values:** "-", "Pending UCD", "Pending UCD - Incomplete Docs", "Pending Assignee", "Registered" (column Hardcopy & Acc Created, R7-R10, R14).
8. **Application No formats:** Pre-Application "P260626/00644" and Application "NA66001054" (R3, R5). New/Draft rows carry only a P-number ("P260626/00644 /", R3), so an Application No is not yet issued at New/Draft [unconfirmed].
9. **Cron runs at midnight** [unconfirmed]: the natural case waits "until ((30/06/2026) 12 a.m.)" (R24).

## 5. Test data, environments, setup

1. **Environment:** not written in the sheet. Jira "Environment: Production" is the bug report only. Test env [unconfirmed — staging/UAT].
2. **Credentials:** **none present** in either workbook.
3. **Dev patching:** "Ask dev to patch Application Status accordingly" and "Ask dev to patch Submission Date to 90 days before today" (R3 steps 2-3). Cron step: "Wait for / trigger cronjob run" (R3 step 4).
4. **Natural case still patches the date:** NAT rows keep "2. Ask dev to patch Submission Date to 90 days before today" and drop only the status patch; step 3 is missing ("2. ... ⏎ 4. Wait for", R25-R29). "Natural" here = real scheduled cron run, not real ageing [unconfirmed].
5. **Records used:** P260626/00644, P260626/00645, P260626/00646 / NA66001054, P260626/00647 / NA66001055, NA66001049-NA66001052, NA66001056-NA66001059, NA63001016, NA64001045, NA65001046, NA66001062-NA66001068 (column Application No, R3-R31).
6. **Business types:** all five — Sdn Bhd / Bhd, Sole Proprietorship / Partnership, LLP, Business Trading (Sabah), Business Trading (Sarawak).
7. **Prod check:** "Monitor the existing transaction that will exipred at (1/7/2026 00:00)" (Deployment Checklist 20260630 R45, via `knowledge/production-regression-scope.md` line 422).

## 6. Gaps and risks for regression

1. **Registered cases never run the cron.** TS11, TS14 and NAT06 steps end at "4. Attempt to click the Onboarding link" — no "Wait for / trigger cronjob run" step (R14, R18, R30). The fix case may have passed without the job ever touching the record [unconfirmed].
2. **Registered only on two business types** (Sole Proprietorship / Partnership, Sdn Bhd / Bhd). LLP and Business Trading not covered for the fix case.
3. **Registered only with status Approved.** The job reads both columns; no case for another status with Registered (if possible at all).
4. **No email check on Registered beyond "Will NOT received"** — no check that Emails 2/3 reminders (EAINT-11868) are also skipped.
5. **Boundary not tested:** only "90 days before today". No 89-day (must not expire) or exact-minute case.
6. **Date mismatch:** sheet waits for "(30/06/2026) 12 a.m." (R24); prod checklist monitors expiry "at (1/7/2026 00:00)". Same moment if "30/06 12 a.m." means end of day; otherwise one day apart [unconfirmed].
7. **Already-wrongly-expired Registered records** (from before the fix) are not in this TS. Related EAINT-12346 "patch Registered expired" (`knowledge/flow-application-reactivation.md` line 239) suggests these were patched separately.
8. **Clock start conflict:** TS uses Submission Date; `lib/eautoFlows/modules/onboarding.ts` line 631 cites Miro "Approved link start = approval time, valid 90 days"; line 624 says "Link is valid 90 days from creation (to the minute)". Which date the job reads is [unconfirmed].
9. **Text copy rows R20-R23** are absent — likely blank rows [unconfirmed].

## 7. Fit with existing knowledge

1. `knowledge/flow-ucd-onboarding.md` rule 5 and `business-rules-from-test-scenarios.md` line 801 match this sheet. **No contradiction.** Both cite "rows 13-14" for the exceptions; rows 18-19 and 30-31 also cover them.
2. Those files do not yet list **Draft and Re-evaluate** as expiring (R4, R6), nor the four Hardcopy states that still expire (R7-R10).
3. `knowledge/flow-application-reactivation.md` line 250 maps "11829_TS01–TS08 → expired email + **[Reactivate Application]** button per status". This sheet has **no Reactivate button check** — that button came later (EAINT-11868). The mapping is a reuse idea, not 11829 content.
4. `lib/eautoFlows/modules/onboarding.ts` line 627 (prod code: "not Rejected or Expired, past their expiry date, and not yet Registered") agrees with this TS.

## Knowledge candidates

1. **Full expiry status list** → `knowledge/flow-ucd-onboarding.md` rule 5: New, Draft, Pending, Re-evaluate, and Approved with Hardcopy & Acc Created "-" / "Pending UCD" / "Pending UCD - Incomplete Docs" / "Pending Assignee" are set to Expired. Source: SharePoint TS #014, sheet EAINT-11829, R3-R10.
2. **Own workbook #018 is header only** — already in the catalogue; add to `knowledge/cr-test-scenario-catalogue.md` row 018 that the sheet has 22 scenarios, 22/22 PASS. Source: SharePoint TS #014, sheet EAINT-11829, R3-R31.
3. **TS test method for the expiry job:** dev patches Submission Date to 90 days back, then cron is waited for or triggered. Source: sheet EAINT-11829, R3 steps 3-4. Fits `memory: eauto-cronjob-interval-not-on-demand` only if the trigger is a dev action [unconfirmed].
4. **Open question (not a fact):** does the job count 90 days from Submission Date (TS R3) or from approval time (Miro, `onboarding.ts` line 631)?
5. **Open question (not a fact):** a Rejected application's OB link opens "Application Payment Success page" (sheet EAINT-11829, R13) — intended?
6. **Regression note:** the Registered fix cases (R14, R18, R30) have no cron-run step; a future regression should run the job on a Registered record and confirm it stays Approved.
