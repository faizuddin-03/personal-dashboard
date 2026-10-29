<!-- Source: Teams group chat "EAINT-11864 [eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2026-07-09). Reactions dropped.
     Trimmed: acknowledgement-only messages dropped. "Unknown User" in quotes = Leong Jin Chuen (dev, account since removed). -->
# EAINT-11864 Insurance quotation reminder email

[2026-07-09 11:03] Yi Link Lim: Hi Everyone here is the CR group for EAINT-11864 [eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase
[2026-07-09 11:05] Yi Link Lim: To inform that I have uploaded SRD v0.1, 0.2 and 1.0 to JIRA. Note: Design pending confirmation from Shamini. Will get her confirmation by tmr. I would like to have a briefing session for this ticket by 3.30PM. Do let me know if there is any feedback. Thanks. [attachment/image]
[2026-07-09 15:31] Yi Link Lim: Hi all, will start call here ya
[2026-07-10 15:53] Tan Yi Fung: Leong Jin Chuen, please help on this ticket
[2026-07-10 16:00] Tan Yi Fung: there is a meeting video , Yi Link Lim can you share this to JC?
[2026-07-14 15:44] Yi Link Lim: hii Leong Jin Chuen Just to check, when is the ETA can get this ticket ready for testing ya?
[2026-07-14 16:34] Leong Jin Chuen: Hi Yi Link Lim, the ticket should be ready around Friday, including code review.
[2026-07-14 16:36] Leong Jin Chuen: Yi Link Lim just want to clarify, what counts as the "generated quotation" the 1-hour timer anchors on? In EAINT-11864
[2026-07-14 16:38] Leong Jin Chuen: Is it that any insurance quotation that is still not purchased and was created more than 1 hour ago triggers the reminder
[2026-07-15 12:05] Leong Jin Chuen: Hi Yi Link Lim, here are some part to cross-check as well: if eSTM approve, shouldn't the buyer that get's notified for the purchase insurance, or the UCD is responsible in handling the insurance quotation for them? which recipient email should the email reminder get anchored on? Is it the Main's UCD registered email address or the specific quotation creator's registered email. should we only send the email after we go live? Or every previously unpurchased quotation older than an hour get a reminder as well.
[2026-07-16 11:57] Yi Link Lim: hihi JC, here are the feedback ya: if eSTM approve, shouldn't the buyer that get's notified for the purchase insurance, or the UCD is responsible in handling the insurance quotation for them? A: UCD is responsible in handling the insurance quotation for them. which recipient email should the email reminder get anchored on? Is it the Main's UCD registered email address or the specific quotation creator's registered email. A: specific quotation creator's registered email. should we only send the email after we go live? Or every previously unpurchased quotation older than an hour get a reminder as well. A: only send the email after we go live. For the previous existing unpurchased quotation before deployment will not get the email ya. Do lemme know if u have any feedback/concern ya. Thanksss
[2026-07-16 11:59] Leong Jin Chuen: (re: 14/07 16:36 what counts as the "generated quotation") Yi Link Lim, this one as well ya
[2026-07-16 12:23] Yi Link Lim: Leong Jin Chuen Yes correct ya. / If dev side has any concern on this behaviour, do lemme know earlier ya
[2026-07-16 12:42] Leong Jin Chuen: Okay, thanks Yi Link Lim just to clarify, on answer 2: "specific quotation creator's registered email" is it referring to the image shown below [attachment/image]
[2026-07-16 12:46] Leong Jin Chuen: And for the "generated quotation for the 1-hour timer" does it anchors on this page where the UCD haven't made any purchase on insurance [attachment/image]
[2026-07-17 15:23] Leong Jin Chuen: Above question have been solved, thanks
[2026-07-20 09:01] Yi Link Lim: hi Leong Jin Chuen as spoken around 3PM last Friday, here are the feedback: the email is referring to UCD email. The circled eVOC email belongs to Buyer ya.. Yes, we should send email to the UCD if they enters insurance step 1 or 2 or 3. Note: in backend, there is a insurance quotation status. If this status = New or Pending, system should send the email ya. Besides, about the email display, please ensure the highlighted part in image will change for each insurance ya [attachment/image]
[2026-07-21 09:39] Leong Jin Chuen: Hi Yi Link Lim will be ready on Friday for testing ya, will inform you if can finished sooner
[2026-07-21 17:37] Yi Link Lim: JC, As spoken, need to add on for item 2 about insurance quotation status in backend, we should send email if the status = Draft ya.
[2026-07-22 09:37] Yi Link Lim: HI all, just to inform that I have updated SRD to v1.1 with below highlighted part ya. [attachment/image]
[2026-07-24 18:16] Leong Jin Chuen: Hi guys, code reviewed but might need some code readjustment, will try deploy to staging again on Monday.
[2026-07-27 12:57] Yi Link Lim: Hi JC, noted ya. Kindly get greenlight from QA whether to deploy to which staging before u deploy to any staging ya. You can keep this in your local first. To remind that there is no arrangement of deployment for this ticket just yet ya. Can reach out to QAs here once the Fix Version details in JIRA is updated.
[2026-07-27 13:57] Leong Jin Chuen: Hi, may I know the assigned QA of this ticket, because there's still some concern regarding EAINT-11864 before pushing to staging, will do a technical walkthrough first today with the team.
[2026-07-27 14:22] Nicholas Lim: Hi on our side yet to have an assigned QA for this ticket, but you can list down any concerns here first ya if need everyone to take note
[2026-07-27 15:11] Leong Jin Chuen: Noted thanks Nicholas Lim, and yes here are some concern and there's some recommendation as well after the walkthrough with seniors: current RabbitMQ DLQ max-length:1000 (would create a separate queue for it) how to ensure the email really get delivered using SMTP? (will change by migrating from SMTP to Microsoft Graph (Will go through with KJ further on this)
[2026-07-29 12:41] Yi Link Lim: Hi Everyone Just to inform that system will run cronjob to send email from 7AM to 11PM. If there r emails need to be send between 11:01PM to 6:59AM, cronjob should send by 7AM ya. Thankss cc: Goh Kai Jiaeh
[2026-07-31 15:22] Yi Link Lim: hi Everyone Just to update that the design has been updated on the wording from "commission " to "discount". U may check the latest design in figma ya. Thankss cc: Leong Jin Chuen
[2026-08-03 10:06] Leong Jin Chuen: Hi Yi Link Lim, this ticket will be ready for testing on Wednesday (10:50: Yes code review included, eta will be ready to test in staging env on Wednesday)
[2026-08-04 11:31] Leong Jin Chuen: Hi Yi Link Lim, may I know the deployment date for this ticket?
[2026-08-05 09:59] Leong Jin Chuen: Hi all, may I know which staging/ branch would you guys want this ticket to merge into for testing?
[2026-08-05 10:57] Muhammad Faizuddin Bin Bidi: Hi, for this one not confirmed yet ya. Will get back to you once confirmed
[2026-08-05 11:12] Yi Link Lim: Hihi Leong Jin Chuen Muhammad Faizuddin Bin Bidi I received questions on [Complete Purchase Now] button from QA and pending feedback from dev on Scenario 1. Scenario 1: Email send to UCD A / UCD B has access to UCD A's email and click button. Expected behaviour: a. If both UCD under same company, system redirect both UCD to Insurance Step 1 b. If both UCD from different company, system redirect UCD to homepage if they login to their UCD account. Scenario 2: UCD A check quotation and able to proceed until Step 4 but did not proceed insurance trx. Both UCD received email because Both UCD A & UCD B using same email. Expected Behaviour: System redirect both UCD to Insurance Step 1
[2026-08-05 15:39] Yi Link Lim: As discussed, updated expected behaviour for both scenario. cc: Leong Jin Chuen Muhammad Faizuddin Bin Bidi
[2026-08-05 16:13] Leong Jin Chuen: Noted, Yi Link Lim. For Scenario 1b, as discussed, we will implement a handling to prevent UCD B from accessing UCD A's insurance quotation. If UCD B accidentally receives UCD A's email and attempts to access the quotation, they will be redirected to their own home page. Please note that this change may have some impact on the existing insurance process flow, so further regression testing by QA may be required to ensure the overall flow remains unaffected.
[2026-08-17 10:10] Muhammad Faizuddin Bin Bidi: Hi Everyone, here to update that the environment to be used is /uat1 ya. Thank you
[2026-08-17 12:15] Leong Jin Chuen: Hi all, I will deploy to staging now, affected branch will be eauto - staging/uat1 eauto-cron - staging/preprod eauto-notification - staging/preprod serbal-sentral-api - staging/preprod
[2026-08-17 14:32] Leong Jin Chuen: Deployment done
[2026-08-18 14:48] Yi Link Lim: Muhammad Faizuddin Bin Bidi Just to confirm, is the happy flow ready for walkthrough session?
[2026-08-18 14:50] Muhammad Faizuddin Bin Bidi: Currently the happy flow is still not ready. The issue have been raised ya
[2026-08-18 17:42] Yi Link Lim: Can share around when is the ETA the fix can be done and ready for walkthrough session ya?
[2026-08-18 17:44] Yi Link Lim: fyi, deployment of this ticket is on morning session by 20 Aug. hence, the walkthrough session need to be done by tomorrow ya. Preferable to be in morning session.
[2026-08-18 17:52] Muhammad Faizuddin Bin Bidi: For my side, the happy flow should be finish testing and ready in 2 hours if no other major issues arise. I'll start testing on it as soon as it is ready
[2026-08-18 18:00] Yi Link Lim: just to check, what is the bug ticket number? is it a blocker for you to start testing on this?
[2026-08-18 18:01] Muhammad Faizuddin Bin Bidi: the ticket is EAINT-12199. I'd consider this a blocker
[2026-08-18 18:04] Muhammad Faizuddin Bin Bidi: Just to update, dev just deployed fix already. I'll update again tomorrow morning the status ya, if its ready or not
[2026-08-19 11:09] Muhammad Faizuddin Bin Bidi: Hi Yi Link Lim, the happy flow for this ticket is ready ya
[2026-08-19 11:13] Muhammad Faizuddin Bin Bidi: Yup, this blocker is fixed and working fine ady ya
[2026-08-19 11:32] Yi Link Lim: kindly update this ticket status ya - still showing "To Do". Thankss.
[2026-08-19 15:10] Muhammad Faizuddin Bin Bidi: Hihi Leong Jin Chuen, i raised a ticket ya, for your reference: EAINT-12213. This one affects the negative scenario. Is it possible to fix before 4.30?
[2026-08-19 16:55] Leong Jin Chuen: Will deploy now ya (17:01 Done ya, may check if the problem still raises)
[2026-08-19 16:59] Yi Link Lim: Kindly inform here once everything tested OK and ready for tmr's deployment.
[2026-08-19 17:40] Muhammad Faizuddin Bin Bidi: Hi Everyone. Here to inform that QA has finished testing with no outstanding issues and is ready for tomorrow's morning deployment. Thank you
[system] Charmain Ea Chiang added Muhammad Faizuddin Bin Bidi to the chat and shared all chat history.
[system] Yi Link Lim added Nur Izni Binti Zurni and 9 others to the chat.
