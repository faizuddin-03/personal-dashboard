<!--
Source: Microsoft Teams web (teams.cloud.microsoft), read-only sweep.
Chats: (1) "EAINT-12180 & 12253 🔴[eAuto-UCD] Homepage - To Display Announcement and Browser Reminder for Mozilla Firefox to Google Chrome Migration Effective 1 January 2027" (CR group);
       (2) "eAuto QAs"; (3) "eAuto Deployment Notification".
Capture date: 2026-10-26. Range: 2026-10-16 to 2026-10-26 10:50 MYT. Times MYT.
-->
# EAINT-12253 — Teams messages since 2026-10-16

## A. CR group chat (EAINT-12180 & 12253)

1. [undated events] Yi Link Lim renamed the group to the current title; Tan Yi Fung added Unknown user to the chat.
2. [2026-10-20 14:25] Mei Jia Chee: "hiii Tan Yi Fung, may i know who is the dev will take over this ticket? we planning to deploy on 28.10.2026 (Wed), wanted to know if this ticket can be morning or must be night deployment?"
3. [2026-10-20 17:11] Tan Yi Fung: "Wong Zhan Choon, i merging prod/master into dev/feat/EAINT-12253, help to take over this"
4. [2026-10-20 17:18] Tan Yi Fung (replying to item 2): "Can be morning"
5. [2026-10-20 17:19] Tan Yi Fung: "Wong Zhan Choon, there is a MR pointing to staging/eauto https://masterjedi.modefair.com/eauto/eauto_v2/-/merge_requests/4758#7cda4b03fa0e2b209a9218e5461573b74d2f12cd"
6. [2026-10-20 17:20] Wong Zhan Choon: "will study now"
7. [2026-10-20 17:24] Tan Yi Fung: "ok , make sure the dev is align with SRD and sort out all doubt"
8. [2026-10-21 10:13] Amirul Azfar: "Hi morning Wong Zhan Choon, is this ticket 12253 ready for qa to start test?"
9. [2026-10-21 10:13] Wong Zhan Choon: "Hi Morning Amirul Azfar, yes ready for testing, pending for staging env"
10. [2026-10-21 10:21] Amirul Azfar: "Can use /uat1 for this ticket ya"
11. [2026-10-21 10:22] Wong Zhan Choon: "ok will merge now ya"
12. [2026-10-21 10:33] Wong Zhan Choon: "Already done ya merged to staging/uat1"

## B. eAuto QAs (excerpts)

1. [2026-10-20 14:48] Charmain Ea Chiang: "Amirul Azfar as mentioned earlier, please study the ticket below and let me know the testing estimation, whether it is possible to deploy on 28 Oct ya https://mfservices.atlassian.net/browse/EAINT-12253" (card: "EAINT-12253: 🔴[eAuto-UCD] To Display Browser Reminder in Last Step of Transaction for Mozilla Firefox to Google Chrome Migration Effective 1 January 2027", Assigned to Lim Yi Link, Medium, TESTING IN 1ST ENV)
2. [2026-10-20 16:32] Amirul Azfar: "Charmain Ea Chiang for 12253 , the testing estimation for this ticket is (3 +2) days. Can be deploy on 28th Oct ya"
3. [2026-10-20 16:34] Charmain Ea Chiang: "alright noted, please follow up with Dev on the ETA for testing. You can start working on this ticket now ya"
4. [2026-10-20 16:36] Amirul Azfar: "As of now still no update from dev side on the new pic for this ticket. Last time updated by Karkin ready for testing already"
5. [2026-10-21 10:05] Amirul Azfar: "Hi morning all, i plan to use staging /uat3 for the 28 Oct deployment window ya. Please let me know if you have any concerns."
6. [2026-10-21 10:12] May Chin Mei Theng: "12253 dev side ready for QA to test ?" — Amirul Azfar: "Yup ready for qa to test"
7. [2026-10-21 10:15] May Chin Mei Theng: "oh nope, by right /uat1 should be the latest code base" / "but i think regardless, all staging branch need to merge down the latest codebase first" / "because yesterday night + this morning we had deployment"
8. [2026-10-21 10:19] May Chin Mei Theng: "i think can ask dev to push the CR changes first for you to start scripting, but i would suggest you to start testing after merge down prod latest codebase"
9. [2026-10-21 10:21] Amirul Azfar: "I will proceed with /uat1 yaa"
10. [2026-10-21 10:22] May Chin Mei Theng: "got refer the high level test scope in QA Portal ya?" / "if anything missing please update in QA portal as well"
11. [2026-10-21 18:25] Amirul Azfar (EOD): "EAINT-12253 ... To continue testing on staging/uat1 Overall CR Testing Progress : (20/38) 53% PASS only"
12. [2026-10-22 18:40] Amirul Azfar (EOD): "To continue testing on staging/uat1 To follow up with SA on existing issue on APT Overall CR Testing Progress : (33/36) 92% PASS only"
13. [2026-10-23 19:30] Amirul Azfar (EOD): "Completed testing on staging/uat1 To review all the test evidence Overall CR Testing Progress : (36/36) 100% PASS only"
14. [2026-10-26 09:35] Faizuddin (huddle agenda): "[28 October 2026] EAINT-12253 - [eAuto-UCD] To Display Browser Reminder in Last Step of Transaction for Mozilla Firefox to Google Chrome Migration Effective 1 January 2027 Ready for prod deployment"

## C. eAuto Deployment Notification

1. [2026-10-22 07:47] Workflows card (Goh Kai Jiaeh template): "eAuto staging/uat1 Synced with prod/master 37c4c6577d via !4955 (conflicts in the JPJ new-BRN handlers resolved to prod's version; EAINT-12253 kept). Pipeline #17142 succeeded."

## Decisions / changes / open questions

1. Deployment: 28 Oct 2026 (Wed) morning (2026-10-20 14:25 + 17:18, CR group).
2. Dev handover: Wong Zhan Choon took over from Tan Yi Fung (2026-10-20 17:11, CR group).
3. Staging = staging/uat1 (2026-10-21 10:21–10:33, CR group); uat1 prod sync kept EAINT-12253 (2026-10-22 07:47, Deployment Notification).
4. Estimate 3+2 days (2026-10-20 16:32, eAuto QAs).
5. QA result: 36/36 (100%) PASS (2026-10-23 19:30, eAuto QAs). TS count changed 38 → 36 between 10-21 and 10-22.
6. Open: "existing issue on APT" to follow up with SA (2026-10-22 18:40, eAuto QAs) — no outcome captured.
