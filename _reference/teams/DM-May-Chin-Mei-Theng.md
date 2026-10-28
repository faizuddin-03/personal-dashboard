<!-- Source: Teams 1:1 chat "May Chin Mei Theng" (QA Lead) with Muhammad Faizuddin Bin Bidi. Captured 2026-10-16 (read-only sweep). Times MYT.
     Coverage: 2026-06-15 (earliest message loaded) to 2026-10-05; messages after 2026-10-06 are in memory/teams-catchup-2026-10-06-to-15.md.
     Trimmed: personal/health/travel details, scheduling chatter ("come to my place", "ok") and acknowledgements dropped; work content kept verbatim.
     2026-10-26: filtered again at Faizuddin's request — only ticket-related messages kept (leave, timesheet, appraisal, access, admin and personal messages removed).
     "May:" = May Chin Mei Theng; "Faiz:" = Muhammad Faizuddin Bin Bidi. -->
# DM — May Chin Mei Theng

[2026-07-03 11:12] Faiz: This one should be meeting for the latest requirement for EAINT-8606 and EAINT-8608. Should I continue with wholesale KT session or join this one?
[2026-07-03 12:49] May: Faiz, can u check with Bat whether compulsory for u to join or not because u have important KT session to join   (15:01 Faiz: Bat mentioned that its just optional for me.)   May: ok noted ya prioritize the KT session
[2026-07-29 10:49] May: (re BA asking when 12079 testing starts) MJ still not free yet, i haven't confirm with her on the priority / because i might reassign this 12079 to Azila
[2026-08-04 15:44] May: okay, coz just now i had sync up with MJ on the ticket arrangement / i need to rearrange the QA for 11540 / its okay if u have drafted the TS / i plan to let Mai test it
[2026-08-04 17:16] May: Faiz, i discussed with Charmain and Azila think 11864 can test the scenarios mainly with e-sim, then just test 1 scenario with insurance API to make sure working fine will do
[2026-08-04 18:09] Faiz: for 11540, after discussed with BA and Dev, can continue with the existing one first. so no need to do the state/year/etc. checking ... it will only check to make sure have 12 digits   (note: reversed on 2026-08-05 per eAuto QAs — BA aligned eAuto with Secarang's month/day handling)
[2026-08-05 10:22] May: Faiz, for 11864 have u checked with BA on this scenario: UCD A get quotation & received the email; UCD A shared the email to UCD B; UCD B click on the Complete Purchase Now in Email > the UCD logged in is not the UCD who received the email notification
[2026-08-11 15:05] May: hi Faiz, I've reviewed 11864 and here's my feedback ya: TS7 can test with TS1 in the same flow right? TS5 test step can mention u stop at step 1 or 2 then wait cronjob runs and observe make sure no email sent. I'm abit confused with your TS 8 9 10... u confirmed the expected result with BA already? ... Can help to double check if this scenario is covered: Trigger email notification over midnight (eg: 1AM) > auto-send email notification to UCD at 7AM when CJ starts running
[2026-08-11 15:56] Faiz: ... TS8 - After logging in, the system will automatically redirect to step 1 insurance. Even though user stops at step 2 or 3, it will automatically go to step 1 (this one BA confirmed in CR Group). TS9 - Yes, the Sub UCD will go to insurance step 1. TS10 - UCD B will not be able to continue with UCD A's insurance. ...
[2026-08-11 17:24] May: can u add 1 more scenario if haven't cover yet: UCD from another company click on "Complete Purchase Now" > UCD already logged in > should redirect to Homepage
[2026-08-11 18:08] May: can you put TS10 and TS12 next to each other / rename the TS no
[2026-08-11 18:22] May: if UCD of another company logged in ady > redirect to homepage - correct; if UCD of another company has NOT login > redirect to login page
[2026-08-13 15:40] May: faiz, regarding 12058 can you add Test Objective here? [img] / we need to have Test Objective because it is to differentiate what is the purpose of each scenario
[2026-08-13 15:54] May: faiz i forgot to ask u refer back the other ticket if have TS or not [file: EAINT-11934 - [CIBO-Transaction Management Listing & Payment Report] Enhance field to include User ID of used car dealer representative.xlsx, QATeam > eAuto Project] / coz i think can refer back
[2026-08-13 17:34] May: just to confirm, the TS3 expected to see Sub UCD name show in the new column right
[2026-08-21 23:30] May: Faiz, ... - target 3rd sept to complete testing for 9306 right? - after 3rd sept deployment onwards we make way for 12153 first before 12028 - 12153 start to test on 4th sept, plus 3.5 estimated testing effort, plus 2 days BA demo walkthrough, target 17th Sept to deploy this ticket. Do you have concern if this is the arrangement?
[2026-08-24 14:56] May: faiz just want to check when did u officially start to work on 9306? ... regardless u automation / manual
[2026-09-02 11:50] May: hi Faiz, just want to check your 6th to 14th Oct leave right, if let's say 12028 target to deploy on 5th Oct night, do you have any concern?
[2026-09-02 15:01] May: noted, but once u done with 9306, u dont start with 12153 first / after u done with 9306, can u study 12257 ticket and share the testing effort / because 12153 on hold for now due to there's still some clarification with Fiuu / so we're now looking at 12257 if sempat we wanna slot in 17th Sept deployment
[2026-09-04 15:37] Faiz: Also May, can i request MIRO for 12028. Since its a new module, i think would be better if i draft the high level TS in MIRO   May: okay can lemme create now [Miro board link]
[2026-09-11 12:49] May: (9306 TS review) the edereg precheck enquiry popup will show when user enter the VN? or enter VN then click [Next]? ... for approved prechecking, i thought system can directly go to Step 3? ... u got test both of this right? Email auto-retrieve from DB and display on perakuan but editable; No email from DB
[2026-09-11 14:42] Faiz: Its when user enter the VN and off-click it (press [tab] or click anywhere on the screen using mouse) ... for the scenario with already approved pre-checking, i just regress from the previous TS since the expected results is the same as before. ...
[2026-09-14 10:13] May: faiz, regarding 12028 / i saw u mention only 27 high level scenarios / ... how big is the testing effort for 12028 ya?   Faiz (11:03): I estimate it to be 2+2. not complicated to test but if there are any issues, might take some time for dev to fix
[2026-09-15 09:27] May: 12153 12257 - can deprio atm / 12028 need to draft the test scenario ya ... also, add 12107 in your to do list ya, this one might deploy soon in this month ... 21st Sept have 4 small shopping cart tickets, do remember to test them ya 11996 ... / so ticket priorities (based on deployment date) are: 21st Sept Deployment - 4 shopping cart tickets; TBC (in Sept) - 12107; TBC (in Oct) - (12028)
[2026-09-15 09:35] Faiz: (12028) right now, i'm like mapping out all the possible flows/branches and then from they, i'll start to properly draft up the TS. ... there are multiple statuses for different items, so the combination is a lot
[2026-09-15 17:37] Faiz: Hi May, for 12167, i think we can follow the current one. but for 12166, i think i need more time, since dev said its quite complicated So i would propose: 12166 : 3+2 = 5 days; 12167 : 1+1 = 2 days
[2026-09-15 17:43] May: okay noted ya, if 5 + 2 effort and if dev doesn't get it ready for testing by 17th Sept morning, i can say it's impossible to deploy on 28th Sept morning ady / can double check with Dev when is the ETA for testing first? / coz if follow original estimation 4 + 2, by right should be ready for testing on 18th Sept morning pun
[2026-09-17 09:55] May: Faiz, 12107 QA testing effort is still blank in QA Portal, can help to update it?
[2026-09-17 11:49] May: Faiz, ask u ya, why 12107 estimated testing effort 7.5 ~ 8.5 mandays ya? i remember last thurs initially u told me 2 + 1 = 3 days   Faiz: I think this one the estimate claude made when studying the ticket by itself. ...   May: so supposedly is 3 days right   Faiz: yaa correct correct
[2026-09-17 14:52] May: Faiz, for the 4 Service Hub portal tickets, once u've done testing u should change the status to "Ready for Prod Deployment" ya. Because these bug tickets fixes need to be deployed to Prod
[2026-09-17 14:53] Faiz: okay will do. but i notice this one dont have specific CR group right? where should i notify the completion   May: ... do we still have the service hub phase 1 group / probably can announce there
[2026-09-30 09:31] Faiz: Hi May, for 12414, do i need to consult with seniors first or can proceed to inform my estimation in group. My effort is 1+0.5 days
[2026-09-30 09:44] May: if u have confident then can share ur estimation in the group ya, remember to put ur test scope in QA portal
[2026-10-01 10:50] May: want to check, why is this ticket closed without any comment? https://mfservices.atlassian.net/browse/EAINT-12251 / the bug not valid?
[2026-10-01 10:52] Faiz: Ya for this one the bug not valid. i actually commented but did not save it. I've posted the comment just now ya
[2026-10-01 10:53] May: EAINT-12258 / this one also not a defect right?   Faiz: Ya correct2. The dev reset the payment incorrectly, so outcome was different
[2026-10-01 14:29] May: faiz, just to confirm, is this a valid bug? EAINT-12408
[2026-10-01 14:33] Faiz: Ya its a bug. If the SN is using capital letters and max 12 characters, the list will be in 1 column only. Dev said something with the CSS, so he fixed the layout
[2026-10-02 13:53] Faiz: Just to update for 12339, about 50% of the TS has passed. So i believe still on track for 5th Oct Deployment ya
[2026-10-05 12:08] Faiz: For 12339, I need a bit more time to test the jomcheck for wholesale flow ... about an hour extra after lunch   May: okay noted, try to wrap up asap ya

## Update 2026-10-16 → 2026-10-26 (captured 2026-10-26)

<!-- Read-only capture via Teams web DOM, 2026-10-26. Times MYT. Messages from 2026-10-16 00:00 to capture time, oldest first.
     Line breaks inside a message shown as " / ". Quoted replies appear inline at the start of a message ("<name> / <date> / <quoted text> / reply"). Images shown as [image]; reactions dropped. -->

**May Chin Mei Theng** — 2026-10-23 17:45: faiz, forgot to ask

**May Chin Mei Theng** — 2026-10-23 17:45: regarding EAINT-9306 (positive vehicle status but not active) and JomCheck API (vehicle number versus chassis number)

**May Chin Mei Theng** — 2026-10-23 17:45: this one was found when senior QA review?

**May Chin Mei Theng** — 2026-10-23 17:45: or during testing ya

**May Chin Mei Theng** — 2026-10-23 17:46: and 1 more - this year any prod issue caused which overlooked in CR testing handled by u?

**Muhammad Faizuddin Bin Bidi** — 2026-10-23 17:47: this found when senior QA review / May Chin Mei Theng / 23/10/2026 17:45 / this one was found when senior QA review?

**May Chin Mei Theng** — 2026-10-23 17:47: Muhammad Faizuddin Bin Bidi / 23/10/2026 17:47 / this found when senior QA review / review TS or review testing

**Muhammad Faizuddin Bin Bidi** — 2026-10-23 17:47: May Chin Mei Theng / 23/10/2026 17:47 / review TS or review testing / during review testing

**Muhammad Faizuddin Bin Bidi** — 2026-10-23 17:49: May Chin Mei Theng / 23/10/2026 17:46 / and 1 more - this year any prod issue caused which overlooked in CR testing handled by u? / for the jomcheck ticket, found 1 existing issue during deployment, but hotfix by dev during night deployment

**May Chin Mei Theng** — 2026-10-23 17:59: Muhammad Faizuddin Bin Bidi / 23/10/2026 17:49 / for the jomcheck ticket, found 1 existing issue during deployment, but hotfix by dev during night deployment / this issue overlooked during staging testing ?

**Muhammad Faizuddin Bin Bidi** — 2026-10-23 18:00: May Chin Mei Theng / 23/10/2026 17:59 / this issue overlooked during staging testing ? / yes, this one overlooked
