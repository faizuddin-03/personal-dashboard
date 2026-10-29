# QA team process (from Teams)

These are the working rules of the eAuto QA team as posted in Microsoft Teams up to 2026-10-15. The file only adds what `knowledge/qa-process-from-notion-export.md` lacks. Where the two disagree, both are given and the newer Teams post is flagged.

Raw chats are in `_reference/teams/`:
1. `eAuto-QAs.md`
2. `ModeFair-QA-Automation-Engineer-Team.md`
3. `QA-Portal-Feedback.md`
4. `eAuto-Secarang-Main-Group.md`
5. `DM-May-Chin-Mei-Theng.md`
6. `DM-Charmain-Ea-Chiang.md`

Tag format: `[from Teams <chat>, <YYYY-MM-DD HH:MM>, <person>]`.

## 1. Daily posts and huddles

1. Every QA posts a "To Do Plan" each morning and an "EOD Update" each evening in the eAuto QAs group. The QA Portal and the timesheet skill read these posts from that group.
   `[from Teams eAuto QAs, 2026-09-08 10:10, May Chin Mei Theng]` "For now still need to send your Daily To Do List & EOD Update here ya because the QA Tracker & Update Timesheet skills read them here"
2. Huddles run on Monday and Wednesday. A host roster is kept in the "[QA] Huddle Host Roster" Google Sheet, and the host posts a "Huddle Agenda" per deployment date.
   `[from Teams DM Charmain Ea Chiang, 2026-07-20 09:11, Charmain]` "Please check the schedule from time to time and prepare before the Monday and Wednesday huddle ya"
3. Attending the project huddle is billable time.
   `[from Teams eAuto QAs, 2026-09-03 15:43, May Chin Mei Theng]` "attending weekly Huddle meeting to sync up the progress update of upcoming deployment tickets are billable"
4. The Friday AI session (09:30) is mandatory, and WC picks presenters at random from the QA team.
   `[from Teams ModeFair QA Automation Engineer Team, 2026-03-02 14:20, Kasturi]` `[same chat, 2026-05-18 09:22, Kasturi]` "WC has started picking random names from the QA team for presentations"

## 2. QA Portal (QA Tracker)

1. The QA Portal is at http://10.30.10.214. It works directly inside the office; outside the office it needs FortiClient VPN (set up by Fakrul). Sign-in uses the Microsoft account.
   `[from Teams eAuto QAs, 2026-09-07 20:01, Charmain Ea Chiang]` "the QA Portal is ready to use Link: http://10.30.10.214"
2. Every ticket must have the Ticket Details fields filled in the portal. `[from Teams eAuto QAs, 2026-09-14, May Chin Mei Theng]`
3. Assign the staging branch to your deployment window in the portal. `[from Teams eAuto QAs, 2026-09-15, Charmain Ea Chiang]` "please assign the branch to your deployment window in qa portal"
4. Update the ticket status as soon as testing starts; a status set in the portal is reflected in Jira. `[from Teams eAuto QAs, 2026-09-28, Charmain Ea Chiang]`
5. After a merge-down, open the environment's Release and click "merge down all". `[from Teams DM Charmain Ea Chiang, 2026-09-21]`
6. HRMS tasks with tickets go under Ticket Work so the portal can link them to the morning and EOD posts. `[from Teams QA Portal Feedback, 2026-09-10 14:27, Charmain Ea Chiang]`

## 3. Timesheet

1. Log a task only after it is done, with the actual time spent. Do not enter estimates in advance.
   `[from Teams ModeFair QA Automation Engineer Team, 2026-08-17 10:26, Kasturi]` "Log the timesheet only after the task is completed. Please do not enter estimated hours in advance."
2. "Blocked" means testing cannot run or continue. `[same chat, 2026-08-17 15:47, Kasturi]` "Blocker means it the testing cannot be execute or continue due to some reason"
3. Tag who was in each meeting.
   1. For other meetings, tag the people who attended. `[same chat, 2026-08-17 16:03, May Chin]` "only huddle no need to tag people who attend with u ya / but for other meetings, it's better to tag people who attend the meeting with u"
   2. For huddles, attendees tag the host. A host puts "Attendees: All eAuto QA, BA and Dev" in the note. `[from Teams eAuto QAs, 2026-09-11 17:44, May Chin Mei Theng]`
4. Write timesheet remarks with the `/qa-timesheet-update` skill, which was renamed from `/qa-timesheet`. Keep the Progress % visible.
   `[from Teams eAuto QAs, 2026-08-28 11:57, May Chin Mei Theng]` `[same chat, 2026-08-28 15:21, Charmain Ea Chiang]` `[from Teams eAuto QAs, 2026-09-01 10:02, May Chin Mei Theng]`
5. A ticket title containing "[eAuto Wholesale]" is logged under Project = eAuto Wholesale, not eAuto Core. `[from Teams eAuto QAs, 2026-09-03 15:52, May Chin Mei Theng]`
6. A Friday counts as 7.5 working hours because the Friday lunch is 1.5 h. `[from Teams eAuto QAs, 2026-09-04 17:43, Lee An Qi]`
7. Public holidays that show as "missed" are marked AL until the timesheet tool is fixed. `[from Teams eAuto QAs, 2026-09-01 16:16, May Chin Mei Theng]` "Meanwhile we mark it as AL first ya"
8. If any entry is tagged Blocked, the Week Wrap-Up "Additional Blockers" section must not be blank. `[from Teams eAuto QAs, 2026-09-17 10:51, May Chin Mei Theng]`
9. **CapacityTracker stopped on 2026-10-05.** `[from Teams ModeFair QA Automation Engineer Team, 2026-10-05 17:59, May Chin Mei Theng]` "starting from today no need to fill in the CapacityTracker timesheet ady ya."
   This conflicts with the `qa-timesheet-update` skill and the memory note `capacitytrack-setup.md`, which both assume weekly submission.

## 4. Estimates and test scripts

1. Estimate format:
   `[from Teams DM Charmain Ea Chiang, 2026-07-02 16:50, Charmain]` "Est. Testing Mandays: 6 days (1 QA); Base Testing Time: 4 days; Buffer (Req Change + Bug Fix + Retest Bug): 2 day"
   1. Post the estimate in eAuto QAs.
   2. Add the high-level testing scope to Miro. `[from Teams eAuto QAs, 2026-08-06 10:16, Charmain Ea Chiang]`
2. An estimate covers scripting, testing, verification, and a buffer for retests and requirement changes. `[from Teams eAuto QAs, 2026-10-01, May Chin Mei Theng]`
3. Every test script needs a Test Objective column.
   `[from Teams DM May Chin Mei Theng, 2026-08-13 15:40, May]` "we need to have Test Objective because it is to differentiate what is the purpose of each scenario"
4. Screen-recorded test evidence must be full screen, so that the date and time show.
   `[from Teams DM Charmain Ea Chiang, 2026-05-24 14:12, Charmain]` "usually you dont record the test evidence in fullscreen? cus i cant see the date and time in the recording you shared ya"
5. When writing a test script, refer back to the test script of an earlier related ticket (for example, EAINT-11934 for EAINT-12058). `[from Teams DM May Chin Mei Theng, 2026-08-13]`

## 5. Issues and Jira statuses

1. Raise QA-Issues with the `eauto-qa-issue-ticket` Claude skill. It supports three types: New-CR bug, Production issue (under EAINT-148; the BA field is required) and Wholesale.
   `[from Teams eAuto QAs, 2026-08-26 10:00, Charmain Ea Chiang]` "It now supports 3 issue types"
2. Your copy of a skill is a snapshot from the day it was added. Re-check `qa-timesheet-update` and `eauto-qa-issue-ticket` before each use. `[from Teams QA Portal Feedback, 2026-09-14 10:18, Charmain Ea Chiang]`
3. EAINT-148 is the epic "[eAuto] Existing Known Issue (Pending Client Approval)". It holds existing production issues found during CR testing.
   1. A QA-Issue found on a deployed ticket must be converted to "Bug" before it can be moved under EAINT-148. `[from Teams eAuto QAs, 2026-08-13 17:12, May Chin Mei Theng]` "u need to convert to "bug" ticket then only can move to EAINT-148 because this is an Epic ticket"
   2. An issue that also occurs in prod is parked under EAINT-148, not fixed in the CR. `[from Teams EAINT-12155, 2026-09-04 16:40, Charmain Ea Chiang]`
4. When testing is done, set the Jira status to "Ready for Prod Deployment". This includes bug tickets that need a prod deploy.
   `[from Teams eAuto QAs, 2026-08-05 17:06, May Chin Mei Theng]` `[from Teams DM May Chin Mei Theng, 2026-09-17 14:52, May]`
5. Close an invalid bug with a comment. `[from Teams DM May Chin Mei Theng, 2026-10-01]`
6. For a high-priority issue, post it in the CR group and flag it as high priority. After the fix, agree the root cause and retest scope with dev. `[from Teams DM Charmain Ea Chiang, 2026-05-05]`
7. For DB-only changes (cron intervals, config), ask dev for DB or BE screenshots from staging and prod instead of testing through the UI.
   `[from Teams EAINT-12171, 2026-09-01 14:24, Charmain Ea Chiang]` "we will need you to provide the BE screenshots so QA can verify the Cronjob running intervals ya"

## 6. Staging and shared data

1. Dev must not deploy a CR to any staging branch until QA names the branch.
   `[from Teams EAINT-12121, 2026-08-24 09:50, Charmain Ea Chiang]` "please wait for QA's greenlight ya, dont deploy to any staging env first"
2. To claim a branch, check the QA resource-planning Miro board, then confirm in eAuto QAs before telling dev. Use the same branch for every item in one deployment window.
   `[from Teams DM Charmain Ea Chiang, 2026-08-04]` The claim message has the form "I plan to use /<branch> for <date> deployment items. Does anyone have any concerns". `[from Teams eAuto QAs, 2026-09-15 to 2026-10-02]`
3. Do not deploy tickets that are not in the upcoming deployment window. `[from Teams eAuto QAs, 2026-09-08 11:53, May Chin Mei Theng]` "don't anyhow deploy tickets that are not part of upcoming deployment window"
4. Resetting shared staging data (such as failed payments) affects every QA. Check with all QAs first, or ask dev to reset only your own records.
   `[from Teams eAuto QAs, 2026-09-10 14:40, May Chin Mei Theng]` "please check with all the QAs here ya as it will affect everyone's test data in Staging Env, if no concern then u can proceed. Or else u provide & ask Brandon to reset your transactions only"
5. Ask dev to prepare an eSIM vehicle prefix for your tests. When MessageBird is switched on in staging, tell both the QA group and the Main group. `[from Teams DM Charmain Ea Chiang, 2026-08-04, 2026-08-06]`
6. Branch history and connection changes are in `knowledge/environments-history.md`.
7. **eAuto cron jobs cannot be run on demand on staging.** QA asks for the interval instead; for testing it is usually every 30 mins, starting on the hour. Do not ask Faizuddin again.
   `[Faizuddin, dashboard chat to Scribe, 2026-10-27]` "like i said before, cronjob cannot run on demand, but can set the interval. for testing, we usually set to every 30 mins with it starting on the hour"

## 7. Deployment and production support

1. Deployment session card (posted by the BA in the Main group):
   1. Night: call time 11PM for dev and 11.30PM for non-dev; maintenance page at 11PM.
   2. Morning: call time 8.30AM for dev and 8.40–8.45AM for non-dev.
   3. Participants and items are listed.
   `[from Teams eAuto & Secarang Main Group, 2026-08-17 16:33, Yi Link Lim]` `[same chat, 2026-07-31 17:56, Yi Link Lim]`
2. QA readiness message: "QA has completed testing for <KEY> on staging/<branch> (eAuto) with no outstanding issues. It's ready for <morning/night> deployment on <date> (<day>). Thanks to everyone involved!" `[from Teams EAINT-12155, 2026-09-08 11:18, Charmain Ea Chiang]` (the same form is used in all CR groups)
3. After a prod deploy, QA monitors prod until lunch or 2pm and posts a Morning or Night Support Report with per-module status. Then QA asks dev to merge the latest prod code into the other staging branches.
   `[from Teams eAuto QAs, 2026-10-01 08:59, Charmain Ea Chiang]` "i will continue monitoring production until 2pm. If everything remains stable, i will request dev to merge the latest prod code base into the other staging branches ya"
4. Post-deploy monitoring checklist for LHDN status = OK: UCD, STMS + TH, SSM, APT, eSTM + eLKM + eVOC, BMK, JomCheck Report, Service Hub. `[from Teams eAuto QAs, 2026-08-13 10:57, Charmain Ea Chiang]`
5. Prod regression for some modules needs Izni's super-admin account (`mfizni`), for example for JomCheck Report Listing and the BDP/SI listings. Any password patch on that account is done by KJ or Brandon and then reverted, and Izni or Mei Jia is told. The password itself is never posted.
   `[from Teams eAuto QAs, 2026-10-05, Faizuddin]` `[from Teams DM May Chin Mei Theng, 2026-09-15]` `[from Teams DM Charmain Ea Chiang, 2026-09-18 16:34, Faiz]`
6. The day after a night deployment, people who joined it may start work between 10:30AM and 11:30AM.
   `[from Teams eAuto & Secarang Main Group, 2026-07-09 09:02, Yi Link Lim]` "Office: eligible to start between 1030AM (able to leave as early as 0500PM) - 1130AM (able to leave as early as 0600PM)"
   On the night itself, those involved may leave 1 hour early. `[same chat, 2026-07-08 15:51, Yi Link Lim]` "may leave 1 hour earlier if there is no urgent tasks"
7. Night deployment sessions are claimed as Hardship Allowance OT. Izni posts the approval documents per sprint session. `[from Teams eAuto & Secarang Main Group, 2026-08-05 00:36, Nur Izni]` `[same chat, 2026-10-05 10:12, Nur Izni]`
8. The QA working alone on night support posts the events in the QA group. `[from Teams DM Charmain Ea Chiang, 2026-08-17]`

## 8. Leave and MC

1. MC: send a copy of the MC to the QA Lead on the same day, then submit it in ESS.
   `[from Teams ModeFair QA Automation Engineer Team, 2025-11-05 14:10, Kasturi]` "Send a copy of your MC to the QA Lead (on the same day of your medical leave)."
2. A monthly leave plan goes into "QA Leave Plan.xlsx" (QATeam > General) by the date the lead posts, about mid-month for the next month. `[same chat, 2026-03-16 09:22, Kasturi]` `[same chat, 2026-10-08 11:06, May Chin]` (Nov plan due 16 Oct, 10:00 AM)
3. **Leave of 3 days or more must be raised with the QA Lead by PM at least 1 month ahead**, even if the Excel sheet is already updated.
   `[from Teams ModeFair QA Automation Engineer Team, 2026-04-15 12:46, Kasturi]` "If you're planning to take 3 days or more leave, kindly PM the QA Lead and inform your leave plan at least 1 month in advance."
   This conflicts with the Notion export, which says 2 weeks. The Teams post is newer.
4. Apply for AL early in ESS. Izni approves first, then May. A late application becomes EL but still deducts AL. `[from Teams DM May Chin Mei Theng]`

## 9. Tools, AI and automation

1. Claude and Copilot accounts are issued through WC. GitHub repos are private.
   1. A Claude usage monitor (`mf-usage-report`) had to be installed on 2026-08-11. `[from Teams ModeFair QA Automation Engineer Team, 2026-08-11 14:20, Kasturi]` "Management going to have Claude code usage monitor."
2. Do not use project data when trialling external AI tools. `[same chat, 2026-01-13, Kasturi]`
3. Playwright framework rules:
   `[same chat, 2026-07-06 16:51, Kasturi]` "Selectors go in Page Objects — specs never touch them directly • Credentials and test data go in data/ — never hardcoded in tests"
   1. Login lives in a fixture.
   2. Keep specs short.
4. Repository consolidation:
   1. CR and regression test scripts (not tools) move into `github.com/modefair/eauto-qa-automation`, in preparation for CI/CD and daily deployment. `[from Teams eAuto QAs, 2026-09-17 19:47, May Chin Mei Theng]`
   2. Steps:
      `[from Teams eAuto QAs, 2026-09-30 10:31, Hui Xin Lee]` "branch out from the branch 'consolidate' > run the consolidate agent i shared in group > gv the agent your repo url > tell it scripts/folder you want to migrate > you try whether test can run or not > run success > push to your branch > merge to 'consolidate' branch > push"
5. KT recordings: give edit access to May Chin, set expiry to none, and move them to your Handover Folder in SharePoint.
   `[from Teams ModeFair QA Automation Engineer Team, 2026-07-06 12:50, Kasturi]` `[from Teams eAuto QAs, 2026-08-05 17:09, May Chin Mei Theng]`
6. Use the @modefair.com address, not @modefair.onmicrosoft.com, for Figma and Miro. `[from Teams ModeFair QA Automation Engineer Team, 2026-05-07, May Chin]`
7. Mailtrap checks are done through Chrome (MCP), not the API. `[from Teams DM Charmain Ea Chiang, 2026-08-17]`

## 10. From Charmain's QA repo (`eauto_qa_gpt`, 2026-10-13)

Added 2026-10-27 from the read-only clone `_reference/codebases/eauto-qa-charmain/`. Full study: [charmain-qa-repo.md](charmain-qa-repo.md). These are rules written into a colleague's repo, not Teams posts; treat them as `[from QA team]`-grade.

1. **Test evidence library layout** (QA Team OneDrive): `eAuto Project\eAuto - Test Evidence\` → `1. Enhancement CR` (per ticket), `2. Staging Regression` (by date), `3. Production Regression` (by deployment date). `[charmain-repo: .claude/skills/test-evidence-upload/SKILL.md:15-24]`
2. **CR evidence folders are pre-created** before testing, named `EAINT-<n> - <Jira title, emoji included>`, often truncated; one folder can hold several tickets. Find by **ticket number**, never by title. If the folder already has files, **stop and check** before uploading. `[charmain-repo: .claude/skills/test-evidence-upload/SKILL.md:26-40]`
3. **Upload the video and the downloaded files only.** Stills, sidecars and run summaries stay local. `[charmain-repo: .claude/skills/test-evidence-upload/SKILL.md:43-60]`
4. **Short evidence filenames — Charmain's ruling, 01-09-2026, EAINT-11982:** "just put the ts no if there are same filetype, just put TS1 - 1, TS1 - 2 like this. i need the filename as short as possible cus will hit error in the future if we put long filename" `[charmain-repo: .claude/skills/test-evidence-upload/SKILL.md:131-134]`. The older EAINT-11073 rule keeps the browser's original download name; the repo says "Which rule applies is the user's call per CR."
   1. **Conflict:** the library precedent is `TS9` (no zero-padding) `[charmain-repo: .claude/skills/test-evidence-upload/SKILL.md:115]`; Faizuddin's rule is `TS01` (see [test-scripts.md](test-scripts.md), "TS numbers are always two digits"). Faizuddin's rule stands for his work.
   2. **Conflict:** Faizuddin's "my SharePoint" uploads go to his personal OneDrive `eAuto Documents\EAINT-XXXXX`, never the QA Team site (memory, 2026-10-21). The QA Team library above is the team's sign-off location.
5. **SharePoint rewrites uploaded Office files** (adds parts, changes size and hash; sheet data unchanged). A changed hash after upload is not corruption. `[charmain-repo: .claude/skills/test-evidence-upload/SKILL.md:204-209]`
6. **Production is read-only** for automation: a production spec never submits, pays, approves, saves or deletes; state-changing specs carry `@destructive` and are excluded from the production project. `[charmain-repo: docs/qa-principles.md:158-166]` Consistent with [production-regression-scope.md](production-regression-scope.md).
7. **Jira is read freely; never comment, transition or create unless the task asked for that action by name.** `[charmain-repo: .claude/skills/ticket-intake/SKILL.md:25-26]`
8. **Defect triage states:** `raised to dev`, `pending confirmation`, `false alarm`, `resolved`, `deferred`. "TRIAGE FROM THE LATEST RUN, NEVER FROM A REPORT." `[charmain-repo: test-scenarios/defects.yaml:14-26]`
9. **A run against the wrong build or branch is void** — not a defect and not a pass. Voiding is a human call and is never used to make a red go away. `[charmain-repo: test-scenarios/voided-runs.yaml:1-25]`
10. **Personal data in evidence** (IC scans, names, addresses) is the data subject's decision: ask once, record the answer, mask at the source and in every output (video and text). `[charmain-repo: .claude/skills/test-evidence-recording/SKILL.md:145-149]`
11. **Shared QA instances throttle repeated logins**; a bounce to another login page looks like a wrong password. Wait and re-run; do not retry into a lockout on a shared account. `[charmain-repo: docs/lessons.md:26-29]`
12. **Write the lesson down before moving on**, where the next reader meets it — never only in a private note. `[charmain-repo: docs/qa-principles.md:132-149]` Matches our `knowledge/` "append in the same change" rule.
13. **Consolidation repo — open point:** Charmain's repo is `modefair/eauto-qa-gpt` (branch `consolidate-charmain`); section 9 item 4 names `modefair/eauto-qa-automation`. Which is the current team target is `[unconfirmed]`.
