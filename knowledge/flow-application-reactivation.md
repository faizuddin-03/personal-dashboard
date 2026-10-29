# Application reminder emails, expiry extension and link reactivation (flow)

**Draft — not yet walked on a live environment (2026-10-26).** EAINT-11868 is in
Code Review; production has no reminder job: "Ask eAuto (prod code, 2026-10-23)
confirms there is no reminder email type and no reminder job. Only the
after-expiry email exists." `[from lib/eautoFlows/modules/onboarding.ts line 652]`.
The Extend part shipped separately as EAINT-11982 (2 Sept 2026).

Tickets: **EAINT-11868** "🔴[eAuto-Application] To Implement Email Reminders &
Application Link Reactivation" and **EAINT-11982** (Extend, Done).
Portal: Potential UCD (Application form) + BackOffice Application details.
Context: the onboarding journey in [flow-ucd-onboarding.md](flow-ucd-onboarding.md);
summary mirror in `lib/eautoFlows/modules/onboarding.ts` flow
"expiry-extension-reactivation".

Tag used on every behaviour line: `[unconfirmed — from <source>, not seen live]`.
SRD = SRD v1.4, 26.08.2026, text copy
`_reference/tickets/Studying/EAINT-11868/EAINT-11868-SRD-v1.4-20260826-text.txt`
(page numbers = the `=== PAGE n ===` markers). The PDF/DOCX binary is not in the repo.

## 1. Why this flow matters

1. SRD §2.1.1 (p.7): "Implement three enhancements to the eAuto Application flow for
   potential UCDs: automated reminder emails, a one-time application expiry
   extension, and application link reactivation."
2. SRD §2.2.2 (p.9), existing: "There are currently no automated reminders sent to
   potential UCDs, no mechanism for an assignee to extend an application before it
   expires, and expired application links cannot be reactivated." (Extension now
   exists via EAINT-11982.)
3. Reactivation creates a new Pre-Application (PA) record and takes an RM108
   payment, so it touches the PA listing, the payment step (EAINT-12153 / 12257)
   and SSM data.

## 2. Base timing rules (shared by all three parts)

1. Link life: "[Expiration Date] Refers to the expiry date of the onboarding form,
   which is valid for 90 days from the created date of the onboarding form. Date
   format: DD MMMM YYYY" `[unconfirmed — from SRD §2.2.4.2 Field Definitions item 3, p.13]`
2. Emails state expiry "at 12:00 PM" `[SRD Email 1–4 bodies, p.14–19]`.
3. Expiry job: "The daily 12:00 AM cron job flips the status once that date has
   passed." `[from Teams EAINT-11868 & 11982, 2026-08-26 15:58, Lim Xiwei (dev)]`;
   "time is checked too but status will only flip at the first midnight after the
   expiry time has passed" `[same, 2026-08-26 16:08]`.
4. Extend button visibility is real time, not cron: "the Extend button is not based
   on cronjob, its checked in real time every time the page loads based on db data"
   `[same, 2026-08-26 15:18, dev]`.

## 3. Reminder emails (EAINT-11868, new)

### 3a. Triggers — SRD §2.2.4.1 (p.11–12)

`[unconfirmed — from SRD v1.4 §2.2.4.1, not seen live]`

| # | Email | Trigger (SRD acceptance criteria, verbatim) |
|---|---|---|
| 1 | Application approval reminder | "Reminder email is sent automatically 3 days after application approval when the application is still incomplete." |
| 2 | Expiry reminder (2 months) | "Reminder email is sent automatically 2 months before the application expiry date." |
| 3 | Expiry reminder (1 month) | "Reminder email is sent automatically 1 month before the application expiry date." |
| 4 | Payment reminder | "Payment reminder email is sent automatically 1 day after Softcopy Docs = "Checked" when no payment has been received." |
| 5 | Hardcopy submission reminder | "Hardcopy reminder email is sent automatically 3 days after payment is completed." |
| 7 | Reminder on reactivation | "Reminder email is sent automatically upon reactivation." |
| 8 | Scheduling | "Each reminder fires once on its scheduled date; the cycle restarts after extension or reactivation." |

Teams wording of item 8: "For the 2-month and 1-month reminders: a. Each reminder is
triggered only on the exact scheduled date. b. Each reminder is sent only once.
c. The reminder cycle resets whenever the application is extended or reactivated."
`[from Teams EAINT-11868 & 11982, 2026-08-20 18:33, Yi Link Lim (BA)]`

Email 2 and 3 sending condition (SRD p.16 and p.18, verbatim): "This reminder email
shall NOT be sent when the "Hardcopy & Acc Created" status is NOT "Registered" and
"Pending Assignee"." — see §7 item 2 (double negative).

### 3b. Email specs — SRD §2.2.4.2 (p.13–21)

All: Sender "imonitor@eauto.my"; To "Potential UCD's registered email address
(retrieved from the Application details)."; CC "apply@eauto.my".
`[unconfirmed — from SRD v1.4 §2.2.4.2, not seen live]`

| Email | Subject (verbatim) | SRD page |
|---|---|---|
| 1 Completion (after approval) | "[Application No] [Company Name]: Reminder - Submit Required Documents in Application" | p.14 |
| 2 Expiry, 2 months | "[Application No] - [Company Name]: Reminder - Two Months Remaining to Submit Required Documents in Application" | p.15 |
| 3 Expiry, 1 month | "[Application No] - [Company Name]: Final Reminder - One Month Remaining to Complete Your Application" | p.17 |
| 4 Payment | "[Application No] - [Company Name]: Reminder - Complete Payment for Your eAuto Application" | p.19 |
| 5 Hardcopy | "[Application No] - [Company Name]: Follow-Up Reminder - Submission of Original Hardcopy Document" | p.20 |

1. Email 1 subject has no " - " between number and name; Emails 2–5 do. Example
   given: "NA50000802 ABC Motors Sdn Bhd: Reminder - Submit Required Documents in
   Application" (p.14). Check which the build uses.
2. Placeholders: [Application No] (e.g. NA50000802), [Company Name], [Expiration Date],
   [Application Link], [Payment Link] (Email 4 only) — SRD p.13.
3. Bodies are in the SRD text file; "Email content is to be provided by the Ops team
   based on the samples below." (p.13). SRD §2.1.3 (p.7): "Ops team to provide 5 email
   templates in total: 6 reminder scenarios."
4. Assert bodies per [data-verification-standard.md](data-verification-standard.md) and
   read them from Mailtrap ([mailtrap.md](mailtrap.md)).

## 4. Expiry extension (EAINT-11982 — shipped, regression for 11868)

`[unconfirmed — from SRD v1.4 §2.2.5, p.22–26, not seen live by us; EAINT-11982 passed QA on staging/uat4 + staging/obs per Teams 2026-09-01 08:57, Charmain]`

1. **Button shows** when "a. The UCD can submit registration documents (Softcopy &
   Hardcopy) after Application Status = Approved; AND b. The "Hardcopy & Acc Created"
   status is NOT "Registered"." (item 1). Hidden when Hardcopy = "Registered" (item 2).
2. **One time:** "Each application is eligible for one (1) 30-day extension only." (item 3)
3. **Loop:** "Application Expired → Extended → Expired → Reactivated → Expired Again →
   Reactivated (No Extension Allowed)" (item 3).
4. **No email:** "No automated email is triggered by the extension action." (item 4)
5. **Remarks:** entered on extend, shown on the right sidebar (item 5).
6. **New expiry date** (item 6), example expiry 1 Aug 2026:
   1. Before expiry (2 Jul – 1 Aug): "Original expiry date + 30 days = New expiry date."
   2. After expiry (1 Aug – 1 Nov): "New expiry date starts counting from the date the
      [Extend] button is clicked." Example: "If BO extends on 15 Sep 2026 ... New expiry
      date = 15 Oct 2026".
7. **Status:** "The application status returns to Approved when the application is extended." (item 7)
8. **Window:** "The Extend button is no longer displayed once the 3-month extension
   window (after the expiry date) has passed." (item 8)
9. **Blocked BO users** (item 9): eautohamal, eautojenilyn, eautojrjaya, eautonashwa,
   eautoshamini, eautovegas, eautoxiayuan, kokping, tempstaff, wahidahzaki, mfnabila,
   mfnadhirah, mfzuhaira, eautochinwei, mfaliah, mfmaisarah, mfnicholas, mfteckyung.
   "these accounts are only available in Production; we cant test them in staging
   unless we create accounts with the same usernames." `[from Teams, 2026-08-26 16:58, Charmain Ea Chiang]`
10. **Listing:** Application Listing expiry date updated (item 10).
11. **Concurrent click** (item 11): second click fails with "Action could not be
    completed because some details have changed. Please refresh and try again."
12. **Audit log:** "[Extend] old: - New: Yes" `[from Teams, 2026-08-26 16:23, Yi Link Lim]`.
13. Known bug: EAINT-12235 "Extend button disappears after extending instead of
    turning grey" (High) `[from Teams, 2026-08-28 09:02, Charmain]`.

## 5. Link reactivation (EAINT-11868, new)

`[unconfirmed — from SRD v1.4 §2.2.6, p.27–31, not seen live]`

### 5a. Steps

1. Application expires (daily 12:00 AM job). The existing expired email is sent, now
   with a **[Reactivate Application]** button (item 7). Updated body (p.28–29) starts
   "Dear Sir / Madam, We regret to inform you that your application has expired due to
   no action being taken within the stipulated validity period of 90 days, which
   expired on [Expiration Date] at 12:00 PM."
2. UCD clicks the button → "opens a new tab displaying the reactivation confirmation
   page" (item 1). SRD §2.2.3 item 4 (p.10): "Reactivation Confirmation Page | Redirect
   to a new tab for the UCD to confirm application link reactivation."
3. UCD confirms (item 2).
4. "On the 1st click, the UCD pays the Pre-Application (AP) fee." (item 1b) — RM108 (item 3).
5. On success (item 3): link reactivated "for 90 days, calculated from the payment
   date"; "A new Pre-Application (PA) record/transaction shall be created for each
   successful reactivation."; UCD continues "using the same application link".
6. "On the 2nd click, the UCD is redirected to the (reactivated) application form." (item 1c)
7. Reminder email on reactivation fires (§3a item 7).
8. After reactivation (item 8): "a. The application status returns to Approved.
   b. The Application Expiry Date is updated in the Application Listing."

### 5b. Branches

1. **Payment failed** (item 9): "A failed-payment reactivation PA record does not
   appear in the PA listing." / "The onboarding link remains available on the latest
   expired PA record."
2. **Extended application expires again** (item 6): "pay RM108 to reactivate the link
   again" — 90 days from payment; no further extension (§4 item 3).
3. **No limit** (item 5): "There is no maximum limit on the number of reactivations."
4. **PA linkage** (item 4): "Only the latest Pre-Application (PA) record shall retain
   the application link. Previous PA records shall no longer contain the application link."
   Teams origin: "In backend, Application only allowed to be tied with latest PA (v2).
   PA (v1) will not have the application link." `[from Teams, 2026-07-29 13:01, Yi Link Lim]`

### 5c. SSM refresh after reactivation (item 8c, p.30–31)

"SSM data refresh — triggered only before Step 4:"

1. "At Step 2, director IC files are matched to each director's name."
2. "If a director is removed, their existing IC file is removed along with them."
3. "A newly added director has no ID file by default."
4. "The director count is overwritten based on the latest SSM data."
5. "For the e-Invoice PIC, the "Same as Director/Business Owner in Charge" selection is not stored."
6. "It is cleared through name matching only when the e-Invoice contact name matches
   the previous Director-in-Charge and that director has changed."
7. Reverted form: SSM-changed fields "are added to the reverted-fields set so the UCD can edit them."
8. Submitted-for-Approval form: UCD cannot edit; on BO Submit for Approval an error
   popup "Unable to proceed" with "Submission failed. Please try again."; after OK,
   "This field is required." on each blank required field.

## 6. Planned test scenarios (Miro)

From the Miro card, column "26TH NOV DEPLOYMENT", "Test Env: staging/uat1"
`[from _reference/tickets/Studying/EAINT-11868/EAINT-11868-miro-card.md]`:

1. "TS01: Reactivation when Application Status = Pending > Payment = OK -> SSM Checking
   = OK > Reactivation = Approved -> verify e-Invoice / Invoice -> verify MyInvois"
2. TS02–TS04: same for Approved / Rejected / Expired.
3. "TS05: Special TS: extend once → expire → reactivate → expire → reactivate"
4. "TS06: Payment = Failed"; "TS07: LHDN Failed , e-Invoice not available"
5. "TS08: PA (A) -> A -> Expired -> Reactivation -> create PA(B) , PA(B) = A but not PA(A)"
6. Reminder lines include "No expiry if application complete" and "1day - to complete
   payment (after Assignee verify Softcopy , Softcopy Docs = Checked, Registration Fee =
   Pending UCD)".
7. "Business Type - to cover all 5business types?"

## 7. Open conflicts and questions

1. **Miro "30 days > no reactivation email > 60days > no reactivation email > 90 days >
   send reactivation email"** — no matching rule in SRD v1.4.
2. **Email 2/3 condition double negative** — "shall NOT be sent when ... is NOT
   "Registered" and "Pending Assignee"" (SRD p.16, p.18; Teams 2026-08-05 16:15). Which
   Hardcopy & Acc Created states actually get the email? Miro adds "No expiry if application complete".
3. **Payment reminder trigger:** SRD = Softcopy Docs "Checked" + no payment; Miro adds
   "Registration Fee = Pending UCD". Confirm both.
4. **12:00 PM vs midnight:** emails say the link expires "at 12:00 PM"; dev says status
   flips "at the first midnight after the expiry time has passed". Which moment does the
   UCD see as expired?
5. **Email 1 subject separator** differs from Emails 2–5 (§3b item 1).
6. **Time-based triggers on staging:** 3 days, 1 day, 1–2 months — needs DB date patch or
   a manual cron call. Not documented.
7. **Scope after 11982:** SRD v1.4 still holds §2.2.5 Extend. Confirm 11868 tests =
   reminders + reactivation; Extend = regression.
8. **QA owner:** Jira QA = Siti Nur Azila; Miro "QA:" blank. Azila status "Not Ready for
   Testing" through 2026-10-22 `[from Teams eAuto QAs sweep, EAINT-11868-teams-since-2026-10-16.md]`.
9. **Test env:** Miro "staging/uat1" vs dev note for 11982 "the code changes are not in
   eAuto so they apply to all staging environments" `[Teams 2026-08-20 12:20]`.
10. **Deployment:** dev "EAINT-11868 need deployment and morning deployment is fine"
    (2026-09-21 09:06); Miro 26 Nov, all dates TBC.
11. **Who pays RM108 on re-expiry (Assignee vs UCD):** SRD v1.4 §2.2.5 item 3 "If the
    application expires after the 30-day extension, the Assignee must pay the RM108
    reactivation fee to reactivate the application." vs §2.2.6 item 6 "If an application
    that was previously extended expires again, the potential UCD is required to pay RM108
    to reactivate the link again." `[from ticket EAINT-11868, SRD v1.4 DOCX text copy]`
    `[source: pipeline EAINT-11868, Scout study, 2026-10-27]`
12. **Email template count (5 vs 6):** SRD v1.4 §2.1.3 "Ops team to provide 5 email
    templates in total: 6 reminder scenarios."; §2.2.4 item 6 "5 email templates (one per
    scenario above) to be provided by the Ops team."; §2.2.3 item 3 "6 email templates to
    be provided / updated" (a. to f., f = "Reactivation email"). [unconfirmed] the 6th may
    be the updated expired email with the [Reactivate Application] button.
    `[from ticket EAINT-11868, SRD v1.4 DOCX text copy]`
    `[source: pipeline EAINT-11868, Scout study, 2026-10-27]`

## 8. Related tickets

1. EAINT-11982 — Extend (Done, S33.1-20260902); EAINT-12235 — Extend button bug.
2. EAINT-11829 — expiry job must not expire Registered; EAINT-12346 — patch Registered expired.
3. EAINT-12153 / EAINT-12257 — Pre-Application payment step (RM108 channels); see
   [flow-payment-channels.md](flow-payment-channels.md).
4. EAUTO-947 (source request), CCB-824 (CCB) — SRD §1.5.
5. Reference automation: Azila's EAINT-11868 suite (team repo eauto-qa-gpt) noted in
   [flow-ucd-onboarding.md](flow-ucd-onboarding.md); `scripts/eauto-preapp` for the RM108 leg.

### 8a. Past TS to reuse (added 2026-10-27)

Mapping from `_reference/tickets/Studying/EAINT-11868/EAINT-11868-related-history.md` § "Reusable scenarios". `[source: pipeline EAINT-11868, Scribe related history, 2026-10-27]` [unconfirmed] not yet used in a TS.

1. **11829_TS01–TS08** → expired email + **[Reactivate Application]** button per status; date set by "Ask dev to patch Submission Date to 90 days before today" (11829 sheet, R3–R19).
2. **11829_TS09** → "Each reminder fires once" (no second email after the next cron run).
3. **11829_TS10, TS11, TS14** → Email 2/3 suppression; no reactivation path for Registered.
4. **12153_TS2 / TS6 / TS8** → Miro "TS06: Payment = Failed" (§5b item 1).
5. **12153_TS10 / TS11, TS12; 12257_TS13** → 1st click pays / 2nd click opens form; reactivation PA not listed before payment, listed after.
6. **12341_E2E1** → reminder email check template (recipient, "apply@eauto.my" in CC, subject); **12341_R1** → "not sent" negative cases.
7. **11763_DIRECTOR_ROC/ROB/LLP_TS1–TS2** → SSM refresh before Step 4 (§5c).
8. Cron timing for these: see [qa-team-process.md](qa-team-process.md) §6 item 7.

## 9. Not covered

1. Reactivation confirmation page DOM and URL; BO Extend button DOM.
2. Figma designs (SRD §1.5 item 4) — not opened.
3. Which cron runs the reminders and at what hour.

## 10. Additions from Charmain's QA repo — Extend, EAINT-11982 (added 2026-10-27)

Source: read-only clone of a QA colleague's repo, `_reference/codebases/eauto-qa-charmain/` (branch consolidate-charmain, commit 0ab45d1, last commit 2026-10-13). Charmain was the 11982 QA. **Status: her notes and two draft ledgers (BO-APPLICATION-EXTEND 30 entries, BO-APPLICATION-EXTEND-BUTTON 18 entries, none with a case), not verified live by us.** Built from her pack (`vault/data/store.json`, 79 rows, TS1–TS58 + E2E TS1–TS10). (doc) = SRD states it; (obs)/(dim) = her observation or reasoning; QA rulings 2026-08-24 to 08-30 are QA decisions. Tag: `[charmain-repo: <path>:<line>]`.

### Sources
1. EAINT-11982 SRD v1.0 (2026-08-26) is "the current rule": REQ-001 to REQ-011, module "Application" (§2.2.1). Kept outside her repo because REQ-004 names 18 login ids; file name in her CR folder `EAINT-11982_SRD_v1.0_20260826.pdf`. Not in our repo. [charmain-repo: docs/modules/bo/application-extend/README.md:44] [charmain-repo: test-scenarios/bo-application-extend/bo-application-extend.md:3-8]
2. Parent 11868 SRD v1.4 §2.2.5 is "softer": after one extension the button "becomes unavailable", "hidden/disabled" as one phrase; §2.2.4.2: application valid 90 days from form creation. v1.3 (2026-08-11) had items 1–6 only. [charmain-repo: docs/modules/bo/application-extend/README.md:45-46]
3. Figma "Onboarding-form" frames 9058-29823 (Extend), 9058-30042 (pop-up), 9058-30492 (after extension); not provided as files. [charmain-repo: docs/modules/bo/application-extend/README.md:47]

### Rules from 11982 SRD v1.0 (as she quotes them)
1. REQ-006: before expiry, "Original expiry date + 30 days = New expiry date"; after expiry, click date + 30 days. Example expiry 1 Aug 2026: extended 20 July → 31 Aug; extended 15 Sept → 15 Oct. [charmain-repo: test-scenarios/bo-application-extend/bo-application-extend.md:38-50]
2. REQ-007: "Application status = Approved after the extension is completed". REQ-008: remark "saved and displayed in the right sidebar of the Application"; "The existing Remarks field behaviour in the Application shall remain unchanged". REQ-009: "No email is sent to the potential UCD or the BackOffice user after an extension". REQ-010: "Application Listing displays the new expiry date after the extension". [charmain-repo: test-scenarios/bo-application-extend/bo-application-extend.md:138-161,245-257]
3. REQ-011: second concurrent click gets "Action could not be completed because some details have changed. Please refresh and try again." [charmain-repo: test-scenarios/bo-application-extend/bo-application-extend.md:170-176]
4. REQ-001: shown "regardless of the current Softcopy Docs status and Hardcopy & Acc Created status, except when Hardcopy & Acc Created = Registered". REQ-003 window: from 30 days before expiry to 3 months after. REQ-004: excluded accounts "cannot view or click the Extend button"; "All other BackOffice users can view and click it." [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:111-118,180-199]
5. REQ-005: "The system shall stop displaying the Extend button once the application has been extended"; Example 3: reactivated → "Extend button is not displayed and no further extension is allowed". [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:153-158,167-171]

### Build behaviour and QA rulings she recorded
1. Window edges on the SRD example (expiry 1 Aug 2026): shown 2 Jul (30th day before) to 1 Nov (3 calendar months, not 90 days = 30 Oct); not shown 1 Jul or 2 Nov. First day extend → 31 Aug; last day (1 Nov) → 1 Dec. Read at 09:00 MYT so the expiry's own time does not matter. [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:211-221] [charmain-repo: test-scenarios/bo-application-extend/bo-application-extend.md:134-148]
2. After one extension the build keeps the button **greyed** with "This application has already been extended. Each application can only be extended once." (QA ruling 2026-08-26/27, matches Figma 9058-30492). The build moved twice: greyed button vanished 2026-08-27 (EAINT-12235) and at the window's far end (EAINT-12245); both put back to greyed. [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:158-166]
3. Button location: build = Registration Documents sidebar; Figma 9058-29823 = page header (where Create Account now sits); QA raised EAINT-12226. [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:302]
4. Remark is compulsory in the build and Figma (empty or spaces-only refused; one character accepted); SRD silent; QA asked BA 2026-08-27 to add it to REQ-008. Sidebar row label "Application Extended Remarks" (obs). [charmain-repo: test-scenarios/bo-application-extend/bo-application-extend.md:163-167,258-262,378]
5. Listing export carries the new date and status, never the remark (QA ruling 2026-08-26). Expiry date reads to the minute on the listing. [charmain-repo: test-scenarios/bo-application-extend/bo-application-extend.md:263-267,379-381]
6. "UCD Application Audit Log" gets one Extend row (who, old and new expiry, remark); wording from a team notice of 2026-08-26 not in either SRD. [charmain-repo: test-scenarios/bo-application-extend/bo-application-extend.md:268-272,380]
7. The build carries the expiry's **time of day** onto the new date; QA ruling 2026-08-24 said ignore it. Closing day: pack ruled date only (2026-08-24), then time of day (2026-08-30); build ends the window at the expiry moment. [charmain-repo: test-scenarios/bo-application-extend/bo-application-extend.md:387] [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:229-235,298]
8. A Probation account has no Onboarding group, so it never reaches the application. [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:246-254]
9. Pre-release applications: listing shows expiry = created date + 90 days; same window rules. [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:257-263]
10. BO-raised stubs (UCD new application screen, never through the dealer form): no Extend button, expiry "-". Measured 2026-08-30: of 129 Approved records, every one without the registration-documents page was such a stub. [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:266-273,289]
11. No BO screen can change Application Status; the sidebar shows it as text. [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:290]
12. Registered applications stop expiring; ones registered before mid-June 2026 did expire. [charmain-repo: test-scenarios/bo-application-extend/bo-application-extend.md:383]
13. Excluded accounts: her pack could sign in as 5 of the 18 on staging; 7 more exist on staging with no password held; 6 exist on no QA instance. [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:192-203,300]
14. Reactivation was "not deployed to the QA instance" per her pack (no date recorded). [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:297]

### Test data (her blockers)
1. A qualifying application needs the dealer's whole journey (Pre-Application, payment, approval, registration documents) with a hand-ticked reCAPTCHA and the bank simulator; each extension spends it for good. [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:339]
2. Standing a record at a date needs the support tool "Reset Application Expiry Date"; the status only follows at the midnight job. [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:340]
3. **Support tool address and limits:** "`http://172.30.202.23:8888/eauto-support/obs/reset-expiry` takes an application trx no and an expiry date and sets it"; "it needs the **VPN**, it is behind an **ADMIN-only portal sign-in** of its own, and it sets a **date** — the time of day comes from the record's existing expiry, which it preserves." (`_reference/automation code/Pre-Application & Application/eAuto-PreApplication-to-Registered-E2E-Flow-Pack/04-reference/automation-README-full.md` lines 1463–1469). Only an /obs address is recorded. [unconfirmed] it helps Email 2 and 3 only; Email 1, 4 and 5 count from the approval, Softcopy "Checked" and payment dates. `[source: pipeline EAINT-11868, Scribe related history, 2026-10-27]`

### Conflicts
1. Conflict: after one extension, gone or greyed. §4 item 13 of this file: "Known bug: EAINT-12235 'Extend button disappears after extending instead of turning grey'" `[from Teams, 2026-08-28 09:02, Charmain]` (greyed = expected) vs 11982 SRD v1.0 REQ-005 "stop displaying the Extend button once the application has been extended" (gone). Charmain's own Q1 flags it; the greyed choice was a QA ruling, not BA. [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:296]
2. Conflict: this file §4 tags the Extend rules as 11868 SRD v1.4 §2.2.5; Charmain treats 11982 SRD v1.0 as the current rule and v1.4 as softer ("becomes unavailable", "hidden/disabled"). [charmain-repo: docs/modules/bo/application-extend/README.md:44-45]
3. Conflict: assignee. 11982 REQ-004 "all BackOffice users" vs 11868 v1.4 "allows assignee to extend an application once"; her pack expected a non-assignee request to be refused. [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:304] [charmain-repo: test-scenarios/bo-application-extend/bo-application-extend.md:384]
4. Conflict: dealer link after a post-expiry extension. Pack QA ruling 2026-08-24 said the old link may not be reused; later runs assert it may; SRD aim says "keep a near-expiry or recently expired application active without a reactivation payment". [charmain-repo: test-scenarios/bo-application-extend/bo-application-extend.md:385]

### Open questions she raised
1. On the expiry day itself, both REQ-006 ranges contain it: original + 30 or click + 30? [charmain-repo: test-scenarios/bo-application-extend/bo-application-extend.md:389]
2. Does the 12:00 PM cutoff from the 11868 reminder emails apply to an extended date? (Links to §7 item 4 of this file.) [charmain-repo: test-scenarios/bo-application-extend/bo-application-extend.md:387]
3. Is "Expired" an allowed status for REQ-001(a), which names only Approved? [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:303]
4. Month with no matching day: does an expiry of 31 January close on 30 April? Pack adopted it; no document. [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:306]
5. 11868 v1.4 §2.2.4 item 8 says the reminder cycle resets after an extension; no subject owns it. [charmain-repo: test-scenarios/bo-application-extend/bo-application-extend.md:397]

### Her test titles not covered above (added 2026-10-27)
A colleague's Playwright test titles (`by-ticket/eaint-11982-application-expiry-extension`, 23 JS files, 107 titles), read from her intake inventory. **Tested expectations from her scripts, not verified live by us.** Titles already covered by the items above (created + 90 days, sidebar location, Registered rule, greyed after one extension, window edges, Registered rows not expiring, remark rules, concurrent confirm, Probation, BO stubs, reactivated never extended) are not repeated. Full list: `cr-ledger.md` § "Update 2026-10-27 from Charmain repo" → EAINT-11982.
1. "TS23 — the click date comes from the server, not the client @extend" [charmain-repo: intake/reports/charmain-11982.json:755]
2. "TS01.8 — extended, then Registered: the greyed button goes too (R9 beats R6)" [charmain-repo: intake/reports/charmain-11982.json:1636]
3. "TS41.1 — Approved applications show the same button whoever they are assigned to"; "TS41.2 — reassigning an application does not change the Extend button"; "TS42 — the other status columns do not gate Extend either" [charmain-repo: intake/reports/charmain-11982.json:660-662]
   - Conflict: TS41.1/TS41.2 (assignee does not matter) vs her own pack, which "expected a non-assignee request to be refused" (Conflicts item 3 above) and 11868 v1.4 "allows assignee to extend an application once".
4. "TS38.1 — the window closes under an open pop-up: REFUSED (arm A) @extend"; "TS38.2 — the assignee changes under an open pop-up: SUCCEEDS (arm B, R13) @extend" [charmain-repo: intake/reports/charmain-11982.json:1187-1188]
5. "TS50 — the Extend control is absent, and absent for the REQ-001(a) reason" (Approved, no registration documents) [charmain-repo: intake/reports/charmain-11982.json:1390]
6. "E2E_TS9 — the auto-expire job read the EXTENDED date, not the original" [charmain-repo: intake/reports/charmain-11982.json:1335]. Fits §2 item 3 (the midnight job reads the stored expiry date).
7. "TS55 — the dealer link survives the ORIGINAL expiry, and its step still submits" [charmain-repo: intake/reports/charmain-11982.json:1336]
   - Conflict: same as Conflicts item 4 above (pack ruling 2026-08-24: old link may not be reused).
8. "TS13.4 — the log is reachable through the menu handshake, and a pasted URL is not" (describe "@audit TS13 — the audit log records the extension") [charmain-repo: intake/reports/charmain-11982.json:705]
9. "TS12.1 — Cancel leaves everything untouched"; "TS12.2 — close icon (baseline says there is none)"; "TS12.3 — Esc key" (file `extend-modal.spec.js`, describe "Modal dismissal and display @modal") [charmain-repo: intake/reports/charmain-11982.json:1266-1275]
