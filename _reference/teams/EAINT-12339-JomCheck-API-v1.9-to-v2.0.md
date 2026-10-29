<!-- Source: Teams group chat "EAINT-12339 [eAuto-JomCheck] Upgrade JomCheck Gateway API Integration from v1.9 to v2.0".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2026-09-14).
     Format: [date time] author: (re: quoted) text. Reactions dropped; share keys redacted. -->
# EAINT-12339 JomCheck API v1.9 -> v2.0

[2026-09-14 15:34] Mei Jia Chee: hii everyone, will use this CR group for https://mfservices.atlassian.net/browse/EAINT-12339
[2026-09-14 15:34] Mei Jia Chee: Kuik Rui Luan, as liaised that need ur help to feedback on the impact on this upgrade ya. / cc Jin Siang Boo
[2026-09-14 16:27] Mei Jia Chee: Jin Siang Boo, as liaised that i am checking with JomCheck there whehter v1.9 still can pakai or not after they deployed v2.0 ya
[2026-09-14 16:30] Kuik Rui Luan: https://claude.ai/code/artifact/9c7b6c95-9c6d-4de9-a9df-4f6f4958a4f2?sk=[redacted] all, here is the analysis of the API updates impact, there are 3 fields need to be replaced (claim type, approved part and mileage) and 2 new fields (possible total loss and possible BER) for both claim and vehicle level. Can have a look on the claude artifact to understand more on the changes needed.
[2026-09-14 18:04] Mei Jia Chee: Kuik Rui Luan can get ur help to advise dev side need how many days to develop these changes ya?
[2026-09-14 18:09] Kuik Rui Luan: Estimate 4 days, including code review
[2026-09-15 12:35] Mei Jia Chee: hiii Jin Siang Boo Kuik Rui Luan, lets have a syncup session later 2.30pm at pantry ya
[2026-09-15 14:31] Mei Jia Chee: Jin Siang Boo Kuik Rui Luan, i at pantry ad ya
[2026-09-15 14:44] Mei Jia Chee: Jin Siang Boo Kuik Rui Luan, here are the summary of the discussion just now ya 1. Affected users / a. BackOffice Portal & Service Portal. / b. UCD gets the report directly — no impact on screen. 2. Plan A — dev 2 days / a. Backend to be updated to capture API v2.0 first; no changes required to BackOffice Portal and Service Portal UI. / b. To ensure JomCheck report button in UCD Portal & BackOffice Portal reflects API v2.0. / c. QA testing scope — happy flow only; dev to share DB screenshots as proof. 3. Plan B — dev 4 days / a. One shot, covering everything. Note: will update again which approach we planning to proceed once i get confirmation from Nurul if we able to get Jomcheck to deploy it in a later date ya.
[2026-09-15 15:16] Mei Jia Chee: Everyone, just to update that ops team there will buy time till 30.09 or 01.10 for deployment yaaa. will update again if confirmed
[2026-09-18 11:13] Mei Jia Chee: hiii Everyone, just to update that JomCheck PIC updated that they confirmed wont proceed the deployment on 20.09 (sunday) ya. on the new deployment date as of now is TBC
[2026-09-18 15:18] Jin Siang Boo: we follow plan B or A ya?
[2026-09-18 16:48] Mei Jia Chee: Jin Siang Boo follow plan B ya
[2026-09-18 16:49] Mei Jia Chee: Everyone, JomCheck there asking if we can have deployment on 05.10 (Mon) night, anyone gt concern or feedback on this arrangement ya?
[2026-09-18 17:05] Jin Siang Boo: no concern from dev side ya
[2026-09-21 09:19] Amirul Azfar: No concern from qa side also ya
[2026-09-21 09:20] Jin Siang Boo: For this ticket, which staging branch to use ya?
[2026-09-21 09:50] Amirul Azfar: Will update again on this
[2026-09-21 10:46] Mei Jia Chee: hii morning everyone. Jin Siang Boo Amirul Azfar, noted yaa. so for this ticket we target 05 Oct night to have the deployment ya thankss
[2026-09-21 11:18] Mei Jia Chee: Jin Siang Boo Amirul Azfar, need help to advise again for the deployment night arrangement ya. ezAuto there eta 11.30pm completed. i wan to minta them to standby, thats why i need to know the arrangement from our end ya
[2026-09-21 12:03] Jin Siang Boo: The changes part was during submission, dont think we can go thru process flow but I think dev side could arrange a failed submission to ezAuto side to check v2.0 is ready or not. However, for success case, we need to wait real transaction
[2026-09-24 14:18] Mei Jia Chee: okkies, noted Brandon. i am checking with ops team see if they gt arrange any friendly party to purchase jomcheck or not ya
[2026-09-25 15:09] Mei Jia Chee: Jin Siang Boo, as per checking that ops team there no friendly ucd to help on during deployment date ya. we just proceed and cover whatever we could will do as of now
[2026-09-25 21:05] Mei Jia Chee: hiii Everyone, just to share that srd v0.2 & mockup are ready ya. [attachment/image]
[2026-09-25 21:06] Mei Jia Chee: lets have the briefing session next Monday 28.09.2026 at 11am. do let me know if anyone has concern or feedback on this
[2026-09-28 11:37] Mei Jia Chee: sorry Everyone, missed out the session just now. we reschedule to 2.30pm later yaaaaa
[2026-09-28 14:30] Mei Jia Chee: Everyone, will start the call now ya
[2026-09-28 17:02] Mei Jia Chee: Everyone, just to share that srd v0.3 and mockup are ready yaaa. let me know if there is any feedback by tmr 10am. if nope i will send out srd v1.0 for external review ya [attachment/image]
[2026-09-29 10:02] Muhammad Faizuddin Bin Bidi: Hi Everyone. For this ticket, we can use staging branch /uat1 ya. Thank you
[2026-09-29 10:05] Mei Jia Chee: Everyone, just to share that sent out srd v1.0 for requestor to review ya [attachment/image]
[2026-09-29 10:20] Mei Jia Chee: just to share that requestor given green light for srd v.10 ya
[2026-09-29 11:17] Kuik Rui Luan: Hi all, EAINT-12339 changes are ready in staging uat1 ya. Thank you.
[2026-09-30 11:03] Muhammad Faizuddin Bin Bidi: Hi Everyone. Just to update that the JomCheck API only allows up to 20 Reports per day ya. Thank you
[2026-10-02 16:28] Mei Jia Chee: hii Everyone, just to share that here is the update from Jomcheck ya Goh Kai Jiaeh Jin Siang Boo, can help to advise if there is any testing needed from QA ya? [attachment/image]
[2026-10-02 16:29] Goh Kai Jiaeh: no changes required as just production url update.
[2026-10-02 16:50] Mei Jia Chee: Jin Siang Boo, as liaised - u will double check for this ya [attachment/image]
[2026-10-02 16:53] Jin Siang Boo: oh sorry, I think see wrong just now, ya this is implemented ya
[2026-10-02 18:12] Tan Yi Fung: Goh Kai Jiaeh you the main dev now for jomcheck?
[2026-10-02 18:12] Goh Kai Jiaeh: Ya i'm the pic now.
[2026-10-05 08:41] Mei Jia Chee: hiii morning, Muhammad Faizuddin Bin Bidi Amirul Azfar just to check this ticket happy flow done and ready for SA to show to requestor tak?
[2026-10-05 08:44] Muhammad Faizuddin Bin Bidi: Hihi morning. Yup, the happy flow is working as expected ya
[2026-10-05 15:01] Goh Kai Jiaeh: hi all, I will deploy staging/uat1 now.
[2026-10-05 15:07] Goh Kai Jiaeh: Done thanks.
[2026-10-05 15:29] Mei Jia Chee: hii Everyone, just to update that i shared the video clip for requestor and they given the green light ya
[2026-10-05 17:18] Muhammad Faizuddin Bin Bidi: Hi Everyone, just a quick update, QA has completed testing for EAINT-12339 with no outstanding issues. It's ready for night deployment on 5 Oct (Monday). Thanks to everyone involved!
[2026-10-06 01:13] Goh Kai Jiaeh: (Enquiry API) (Get Report API) [attachment/image]
[2026-10-06 01:14] Goh Kai Jiaeh: hi all, fyi I have applied hotfix in jomcheckAPI to check if there is invalid result returned from their API. [attachment/image]
[2026-10-06 01:15] Goh Kai Jiaeh: If system doesn't handle this then UCD will hit the problem that unable to get the report even though payment is made. Will need SA to report to Ops team on this tomorrow. Thanks.
[2026-10-06 01:16] Goh Kai Jiaeh: Anything we may further discuss again tomorrow.
[2026-10-08 08:45] Mei Jia Chee: hiii Goh Kai Jiaeh, just to check that the chassis number that UCD key in no changes, right? i believe still max char 30 and can include special character too
[2026-10-08 08:48] Goh Kai Jiaeh: Ya no changes on the frontend there.
[system] Mei Jia Chee added Nur Izni Binti Zurni and 11 others to the chat.
