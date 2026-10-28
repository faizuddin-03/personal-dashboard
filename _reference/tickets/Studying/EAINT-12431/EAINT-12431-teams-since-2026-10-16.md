<!--
Source: Microsoft Teams web (teams.cloud.microsoft), read-only sweep.
Chats: (1) "EAINT-12431 & 12329 & 12430 🔴 To Send Email and WhatsApp Notifications for LKM Refund & To Add LKM Refund Amount Column in LKM Refund Status Listing" (CR group);
       (2) "eAuto QAs" (status-post excerpts); (3) "eAuto Secarang Main Group"; (4) DM Charmain Ea Chiang.
Capture date: 2026-10-26. Range: 2026-10-16 to 2026-10-26 10:50 MYT.
Times converted to MYT (UTC+8). "[quoting: ...]" = Teams quoted-reply block. "[image]" = attachment not captured.
Redacted: one phone number and one email address in the 2026-10-23 14:39 message.
-->
# EAINT-12431 — Teams messages since 2026-10-16

## A. CR group chat (EAINT-12431 & 12329 & 12430)

1. [undated event] Yi Link Lim added Charmain Ea Chiang to the chat and shared all chat history.
2. [event, "Wednesday" = 2026-10-21 10:33–10:43] Meeting + recording; "Meeting ended 12m 45s".
3. [2026-10-16 15:06] Lim Xiwei: > [quoting: Yi Link Lim 15/10/2026 17:25 hihi Lim Xiwei leave a message here, can share your advise here as per discussed? can include ETA when dev side can get ready for this ticket ya] "hihi, we will send the email + WhatsApp together when user finish Step 2 and moves to Step 3, eta 21/10"
4. [2026-10-20 11:18] Lim Xiwei: "hi Yi Link Lim, any updates on email and whatsapp template?"
5. [2026-10-20 11:37] Yi Link Lim: "Lim Xiwei Attached email & WA template shared by Nurul in EAINT 12431 ya: [image]"
6. [2026-10-20 11:40] Lim Xiwei: "alright thanks"
7. [2026-10-20 14:07] Mei Jia Chee: "hii Lim Xiwei, can help to advise for EAINT-12431 can be deploy on morning?"
8. [2026-10-20 16:52] Yi Link Lim: "Hi Everyone, just to inform that SRD v0.1 uploaded to JIRA ya [image]"
9. [2026-10-20 17:14] Charmain Ea Chiang: "Hi Lim Xiwei as mentioned earlier, can use staging/uat4 for this ticket ya, thank you"
10. [2026-10-20 17:20] Yi Link Lim: "Hi Everyone tomorrow around 1030AM, lets have a short briefing session on 12431. Do lemme know if you have any feedback ya."
11. [2026-10-21 10:30] Yi Link Lim: "hi all will start here."
12. [2026-10-21 11:21] Yi Link Lim: "Lim Xiwei I will confirm with Ops on the handling you asked in the briefing session just now: System not to send the email notification if: a. UCD State = JOHOR b. BO user untick JOHOR in "Manage LKM Refund Amount (below RM30)". Will update here once confirmed ya."
13. [2026-10-21 11:40] Lim Xiwei (replying to item 7): "hi, yes can"
14. [2026-10-21 12:12] Charmain Ea Chiang (replying to item 12): "Hi Lim Xiwei, just checking ya, QA side need to cover this scenario as well? according to our discussion yesterday, i will test with one E2E Happy Flow for Individual only"
15. [2026-10-21 12:14] Lim Xiwei: "hi, yes, if Ops confirm want this behaviour"
16. [2026-10-21 12:40] Charmain Ea Chiang: "okie noted ya"
17. [2026-10-21 12:42] Charmain Ea Chiang: "Hi Lim Xiwei i noticed there is new requirement for this CR. Are you still on track to deploy the changes to staging/uat4 after lunch today, or you need more time to dev ya?"
18. [2026-10-21 12:43] Lim Xiwei: "yeah will need more time, will update the eta later"
19. [2026-10-21 15:03] Mei Jia Chee: "hii Everyone, this ticket tentatively target to deploy on next Monday 26.10.2026 morning"
20. [2026-10-22 08:38] Charmain Ea Chiang (replying to item 18): "Hi morning all, Lim Xiwei any update on this ya?"
21. [2026-10-22 09:44] Charmain Ea Chiang: "Hi Yi Link Lim, as mentioned earlier, i will trigger one MessageBird to test the WhatsApp part ya cc: Lim Xiwei"
22. [2026-10-22 11:55] Tan Yi Fung: "Lim Xiwei, Ops confirmed the messagebird whatsapp template?"
23. [2026-10-22 11:58] Lim Xiwei: "Ops is busy with meeting but SA mentioned that we can proceed first since we are using the one in SRD"
24. [2026-10-22 13:07] Yi Link Lim (replying to item 21): "SA side has informed Ket Ming on this matter. QA side can just proceed ya."
25. [2026-10-22 13:08] Yi Link Lim (replying to item 22): "Tan Yi Fung Lim Xiwei Yes Ops has confirmed that we can proceed with the template"
26. [2026-10-23 12:26] Yi Link Lim: "hihi Lim Xiwei Charmain Ea Chiang As discussed and spoken, Item #1 Updates on handling This handling to send out notification based on Manage LKM Refund Amount listing is NOT required ya. > [quoting item 12] Item #2 - Updates on new email a.. According to Fakrul, new email "bizsupport@eauto.my" is not ready just yet. Need a few working days to get this ready. b. Confirmed with Ops that: we can proceed deployment with whatsapp message first Enable email feature once new email is ready"
27. [2026-10-23 12:51] Yi Link Lim: "Hi Everyone to inform that we have uploaded SRD v0.2 and v1.0 to JIRA ya. Thankss [image]"
28. [2026-10-23 14:25] Jin Siang Boo: "Hi all, now lkm refund whatsapp message is connected to MessageBird d ya. It will send to the phone number that you keyed in at Step 2 ya"
29. [2026-10-23 14:39] Charmain Ea Chiang: "i encountered this error at step 2 any dev available to help patch and remove this phone number from the blocklist? company id = 1109610 phone no = [redacted] email address = [redacted] [image]"
30. [2026-10-23 15:30] Charmain Ea Chiang: "Lim Xiwei i have raised an issue ticket ya. Can you please help to take a look at it? https://mfservices.atlassian.net/browse/EAINT-12600" (card: "EAINT-12600: [eAuto - UCD] STMS Company Transaction - Incorrectly Sends LKM Refund Messages", Assigned to Xiwei Lim, High, TO DO)
31. [2026-10-23 16:43] Lim Xiwei: "hi all, I will deploy to staging/uat4 in 1 min"
32. [2026-10-23 16:48] Lim Xiwei: "done thanks"
33. [2026-10-23 17:02] Charmain Ea Chiang: "Hi Jin Siang Boo is msgbird disabled in staging/uat4 alrdy?"
34. [2026-10-23 17:05] Charmain Ea Chiang: "Lim Xiwei is this issue ready to be retested on staging/uat4?"
35. [2026-10-23 17:06] Lim Xiwei: "hi yes"
36. [2026-10-23 17:36] Jin Siang Boo (replying to item 33): "yaya"
37. [2026-10-23 18:14] Jin Siang Boo: "Hi all, I had connected the MessageBird to esim ya on the LKM Refund whatsapp message"
38. [2026-10-23 21:21] Charmain Ea Chiang: "Hi Everyone, just a quick update, QA has completed testing for EAINT-12431 on staging/uat4 (eAuto) with no outstanding issues. It's ready for morning deployment on 26 Oct (Monday). Thanks to everyone involved! WhatsApp [image] Email [image]"

## B. eAuto QAs (status-post excerpts, verbatim)

1. [2026-10-16 08:27] Charmain Ea Chiang: "(On Hold) EAINT-12431 - To Send Email and WA to Car Owner for LKM Refund ... Status : To follow up and sync up with BA on the expected deployment date To check with BA on the expectation after splitting this ticket Overall CR Testing Progress : Not Ready for Testing"
2. [2026-10-21 00:04] Charmain Ea Chiang (EOD 20-10): "EAINT-12431 ... Confirmed the requirements with SA - Done Checked with Dev on the testing scope - Done Updated SA on the high level scope and deployment window to slot in - Done"
3. [2026-10-21 10:01] Faizuddin (huddle agenda): "[26 October 2026] [eAuto-UCD] To Send Email and WhatsApp Notifications to Car Owner for LKM Refund when UCD proceeding to Step 3 (Part 1) Code changes ready. Dev pending staging environment to deploy"
4. [2026-10-22 20:10] Charmain Ea Chiang (EOD 22-10): "EAINT-12431 ... Followed up with Dev, Tracey ETA for testing - Done Currently pending meta to review and approve the WhatsApp template"
5. [2026-10-26 08:09] Charmain Ea Chiang (EOD 23-10): "EAINT-12431 ... Test Scenarios Executed: 2 (Automation Script) E2E Happy Flow: TS1 - TS2 Overall CR Testing Progress : 2/2 (100%) - Done"
6. [2026-10-26 08:19] Charmain Ea Chiang: "26th October 2026 Morning Deployment JIRA Ticket : EAINT-12431 Status : To do morning support and observe prod behaviour To request dev to merge down latest prod code base"
7. [2026-10-26 09:35] Faizuddin (huddle agenda): "[26 October 2026] EAINT-12431 - [eAuto-UCD] To Send Email and WhatsApp Notifications to Car Owner for LKM Refund when UCD proceeding to Step 3 (Part 1) QA has completed the prod regression testing and will continue to monitor prod from time to time"

## C. eAuto Secarang Main Group

1. [2026-10-23 18:18] Yi Link Lim: "Prod Deployment Session dd: 26.10.2026 (Monday) ... Call time (Dev) : 8.30AM Call time (non-Devs): 8.40AM ... Participants (2): ... Dev 1. KJ QA 1. Charmain Deployment Item (Total 1 item) 1. EAINT-12431 🔴[eAuto-UCD] To Send Email and WhatsApp Notifications to Car Owner for LKM Refund when UCD proceeding to Step 3 (Part 1)"
2. [2026-10-23 21:23] Charmain Ea Chiang: "26th October Morning Deployment Items + Regression testing on staging/uat4 (eAuto) has been completed with no more pending issues. We are ready for 26 Oct (Monday) morning deployment."

## D. DM Charmain Ea Chiang

1. [2026-10-26 09:39] Charmain Ea Chiang: "as for EAINT-12431: QA has completed the prod regression testing and will continue to monitor prod from time to time"

## Decisions / changes / open questions

1. Trigger: email + WhatsApp sent together when user finishes Step 2 and moves to Step 3 (2026-10-16 15:06, CR group, Lim Xiwei).
2. Staging = staging/uat4 (2026-10-20 17:14, CR group, Charmain).
3. QA scope = one E2E happy flow, Individual only (2026-10-21 12:12, CR group, Charmain).
4. Johor / "Manage LKM Refund Amount (below RM30)" suppression handling is NOT required (2026-10-23 12:26, CR group, Yi Link Lim).
5. Email part deferred: "bizsupport@eauto.my" not ready; deploy WhatsApp first, enable email once ready (2026-10-23 12:26, CR group).
6. SRD v0.1 (2026-10-20), v0.2 and v1.0 (2026-10-23) uploaded to Jira.
7. Bug EAINT-12600 raised: STMS Company transaction incorrectly sends LKM Refund messages; fix deployed to uat4 2026-10-23 16:48 (CR group).
8. Deployed to production 26 Oct 2026 morning; prod regression done (2026-10-26 09:35, eAuto QAs).
9. Open: email notification go-live date once the new mailbox is ready (no date given).
