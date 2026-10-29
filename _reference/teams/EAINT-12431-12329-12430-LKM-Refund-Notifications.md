<!-- Source: Teams group chat "EAINT-12431 & 12329 & 12430 To Send Email and WhatsApp Notifications for LKM Refund & To Add LKM Refund Amount Column in LKM Refund Status Listing".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2026-10-06). Reactions dropped. -->
# EAINT-12431 / 12329 / 12430 LKM Refund notifications & amount column

[2026-10-06 14:52] Yi Link Lim: Hi Everyone here is the CR group for: EAINT-12430 [eAuto-UCD & BackOffice] To Add LKM Refund Amount Column in LKM Refund Status Listing; EAINT-12431 [eAuto-UCD] To Send Email and WhatsApp Notifications to Car Owner for LKM Refund
[2026-10-06 14:53] Yi Link Lim: As per confirmed with Jin Siang Boo, 12430 can be done by patching but SA side will slot this ticket into morning deployment ya. As 12430 is ready for testing, QA kindly advice dev side on which staging env to deploy changes of 12430 ya. Thankss.
[2026-10-06 15:29] Jin Siang Boo: Lim Xiwei please help on EAINT-(12431)
[2026-10-07 09:00] Tan Yi Fung: think we need plan a bit, this one involve whatsapp
[2026-10-07 10:24] May Chin Mei Theng: hi morning, Jin Siang Boo for 12430 can help to push to staging/uat1?
[2026-10-07 10:55] Jin Siang Boo: EAINT-12430 deployed to staging/uat1 ya
[2026-10-07 16:41] Tan Yi Fung: for EAINT-12431, we will use messagebird as a decision at the moment
[2026-10-07 18:12] May Chin Mei Theng: Hi Everyone, just a quick update, QA has completed testing for EAINT-12430 on staging/uat1 (eAuto) with no outstanding issues. It's ready for morning deployment on 8 Oct (Thursday). Thanks to everyone involved!
[2026-10-08 09:23] May Chin Mei Theng: Hi morning Everyone, EAINT-12430 verified and tested good on Prod ya, will continue monitoring production until 1pm, thanks!
[2026-10-12 15:22] Yi Link Lim: hi Lim Xiwei as spoken for 12431, Ops side will come out with the flow and share to us by tomorrow ya. Will inform here once the flow confirmed.
[2026-10-14 10:31] Mei Jia Chee: hii Everyone, just to share that for EAINT-12431 we will break it into 2 parts to proceed ya. Part 1 - Step 1 Email & Whatsapp; Part 2 - Step 4 Email & Whatsapp & the remaining item required. Jin Siang Boo, later need ur help to advise that whether email & whatsapp send out together or what is the handling ya. Yi Link Lim, need ur help to create another ticket for Part 2 ya, EAINT-12431 we use for Part 1 ya. Ops team would like to have the Part 1 ASAP.
[2026-10-14 15:13] Jin Siang Boo: Lim Xiwei please help advise first, I pack with Runnerku things ya
[2026-10-14 16:25] Yi Link Lim: Okkiess, we will use EAINT-12329 for Part 2: Step 4 Email & Whatsapp & the remaining item required ya.
[2026-10-15 17:25] Yi Link Lim: hihi Lim Xiwei leave a message here, can share your advise here as per discussed? can include ETA when dev side can get ready for this ticket ya
[system] Yi Link Lim added Nur Izni Binti Zurni and 8 others; Jin Siang Boo added Lim Xiwei. Group renamed from "EAINT-12430 & 12431 ..." to the 3-ticket name.

## Update 2026-10-16 → 2026-10-26 (captured 2026-10-26)

<!-- Read-only capture via Teams web DOM, 2026-10-26. Times MYT. Messages from 2026-10-16 00:00 to capture time, oldest first.
     Line breaks inside a message shown as " / ". Quoted replies appear inline at the start of a message ("<name> / <date> / <quoted text> / reply"). Images shown as [image]; reactions dropped. -->

**Lim Xiwei** — 2026-10-16 15:06: Yi Link Lim / 15/10/2026 17:25 / hihi Lim Xiwei leave a message here, can share your advise here as per discussed? can include ETA when dev side can get ready for this ticket ya / hihi, we will send the email + WhatsApp together when user finish Step 2 and moves to Step 3, eta 21/10

**Lim Xiwei** — 2026-10-20 11:18: hi Yi Link Lim, any updates on email and whatsapp template?

**Yi Link Lim** — 2026-10-20 11:37: Lim Xiwei / 20/10/2026 11:18 / hi Yi Link Lim, any updates on email and whatsapp template? / Lim Xiwei Attached email & WA template shared by Nurul in EAINT 12431 ya: [image]

**Lim Xiwei** — 2026-10-20 11:40: alright thanks

**Mei Jia Chee** — 2026-10-20 14:07: hii Lim Xiwei, can help to advise for EAINT-12431 can be deploy on morning?

**Yi Link Lim** — 2026-10-20 16:52: Hi Everyone, just to inform that SRD v0.1 uploaded to JIRA ya [image]

**Charmain Ea Chiang** — 2026-10-20 17:14: Hi Lim Xiwei as mentioned earlier, can use staging/uat4 for this ticket ya, thank you

**Yi Link Lim** — 2026-10-20 17:20: Hi Everyone tomorrow around 1030AM, lets have a short briefing session on 12431. Do lemme know if you have any feedback ya.

**Yi Link Lim** — 2026-10-21 10:30: hi all will start here.

**Yi Link Lim** — 2026-10-21 11:21: Lim Xiwei I will confirm with Ops on the handling you asked in the briefing session just now: System not to send the email notification if: / a. UCD State = JOHOR / b. BO user untick JOHOR in "Manage LKM Refund Amount (below RM30)". / Will update here once confirmed ya.

**Lim Xiwei** — 2026-10-21 11:40: Mei Jia Chee / 20/10/2026 14:07 / hii Lim Xiwei, can help to advise for EAINT-12431 can be deploy on morning? / hi, yes can

**Charmain Ea Chiang** — 2026-10-21 12:12: Yi Link Lim / 21/10/2026 11:21 / Lim Xiwei I will confirm with Ops on the handling you asked in the briefing session just now: System not to send the email notification if: a. UCD State = JOHOR b. BO user untick JOHOR in "Manage LKM… / Hi Lim Xiwei, just checking ya, QA side need to cover this scenario as well? / according to our discussion yesterday, i will test with one E2E Happy Flow for Individual only

**Lim Xiwei** — 2026-10-21 12:14: Charmain Ea Chiang / 21/10/2026 12:12 / Hi Lim Xiwei, just checking ya, QA side need to cover this scenario as well? according to our discussion yesterday, i will test with one E2E Happy Flow for Individual only / hi, yes, if Ops confirm want this behaviour

**Charmain Ea Chiang** — 2026-10-21 12:40: Lim Xiwei / 21/10/2026 12:14 / hi, yes, if Ops confirm want this behaviour / okie noted ya

**Charmain Ea Chiang** — 2026-10-21 12:42: Hi Lim Xiwei i noticed there is new requirement for this CR. Are you still on track to deploy the changes to staging/uat4 after lunch today, or you need more time to dev ya?

**Lim Xiwei** — 2026-10-21 12:43: Charmain Ea Chiang / 21/10/2026 12:42 / Hi Lim Xiwei i noticed there is new requirement for this CR. Are you still on track to deploy the changes to staging/uat4 after lunch today, or you need more time to dev ya? / yeah will need more time, will update the eta later

**Mei Jia Chee** — 2026-10-21 15:03: hii Everyone, this ticket tentatively target to deploy on next Monday 26.10.2026 morning

**Charmain Ea Chiang** — 2026-10-22 08:38: Lim Xiwei / 21/10/2026 12:43 / yeah will need more time, will update the eta later / Hi morning all, Lim Xiwei any update on this ya?

**Charmain Ea Chiang** — 2026-10-22 09:44: Hi Yi Link Lim, as mentioned earlier, i will trigger one MessageBird to test the WhatsApp part ya / cc: Lim Xiwei

**Tan Yi Fung** — 2026-10-22 11:55: Lim Xiwei, Ops confirmed the messagebird whatsapp template?

**Lim Xiwei** — 2026-10-22 11:58: Tan Yi Fung / 22/10/2026 11:55 / Lim Xiwei, Ops confirmed the messagebird whatsapp template? / Ops is busy with meeting but SA mentioned that we can proceed first since we are using the one in SRD

**Yi Link Lim** — 2026-10-22 13:07: Charmain Ea Chiang / 22/10/2026 09:44 / Hi Yi Link Lim, as mentioned earlier, i will trigger one MessageBird to test the WhatsApp part ya cc: Lim Xiwei / SA side has informed Ket Ming on this matter. QA side can just proceed ya.

**Yi Link Lim** — 2026-10-22 13:08: Tan Yi Fung / 22/10/2026 11:55 / Lim Xiwei, Ops confirmed the messagebird whatsapp template? / Tan Yi Fung Lim Xiwei Yes Ops has confirmed that we can proceed with the template

**Yi Link Lim** — 2026-10-23 12:26: hihi Lim Xiwei Charmain Ea Chiang As discussed and spoken, / Item #1 Updates on handling / This handling to send out notification based on Manage LKM Refund Amount listing is NOT required ya. / Yi Link Lim / 21/10/2026 11:21 / Lim Xiwei I will confirm with Ops on the handling you asked in the briefing session just now: System not to send the email notification if: a. UCD State = JOHOR b. BO user untick JOHOR in "Manage LKM… / Item #2 - Updates on new email / a.. According to Fakrul, new email "bizsupport@eauto.my" is not ready just yet. Need a few working days to get this ready. / b. Confirmed with Ops that: / we can proceed deployment with whatsapp message first / Enable email feature once new email is ready

**Yi Link Lim** — 2026-10-23 12:51: Hi Everyone to inform that we have uploaded SRD v0.2 and v1.0 to JIRA ya. Thankss [image]

**Jin Siang Boo** — 2026-10-23 14:25: Hi all, now lkm refund whatsapp message is connected to MessageBird d ya. It will send to the phone number that you keyed in at Step 2 ya

**Charmain Ea Chiang** — 2026-10-23 14:39: i encountered this error at step 2 any dev available to help patch and remove this phone number from the blocklist? / company id = 1109610 / phone no = 0182724947 / email address = charmainec@modefair.com [image]

**Charmain Ea Chiang** — 2026-10-23 15:30: Lim Xiwei i have raised an issue ticket ya. Can you please help to take a look at it? / https://mfservices.atlassian.net/browse/EAINT-12600 / Jira / EAINT-12600: [eAuto - UCD] STMS Company Transaction - Incorrectly Sends LKM Refund Messages / Assigned to Xiwei Lim / High / | / TO DO / Comment / Edit / 🔔 Notify / Something went wrong. Please try again. / By using Jira, you agree to the / privacy policy / , / terms of use / , and / permissions / . [image]

**Lim Xiwei** — 2026-10-23 16:43: hi all, I will deploy to staging/uat4 in 1 min

**Lim Xiwei** — 2026-10-23 16:48: Lim Xiwei / 23/10/2026 16:43 / hi all, I will deploy to staging/uat4 in 1 min / done thanks

**Charmain Ea Chiang** — 2026-10-23 17:02: Hi Jin Siang Boo is msgbird disabled in staging/uat4 alrdy?

**Charmain Ea Chiang** — 2026-10-23 17:05: Lim Xiwei / 23/10/2026 16:48 / done thanks / Lim Xiwei is this issue ready to be retested on staging/uat4?

**Lim Xiwei** — 2026-10-23 17:06: Charmain Ea Chiang / 23/10/2026 17:05 / Lim Xiwei is this issue ready to be retested on staging/uat4? / hi yes

**Jin Siang Boo** — 2026-10-23 17:36: Charmain Ea Chiang / 23/10/2026 17:02 / Hi Jin Siang Boo is msgbird disabled in staging/uat4 alrdy? / yaya

**Jin Siang Boo** — 2026-10-23 18:14: Hi all, I had connected the MessageBird to esim ya on the LKM Refund whatsapp message

**Charmain Ea Chiang** — 2026-10-23 21:21: Hi Everyone, just a quick update, QA has completed testing for EAINT-12431 on staging/uat4 (eAuto) with no outstanding issues. It's ready for morning deployment on 26 Oct (Monday). Thanks to everyone involved! / WhatsApp / Email [image]
