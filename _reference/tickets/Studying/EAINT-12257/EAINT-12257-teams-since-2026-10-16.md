<!--
Source: Microsoft Teams web (teams.cloud.microsoft), read-only sweep.
Chats: (1) "EAINT-12153 & 12257 & 12259 🔴[eAuto-Application] Add Payment Channels for Pre-application and Application - B2B, Debit/ Credit, DuitNow QR" (CR group);
       (2) "eAuto QAs"; (3) DM Mong Guo Hao (dev); (4) eAuto Secarang Main Group.
Capture date: 2026-10-26. Range: 2026-10-16 to 2026-10-26 10:50 MYT. Times MYT.
Covers EAINT-12153 and EAINT-12257 (same CR group, same deployment). Same messages are in EAINT-12153-teams-since-2026-10-16.md.
"EAINT-12157" and "EAINT-12237" in Faizuddin's posts are typos for 12153 / 12257 (Mong Guo Hao, DM 2026-10-22 10:57: "u mean 12153 right").
-->
# EAINT-12257 (+12153) — Teams messages since 2026-10-16

## A. CR group chat (EAINT-12153 & 12257 & 12259)

1. [2026-10-22 10:26] Mei Jia Chee: "Mong Guo Hao, can help to advise for EAINT-12153 & EAINT-12257 whether we can do morning deployment ya? we target next Thursday 29.10.2026 cc Charmain Ea Chiang"
2. [2026-10-22 10:27] Mong Guo Hao: "yea both can be done on morning deployment"
3. [2026-10-22 10:57] Faizuddin: "Hi Mong Guo Hao, can help to deploy the changes to staging/obs. thank you"
4. [2026-10-22 11:20] Mong Guo Hao: "EAINT-12257 have been deployed to staging/obs, will update again when I deploy EAINT-12153"
5. [2026-10-22 11:21] Mong Guo Hao: "note to use this to scan the qr https://bank-simulator.fiuu.com/duitnow/viewqr"
6. [2026-10-22 14:41] Mong Guo Hao: "to update i have deployed EAINT-12153 to staging/obs Note: to approve the payment can go to https://bank-simulator.fiuu.com/fpx-b2b/pending"
7. [2026-10-26 10:36] Yi Link Lim: "Hi QAs, can help to confirm whether when 12153 & 12257 is ready for walkthrough session? Do lemme know latest by 4PM today ya."

## B. eAuto QAs

1. [2026-10-20 15:48] Charmain Ea Chiang: "Muhammad Faizuddin Bin Bidi please study the 2 tickets below once you have completed your current tasks ya https://mfservices.atlassian.net/browse/EAINT-12257 https://mfservices.atlassian.net/browse/EAINT-12153 i believe you have studied them and drafted the TS before. Please provide an update on: Testing estimation for each ticket When we can slot them in for testing and deployment we dont need to do both at the same time, can split them if needed, but I need your feedback first"
2. [2026-10-21 12:56] Faizuddin: "Hi, i've restudied and rechecked tickets EAINT-12237 & EAINT-12153. From my side, each of these tickets will require 2+1 days testing time. I believe both of these tickets can be deployed at the same time. So if I were to test both at the same time, i can say the effort estimation for both combined is 4+2 days. Since both of these have relation with external side (Fiuu), I decided on this estimation in case require input from their side. I also asked dev, and they said that this can do Morning Deployment. So I believe the earliest deployment date for these 2 tickets is 29th October Morning Here are the completed drafted TS: EAINT-12257 -🔴[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application.xlsx EAINT-12153 - 🔴[eAuto-Application] Add Payment Channels for Pre-application and Application.xlsx (QATeam > 1. eAuto Project)"
3. [2026-10-21 13:00] Charmain Ea Chiang: "do you think we can split them, or better to test them together ya?"
4. [2026-10-21 13:04] Faizuddin: "Dev said its the same, so can test together or split also can. My side also feel no issue if want to split"
5. [2026-10-21 20:00] Faizuddin (EOD): "EAINT-12257 ... Completed TS Drafted automation script - 70% / EAINT-12153 ... Completed TS Drafted automation script - 80%"
6. [2026-10-22 09:23] Faizuddin: "Hi, for EAINT-12157 and EAINT-12257, can i ask dev to deploy the changes to staging/obs to start testing? Anyone have any concern on this"
7. [2026-10-22 09:39] Charmain Ea Chiang: "Hi Faiz, wait ah, let me confirm the expected deployment date first"
8. [2026-10-22 10:29] Charmain Ea Chiang: "Faiz, we are targeting 29 Oct for the deployment of both EAINT-12153 and EAINT-12257 ya. You can proceed to ask Dev to deploy the changes and start testing once they are ready"
9. [2026-10-23 09:26] Faizuddin: "EAINT-12257 ... (2/13) 15.38% - PASS only / EAINT-12153 ... Raised & Resolved Bugs: EAINT-12588 Overall CR Testing Progress : (1/12) 8.33% - PASS only"
10. [2026-10-23 19:30] Faizuddin (EOD): "EAINT-12257 ... Raised Today : EAINT-12625, EAINT-12627 Overall CR Testing Progress : (3/13) 23.07% - PASS only / EAINT-12153 ... Raised & Resolved Bugs: EAINT-12588 Overall CR Testing Progress : (6/12) 50% - PASS only"
11. [2026-10-26 08:46] Faizuddin: "EAINT-12257 ... To confirm with BA on the expected behaviour for previously raised bug ... (3/13) 23.07% / EAINT-12153 ... To confirm with BA on the expected behaviour for previously raised bug ... (6/12) 50%"
12. [2026-10-26 09:22] Charmain Ea Chiang: "Hi morning Faiz, are EAINT-12257 and EAINT-12153 on track to complete testing by EOD 28 Oct (Wednesday) ?"
13. [2026-10-26 09:30] Faizuddin: "Hi morning Charmain. Yup, its on track to complete"
14. [2026-10-26 09:35] Faizuddin (huddle agenda): "[29 October 2026] EAINT-12153 - [eAuto-Application] Add B2B Payment Channel for Pre-application and Application QA in the midst of testing - about 50% complete EAINT-12257 - [eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application QA in the midst of testing - about 30% complete"
15. [2026-10-26 09:36] Charmain Ea Chiang: "okie remember to assign the staging branch and update the ticket status ya [image]"

## C. DM Mong Guo Hao (dev) — ticket-related only

1. [2026-10-22 10:31] Faizuddin: "Mong, for 12257 and 12157, both on staging/obs only right?"
2. [2026-10-22 10:46] Mong Guo Hao: "yea but haven't deploy" / "u guys ready to test then i deploy"
3. [2026-10-22 10:57] Mong Guo Hao: "wait whats 12157" / "u mean 12153 right"
4. [2026-10-22 14:12] Mong Guo Hao: "btw i think the affin bank one got issue" / "let me ask ba"
5. [2026-10-22 14:13] Faizuddin: "for b2b only is it?" — Mong Guo Hao: "yea" / "i think the affin bank is outdated but got affin max" / "not sure ba want orr not"
6. [2026-10-22 14:21] Faizuddin: "mong, we got any changes in SSM stuffs?" — Mong Guo Hao: "supposingly no" ... "ssm api" / "down"; [14:23] "weird ah i try no issue now"
7. [2026-10-22 14:27] Faizuddin: "ahh, i think my automation used the same business details with already existing one. now working"
8. [2026-10-22 14:32] Mong Guo Hao: "https://bank-simulator.fiuu.com/fpx-b2b/pending"; [14:39] "can alrdy" / "acidentally change one setting" / "changed it back"
9. [2026-10-22 16:39] Mong Guo Hao: "i changed the affin bank to affin max yea" [image] "fyi"
10. [2026-10-22 17:21] Mong Guo Hao: "M00000019"; [17:30] "can i deploy now to fix" — Faizuddin: "ya can can"
11. [2026-10-22 17:37] Mong Guo Hao: "can alrdy" / "u try one more time"; Faizuddin: "but cannot use this one right?" (re M00000019); Mong Guo Hao [17:37–17:38]: "wait i update to 20" / "done" / "actually want reuse can one, just the application link will fail to generate"
12. [2026-10-23 17:59] Faizuddin: "https://mfservices.atlassian.net/browse/EAINT-12625"
13. [2026-10-24 13:44] Mong Guo Hao: "actually just dropping a message first, this one can confirm with BA, because if cancel means haven't do payment so shouldn't have unsuccessful payment right."
14. [2026-10-26 08:41] Faizuddin: "ya make sense also. i'll confirm with BA later today"
15. [2026-10-26 08:57] Faizuddin: "[image] Hi Mong, for these 2 tickets, can help to change the status later? thankss" — Mong Guo Hao [08:58]: "Ah okk"

## D. eAuto Secarang Main Group

1. [2026-10-22 11:47] Mei Jia Chee (October deployment plan): "NEW!!! 29.10.2026 (Thurs) - Morning Session https://mfservices.atlassian.net/projects/EAINT/versions/14032/tab/release-report-all-issues"

## Decisions / changes / open questions

1. Deployment target: 29 Oct 2026 (Thu) morning, both 12153 and 12257 together (2026-10-22 10:29, eAuto QAs, Charmain; 2026-10-22 10:27, CR group, Mong Guo Hao).
2. QA test-complete deadline: EOD 28 Oct 2026 (2026-10-26 09:22, eAuto QAs, Charmain).
3. Staging = staging/obs; 12257 deployed 2026-10-22 11:20, 12153 deployed 2026-10-22 14:41 (CR group).
4. Simulators: DuitNow QR scan https://bank-simulator.fiuu.com/duitnow/viewqr; FPX B2B approve https://bank-simulator.fiuu.com/fpx-b2b/pending (CR group 2026-10-22).
5. B2B bank list: dev changed "Affin Bank" to "Affin Max" on staging (2026-10-22 16:39, DM Mong Guo Hao). BA confirmation of this not seen in Teams.
6. Bugs: EAINT-12588 (12153, raised and resolved); EAINT-12625, EAINT-12627 (12257, raised 2026-10-23) (eAuto QAs).
7. Open: EAINT-12625 expected behaviour — dev view "if cancel means haven't do payment so shouldn't have unsuccessful payment"; Faizuddin to confirm with BA (DM 2026-10-24 / 2026-10-26).
8. Open: walkthrough-session readiness for 12153 & 12257 — reply due to Yi Link Lim by 4PM 2026-10-26 (CR group 10:36).
9. Progress as of 2026-10-26: 12153 6/12 (50%), 12257 3/13 (23.07%) (eAuto QAs 08:46).
