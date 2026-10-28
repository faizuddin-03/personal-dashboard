# EAINT-11868 — study (2026-10-27)

## Header

1. **Title (Jira, verbatim):** "🔴[eAuto-Application] To Implement Email Reminders & Application Link Reactivation"
2. **SRD title (v1.4, verbatim):** "[eAuto-Application] To Implement Email Reminders, Expiry Extension & Application Link Reactivation"
3. **Jira status:** **Code Review** (Task). Updated "2026-10-19T09:20:58.787+0800". `[from EAINT-11868-jira.md item 2, 6]`
4. **Priority:** Medium. **Labels:** 260713-260717, July2026, ProductBacklog.
5. **Fix version:** "[QA]Ready for Testing Tickets (2026-11-02)". `[from EAINT-11868-jira.md item 4]`
6. **QA (Jira cf[10041]):** **Siti Nur Azila** (Senior QA). **Miro:** "- QA:" (blank).
7. **BA:** Lim Yi Link (Jira assignee + reporter; Miro "- BA: Yi Link"). Jira assignee is the BA, not the dev.
8. **Developer:** Lim Xiwei. `[from Teams, 2026-08-12 15:15, dev]` "development for EAINT-11868 has been completed". Mong Guo Hao added to the CR group (undated event).
9. **Deployment date:** Miro column "26TH NOV DEPLOYMENT (SIT Testing: TBC, UAT Testing: TBC, Target Deployment: TBC)"; card "- To deploy on:" (blank). Jira "Exp. Deploy Date (cf 10087): —".
10. **Test env:** Miro "- Test Env: staging/uat1". Dev note for sister ticket 11982: "the code changes are not in eAuto so they apply to all staging environments" (Teams 2026-08-20 12:20).
11. **Estimate:** Jira "[QA] Est Man-day (cf 10081): 6"; Miro "Est. Testing Mandays:  6 days (1 QA)" = "Base Testing Time: 4 days" + "Buffer (Req Change + Bug Fix + Retest Bug): 2 days". Senior QA, eAuto QAs 2026-08-07 12:37: "6days + 2days total of 8days ya for 2QAs".
12. **Jira "ETA for Testing (cf 10057):** 2026-08-12" — date already past; not updated since. `[from EAINT-11868-jira.md item 7]`
13. **Created:** 2026-07-01.

## Changes since last study (2026-10-27)

### A. Latest re-check — capture "27/10/2026, 6:48:57 pm" vs capture "27/10/2026, 5:25:37 pm"

1. **Status:** no change — "Code Review". Jira "Updated" still "2026-10-19T09:20:58.787+0800".
2. **Fix version:** no change — "[QA]Ready for Testing Tickets (2026-11-02)".
3. **Description:** no change — same 2 Figma links + SRD table V0.1 to V1.4.
4. **New comments:** none — "## Comments (0)".
5. **New attachments:** none — same 13 files; latest still SRD v1.4 ("2026-08-26T09:42:57.604+0800").
6. **Other fields:** no change — "Exp. Deploy Date (cf 10087): —", "ETA for Testing (cf 10057): 2026-08-12", "[QA] Est Man-day (cf 10081): 6". Links, sub-tasks, parent all "—".
7. **What triggered this re-run:** only the capture timestamp in the header line differs. [unconfirmed] the scheduler flagged the new capture time as a change. **No study content is made wrong.**
8. **Teams / repo:** no new 11868 message dated 2026-10-26 or 2026-10-27 in `_reference/teams/eAuto-QAs.md`. `lib/ticketStudies.ts` line 902 still says "(PDF not retrieved)" (already Knowledge candidates item 5).
9. **Added on this pass (old material, missed before):** QA estimate post `[eAuto QAs, 2026-08-07 12:37, Senior QA]` "for EAINT-11868 the testing effort is 6days + 2days total of 8days ya for 2QAs, if manage to build script i think can reduce the effort for this ya". See Header item 11 and Open question 15.

### B. Earlier today — capture "27/10/2026, 5:25:37 pm" vs the study of 2026-10-26

1. **Status:** no change — still "Code Review". Jira "Updated" is still "2026-10-19T09:20:58.787+0800", same as the last study. No Jira field edit found.
2. **Fix version:** no change — "[QA]Ready for Testing Tickets (2026-11-02)".
3. **Description:** no change — Figma links + SRD version table (V0.1 to V1.4).
4. **New comments:** none. "## Comments (0)".
5. **New attachments in Jira:** none. Same 13 files; latest still SRD v1.4 (26.08.2026).
6. **New fields now captured** (were not in the last study): "ETA for Testing (cf 10057): 2026-08-12"; "[QA] Est Man-day (cf 10081): 6"; "Exp. Deploy Date (cf 10087): —".
7. **New local material (not a Jira change):**
   1. SRD v1.4 **PDF and DOCX now downloaded** into the Studying folder, plus a text copy of the DOCX (`...v1.4_20260826-text.md`). The last study said "PDF/DOCX not retrieved" — now corrected (Sources read item 3).
   2. Text copies of all older SRD versions (v0.1, v0.2, v1.0, v1.1, v1.2, v1.3) now exist.
   3. Last study listed v1.4 as "docx 155040, pdf 155039" — those were Jira attachment ids, not sizes. Real sizes: docx "46320 bytes", pdf "261168 bytes".
8. **Corrections made from the official v1.4 text** (previous study used a text copy from a reference pack):
   1. SRD §2.2.3 Affected Pages listed in full (4 rows, incl. new "Reactivation Confirmation Page").
   2. New conflicts found: 5 vs 6 email templates; who pays RM108 on re-expiry (Assignee vs UCD); "assignee" vs "all BO users" for Extend; v1.3 date in SRD vs Jira. See Open questions 9 to 12.
9. **New repo knowledge since last study:** `knowledge/flow-application-reactivation.md` (draft, 2026-10-26, with Charmain-repo additions 2026-10-27). It still says "The PDF/DOCX binary is not in the repo" — now out of date (Knowledge candidates item 1).

## Sources read

1. **Jira capture** `EAINT-11868-jira.md` (re-captured "27/10/2026, 6:48:57 pm"; first read at 5:25:37 pm): fields, description, 0 comments, 13 attachments. No links, sub-tasks or parent.
2. **`EAINT-11868-jira-comments.md`** (2026-10-26): "No comments."; "No sub-tasks, no issue links, no remote links."
3. **SRD v1.4 (latest, 26.08.2026):**
   1. Read via `EAINT-11868_SRD__[Application] ... _v1.4_20260826-text.md` (DOCX text copy; images not kept).
   2. Binaries now present: `...v1.4_20260826.docx`, `...v1.4_20260826.pdf`. PDF not opened separately; DOCX text copy used.
   3. Older text copy `EAINT-11868-SRD-v1.4-20260826-text.txt` (from the reference E2E pack) — used by the last study.
4. **Older SRD versions** v0.1 (2 copies), v0.2, v1.0, v1.1, v1.2, v1.3 — text copies exist; **not re-read** (v1.4 supersedes; its revision table lists each change).
5. **Miro card** `EAINT-11868-miro-card.md` (board capture 2026-10-26).
6. **Teams:**
   1. `_reference/teams/EAINT-11868-11982-Application-Expiry-Extension-Reactivation.md` (2026-07-22 to 2026-09-21), via the last study.
   2. `EAINT-11868-teams-since-2026-10-16.md` (sweep to 2026-10-26 10:50): CR group had no messages; eAuto QAs status posts only.
   3. `_reference/teams/eAuto-QAs.md` and `eAuto-Secarang-Main-Group.md` — grep "11868" (2026-10-27 re-check). No posts dated 2026-10-26 or later.
   4. `EAINT-11868-related-history.md` (2026-10-27) — read for context; not changed.
7. **Jira EAINT-11982** (sister ticket, Extend) — Done, fix version S33.1-20260902 (via last study).
8. **Knowledge:** `knowledge/README.md`; `knowledge/flow-application-reactivation.md`; `knowledge/flow-ucd-onboarding.md`; `knowledge/teams-decisions-by-ticket.md` § EAINT-11868 / 11982; `knowledge/cr-ledger.md` row 23; `knowledge/environments-history.md`; `knowledge/people-and-roles.md`; `lib/ticketStudies.ts` entry EAINT-11868; `lib/eautoFlows/modules/onboarding.ts` flow "expiry-extension-reactivation" (via last study).
9. **Not present:** `_reference/tickets/EAINT-11868/` folder; OneDrive EAINT-11868 folder. Figma links not opened.

## What changes

1. **Portal / module (SRD §2.2.1):** "Portal | Potential UCD"; "Module | UCD Application Form".
2. **Three parts (SRD §2.1.1, verbatim):** "Implement three enhancements to the eAuto Application flow for potential UCDs: automated reminder emails, a one-time application expiry extension, and application link reactivation."
3. **Why (SRD §2.1.2, verbatim):** "Reduce onboarding drop-off by proactively reminding UCDs of pending actions, give assignees flexibility to extend an application once, and allow expired application links to be reactivated after payment."
4. **Affected pages (SRD §2.2.3, verbatim):**
   1. "Application (Assignee / BackOffice view) | Extend button and entry of extension remarks."
   2. "Application – Right Sidebar | Display of extension remarks."
   3. "Email Templates | 6 email templates to be provided / updated" — approval reminder, expiry 2 months, expiry 1 month, payment, hardcopy, reactivation email. "Note: A button will be added in the existing expiration email template for application reactivation."
   4. "Reactivation Confirmation Page | Redirect to a new tab for the UCD to confirm application link reactivation."
5. **Extension part already shipped** as **EAINT-11982** on 2 Sept 2026. `[from Teams, 2026-08-20 10:52, BA]` "BA has confirmed with Ops to deploy extension feature first". [unconfirmed] 11868 now delivers reminders + reactivation; extension = regression.
6. **Reminder emails (SRD §2.2.4.1):** sender "imonitor@eauto.my", CC "apply@eauto.my".
   1. Item 1 — "Reminder email is sent automatically 3 days after application approval when the application is still incomplete."
   2. Item 2 — "Reminder email is sent automatically 2 months before the application expiry date."
   3. Item 3 — "Reminder email is sent automatically 1 month before the application expiry date."
   4. Item 4 — "Payment reminder email is sent automatically 1 day after Softcopy Docs = "Checked" when no payment has been received."
   5. Item 5 — "Hardcopy reminder email is sent automatically 3 days after payment is completed."
   6. Item 7 — "Reminder email is sent automatically upon reactivation."
   7. Item 8 — "Each reminder fires once on its scheduled date; the cycle restarts after extension or reactivation."
7. **Email subjects (SRD §2.2.4.2, verbatim):**
   1. Email 1: "[Application No] [Company Name]: Reminder - Submit Required Documents in Application"
   2. Email 2: "[Application No] - [Company Name]: Reminder - Two Months Remaining to Submit Required Documents in Application"
   3. Email 3: "[Application No] - [Company Name]: Final Reminder - One Month Remaining to Complete Your Application"
   4. Email 4: "[Application No] - [Company Name]: Reminder - Complete Payment for Your eAuto Application"
   5. Email 5: "[Application No] - [Company Name]: Follow-Up Reminder - Submission of Original Hardcopy Document"
   6. Email 2 and 3 "Sending Condition": "This reminder email shall NOT be sent when the "Hardcopy & Acc Created" status is NOT "Registered" and "Pending Assignee"."
   7. [Expiration Date] format: "DD MMMM YYYY ⏎ E.g.: 10 September 2025"; bodies say expiry "at 12:00 PM".
8. **Reactivation (SRD §2.2.6):**
   1. Item 1: "On the 1st click, the UCD pays the Pre-Application (AP) fee." / "On the 2nd click, the UCD is redirected to the (reactivated) application form."
   2. Item 3: fee "RM108"; link valid "for 90 days , calculated from the payment date"; "Create a new Pre-Application (PA) record for each reactivation."; "same application link".
   3. Item 4: "Only the latest Pre-Application (PA) record shall retain the application link."
   4. Item 5: "There is no maximum limit on the number of reactivations."
   5. Item 7: expired email body starts "Dear Sir / Madam, ⏎ We regret to inform you that your application has expired due to no action being taken within the stipulated validity period of 90 days, which expired on [Expiration Date] at 12:00 PM." plus "[Reactivate Application button]".
   6. Item 8: "The application status returns to Approved."; "The Application Expiry Date is updated in the Application Listing."; "SSM data refresh — triggered only before Step 4" (director IC files, director count, e-Invoice PIC, editability; BO error "Unable to proceed" / "Submission failed. Please try again." / "This field is required.").
   7. Item 9: "A failed-payment reactivation PA record does not appear in the PA listing." / "The onboarding link remains available on the latest expired PA record."
9. **Extension (SRD §2.2.5, 11 items)** — shipped via 11982; regression only. Key: "one (1) 30-day extension only"; "No automated email is triggered by the extension action."; status "returns to Approved"; 18 blocked BO users; concurrent-click message "Action could not be completed because some details have changed. Please refresh and try again."

## New vs existing behaviour

1. **Existing (SRD §2.2.2 #1, verbatim):** "There are currently no automated reminders sent to potential UCDs, no mechanism for an assignee to extend an application before it expires, and expired application links cannot be reactivated." (Extension now exists via 11982.)
2. **New (SRD §2.2.2 #2, verbatim):** "The system sends automated reminder emails at defined triggers, allows the assignee to extend an application once, and allows expired application links to be reactivated via email after payment (valid for 90 days from payment date)."
3. **Prod code today:** "Ask eAuto (prod code, 2026-10-23) confirms there is no reminder email type and no reminder job. Only the after-expiry email exists." `[from lib/eautoFlows/modules/onboarding.ts, via flow-application-reactivation.md line 4-6]`
4. **Daily expiry job:** "The daily 12:00 AM cron job flips the status once that date has passed." `[from Teams, 2026-08-26 15:58, dev]`
5. **Reactivation not on QA instance (Aug 2026):** "not deployed to the QA instance" `[charmain-repo, via flow-application-reactivation.md §10 item 14; no date]`. **Still true 2026-10-27:** "not deployed yet" [Faizuddin, dashboard chat, 2026-10-27].

## QA scope (Miro card + SRD)

1. **Miro (verbatim, key lines):**
   1. "Modules:" "Application form"; "Reactivation Flow"; "Reminder Emails (Reactivation)"; "Compete E2E cycle testing trigger from different entry point".
   2. "30 days > no reactivation email > 60days > no reactivation email > 90 days > send reactivation email"
   3. TS01–TS04: reactivation when Application Status = Pending / Approved / Rejected / Expired, each "> Payment = OK -> ... Reactivation = Approved" (TS01 also "verify e-Invoice / Invoice -> verify MyInvois").
   4. "TS05: Special TS: extend once → expire → reactivate → expire → reactivate"
   5. "TS06: Payment = Failed"; "TS07: LHDN Failed , e-Invoice not available".
   6. "click btn > UCD make payment > create new PA record > SSM checking"; "roc , rob > purchase SSM"; "trading > to upload trading license".
   7. "TS08: PA (A) -> A -> Expired -> Reactivation -> create PA(B) , PA(B) = A but not PA(A)"
   8. Reminders: "3days after approval of Application- to submit required softcopy docs"; "approval within 3days - docs completed"; "2months before expiry"; "1 month before expiry"; "No expiry if application complete"; "1day - to complete payment (after Assignee verify Softcopy , Softcopy Docs = Checked, Registration Fee = Pending UCD)"; "3days after payment".
   9. "E2E - Existing Application (include email reminder)"; "Regression"; "Business Type - to cover all 5business types?"
2. **SRD:** §2.2.4 (8 items + 5 email specs), §2.2.5 (11 items, extension — regression), §2.2.6 (9 items, reactivation).
3. **QA progress (Teams eAuto QAs, Senior QA status posts):** 2026-10-16 "To study SRD & provide estimation effort ... Not Ready for Testing"; 2026-10-19 EOD "Ready for Testing" once; 2026-10-20 to 10-22 "To continue study SRD To continue draft test scenarios and test script once have capacity CR Testing Progress : Not Ready for Testing". 2026-10-23 and 10-26: "FYI Azila on MC today".

## Affected regression areas

1. **EAINT-11982 Extend** (button conditions, one-time, date maths, blocked BO users, concurrent click, audit log, greyed-after-extend). See `knowledge/flow-application-reactivation.md` §4 and §10.
2. **Daily expiry job** + existing "Application Link Expired" email (now with Reactivate button).
3. **Pre-Application payment** (RM108) — shares the payment step with EAINT-12153 / 12257 channels.
4. **PA listing / Application listing** (new PA per reactivation, expiry date column).
5. **SSM refresh** on Application steps 2–4; e-Invoice / MyInvois.

## Test data / env needs

1. **Time travel:** reminders fire at 3 days, 1 day, 1–2 months before expiry, 90 days. **Updated 2026-10-27:** "cannot run cron on demand, but can request the interval. for testing, we usually set it every 30 mins, starting on the hour" [Faizuddin, dashboard chat, 2026-10-27]. So: ask the developer to set the reminder cron to **every 30 mins, on the hour** on staging; dates still need a dev patch or the support tool (item 7). [unconfirmed] the cron reads stored dates, so a patched date fires at the next :00 or :30 run. 11982 QA used the support tool "Reset Application Expiry Date"; "the status only follows at the midnight job" `[charmain-repo, via flow-application-reactivation.md §10 Test data item 2]`.
2. **Mailtrap / inbox** for 5 reminder emails + updated expired email (sender "imonitor@eauto.my").
3. Applications in each status (Pending, Approved, Rejected, Expired) and all 5 business types.
4. **Full dealer journey per record** (Pre-Application, payment, approval, registration documents), hand-ticked reCAPTCHA, bank simulator; each extension spends the record `[charmain-repo, via flow-application-reactivation.md §10 Test data item 1]`.
5. **BO blocked-user accounts** (SRD §2.2.5 item 9). `[from Teams, 2026-08-26 16:58, Senior QA]` "these accounts are only available in Production; we cant test them in staging unless we create accounts with the same usernames."
6. Application fee on staging = production amount. `[from Teams, 2026-09-01 14:31, senior dev]`

7. **Added 2026-10-27 (Scribe's question) — support tool location:** "`http://172.30.202.23:8888/eauto-support/obs/reset-expiry` takes an application trx no and an expiry date and sets it" `[from _reference/automation code/Pre-Application & Application/eAuto-PreApplication-to-Registered-E2E-Flow-Pack/04-reference/automation-README-full.md, line 1572]`. Needs "the **VPN**", "an **ADMIN-only portal sign-in** of its own", and "it sets a **date** — the time of day comes from the record's existing expiry" (line 1467–1469). Path is **/obs** only; no /uat1 path found in the repo. It changes the expiry date only. **Cron cannot be run on demand; the interval can be requested** [Faizuddin, dashboard chat, 2026-10-27] — see item 1.
8. **Added 2026-10-27 — no staging-deploy evidence for 11868:** Jira search (text ~ "reactivation" OR "11868") returns no QA-Issue or linked ticket under 11868. Last 11868 deploy message is Teams 2026-09-21 09:06 (dev); no "ready in staging" message for 11868 in the CR group to 2026-10-26. **Confirmed 2026-10-27:** "not deployed yet" [Faizuddin, dashboard chat, 2026-10-27].

## Dependencies / related tickets

1. **EAINT-11982** (Extend, Done 2026-09-02). **EAINT-12235** (Extend button bug, QA-Issue under 11982). EAINT-12226, EAINT-12245 (11982 QA issues, per charmain-repo).
2. **EAINT-11829** (expiry job must not expire Registered), **EAINT-12346** (patch Registered expired).
3. **EAINT-12153 / 12257** — reactivation pays RM108 through the same payment step.
4. SRD §1.5: **EAUTO-947** "ENHANCEMENT REQUEST FOR PRE-ONBOARDING AND ONBOARDING (REMINDER, EXTENSION & REACTIVATION)"; **CCB-824** "EAUTO / To Implement Email Reminders, Expiry Extension & Application Link Reactivation".

## Teams decisions (verbatim)

Source: `_reference/teams/EAINT-11868-11982-Application-Expiry-Extension-Reactivation.md` (to 2026-09-21) + `EAINT-11868-teams-since-2026-10-16.md` (no CR-group messages 2026-10-16 to 10-26).

1. `[2026-07-29 13:01, BA]` "UCD to pay Pre-Application (AP) fee to reactivate their Application link; Record each \"Reactivation\" as a PA record; UCD shud use same application link to continue the Onboarding journey; Latest PA & A form should reflect latest SSM document info."
2. `[2026-08-05 16:15, BA]` "For Application expiry reminder before 2 months & 1 month (Email 2 & 3), we will not send out the email when \"Hardcopy & Acc Created\" status is NOT \"Registered\" & \"Pending Assignee\"."
3. `[2026-08-20 18:33, BA]` "When a form is reactivated, the system automatically sends a reminder email. For the 2-month and 1-month reminders: a. Each reminder is triggered only on the exact scheduled date. b. Each reminder is sent only once. c. The reminder cycle resets whenever the application is extended or reactivated."
4. `[2026-08-26 16:08, dev]` "time is checked too but status will only flip at the first midnight after the expiry time has passed"
5. `[2026-08-26 16:23, BA]` "If Assignee/ any BO user clicked [Extend], System should display: [Extend] old: - New: Yes"
6. `[2026-09-21 09:06, dev]` "EAINT-11868 need deployment and morning deployment is fine"

## Open questions / conflicts

1. **Miro "30 days > no reactivation email > 60days > no reactivation email > 90 days > send reactivation email"** — no matching rule in SRD v1.4. Clarify with BA.
2. **Email 2/3 send condition** (SRD + Teams 2026-08-05): "shall NOT be sent when ... is NOT "Registered" and "Pending Assignee"" — double negative. Which Hardcopy & Acc Created states get the email? Miro says "No expiry if application complete".
3. **Scope after 11982:** SRD v1.4 still contains §2.2.5 extension. Confirm 11868 test = reminders + reactivation only, extension = regression.
4. **How to trigger time-based emails on staging** — **ANSWERED 2026-10-27:** "cannot run cron on demand, but can request the interval. for testing, we usually set it every 30 mins, starting on the hour" [Faizuddin, dashboard chat, 2026-10-27]. Still open: who patches the approval / Softcopy "Checked" / payment dates for Email 1, 4, 5. **Deferred 2026-10-27:** "i will answer this later. dwarf or elf can ask me this later" [Faizuddin, dashboard chat, 2026-10-27]. Scout does not ask again; Elf (TS) or Dwarf (automation) raises it when needed.
5. **QA owner:** Jira QA = Azila; Miro QA blank. Azila on MC 2026-10-23 and 10-26. Who tests for 26 Nov?
6. **Test env:** Miro "staging/uat1" vs 11982 dev note "apply to all staging environments".
7. **Payment reminder trigger:** SRD "1 day after Softcopy Docs = "Checked""; Miro adds "Registration Fee = Pending UCD". Confirm both.
8. **12:00 PM vs midnight:** emails say expiry "at 12:00 PM"; dev says status flips "at the first midnight after the expiry time has passed".
9. **NEW — 5 vs 6 templates:** SRD §2.1.3 "Ops team to provide 5 email templates in total: 6 reminder scenarios."; §2.2.4.1 item 6 "5 email templates (one per scenario above)"; §2.2.3 "6 email templates to be provided / updated". [unconfirmed] 6 = 5 reminders + updated expired email.
10. **NEW — who pays RM108 on re-expiry:** SRD §2.2.5 item 3 "the Assignee must pay the RM108 reactivation fee"; SRD §2.2.6 item 6 "the potential UCD is required to pay RM108". [unconfirmed] UCD pays (matches §2.2.6 item 1).
11. **NEW — who can Extend:** SRD §2.2.2 #2 "allows the assignee to extend an application once" vs §2.2.5 item 9 "All BO users are allowed to view and click the [Extend] button, except the following". Also flagged in `flow-application-reactivation.md` §10 Conflicts item 3.
12. **NEW — Email 1 subject separator:** Email 1 has no " - " between [Application No] and [Company Name]; Emails 2–5 do. Check the build.
13. **NEW — SRD v1.3 date:** SRD revision table "1.3 | 10.08.2026 (Mon)"; Jira description "11.08.2026 (Tues) | V1.3"; file name "_v1.3_20260811". Cosmetic.
14. **NEW — Jira ETA for Testing "2026-08-12"** is stale against Miro 26 Nov (all TBC).
15. **NEW — effort / headcount mismatch:** Jira "[QA] Est Man-day (cf 10081): 6" and Miro "6 days (1 QA)" vs Senior QA (eAuto QAs, 2026-08-07 12:37) "total of 8days ya for 2QAs". Which figure is current is not recorded. The tentative plan (eAuto QAs, 2026-08-07 16:07, QA lead) named one QA: "20th Aug (Morning) ... EAINT-11868 - Azila".

## Suggested test focus

1. **Reactivation happy path** per Application Status (Miro TS01–TS04): email button → confirmation page in new tab → RM108 → new PA record → status Approved → listing expiry = payment date + 90 days → reminder on reactivation.
2. **PA linkage** (TS08): only latest PA holds the link; old PA has none.
3. **Failed payment** (TS06): no PA in PA listing; link stays on latest expired PA.
4. **Loop** (TS05): extend once → expire → reactivate → expire → reactivate; Extend not offered after reactivation.
5. **SSM refresh** before Step 4: director added/removed, IC files, e-Invoice PIC cleared, BO "Unable to proceed" popup.
6. **Each reminder email:** trigger day, single send, cycle reset after extend/reactivate, subject/body/sender/CC, [Expiration Date] format and "12:00 PM".
7. **Email 2/3 suppression** across Hardcopy & Acc Created states once the condition is clarified.
8. **Regression:** 11982 Extend rules; expired email; Pre-Application payment channels.

## Existing repo knowledge / automation to reuse

1. `knowledge/flow-application-reactivation.md` — draft flow for all three parts + Charmain 11982 notes.
2. `lib/eautoFlows/modules/onboarding.ts` — flow "expiry-extension-reactivation".
3. `knowledge/flow-ucd-onboarding.md` — onboarding journey; Azila's EAINT-11868 suite (team repo eauto-qa-gpt, branch consolidate-azila, `azila-source/by-ticket/eaint-11868-pre-application/`).
4. `_reference/automation code/Pre-Application & Application/eAuto-PreApplication-to-Registered-E2E-Flow-Pack/` — reference E2E pack incl. `04-reference/e2e-scenarios.md` and `EAINT-11982-SRD-v1.0-text.txt`.
5. `_reference/codebases/eauto-qa-charmain/` — 11982 Extend suite, direct regression base (`knowledge/script-inventory-team.md`).
6. `scripts/eauto-preapp/` + `app/eauto/preapp/` — Pre-Application creation (RM108 payment leg).
7. `knowledge/mailtrap.md` — email checks.

## Knowledge candidates

1. `knowledge/flow-application-reactivation.md` line 19 "The PDF/DOCX binary is not in the repo." is out of date — SRD v1.4 PDF + DOCX + text copy are now in `_reference/tickets/Studying/EAINT-11868/` (Jira capture 2026-10-27).
2. SRD v1.4 §2.2.3 Affected Pages row 4 "Reactivation Confirmation Page | Redirect to a new tab for the UCD to confirm application link reactivation." — already in the flow file §5a; no action.
3. Conflict: SRD §2.2.5 item 3 "the Assignee must pay the RM108 reactivation fee" vs §2.2.6 item 6 "the potential UCD is required to pay RM108" — add to `flow-application-reactivation.md` §7.
4. Conflict: SRD §2.1.3 "5 email templates in total: 6 reminder scenarios" vs §2.2.3 "6 email templates to be provided / updated" — add to `flow-application-reactivation.md` §7.
5. `lib/ticketStudies.ts` EAINT-11868 `srd.file` still says "(PDF not retrieved)" — now retrieved.
