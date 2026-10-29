<!-- Source: Teams group chat "EAINT-12153 & 12257 & 12259 [eAuto-Application] Add Payment Channels for Pre-application and Application - B2B, Debit/ Credit, DuitNow QR".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2026-08-10). Reactions dropped. -->
# EAINT-12153 / 12257 / 12259 Onboarding payment channels

[2026-08-10 17:45] Yi Link Lim: hi Everyone Here is the cr group for EAINT-12153 [eAuto-Application] Add Payment Channels for Pre-application and Application.
[2026-08-10 18:16] Yi Link Lim: hi all, just to inform that I have uploaded SRD v0.1 and v1.0 to JIRA. Do lemme know if there is any feedback ya. Thanks [attachment/image]
[2026-08-10 18:17] Yi Link Lim: And I would like to have a short briefing session for this ticket by tomorrow 11AM. Do lemme know if there is any feedback ya
[2026-08-11 11:00] Yi Link Lim: hi all, will start call here ya
[2026-08-11 11:45] Yi Link Lim: Hihi devs, can lemme know this ticket will assign to which dev and ETA to get this ready in staging for testing ya?
[2026-08-11 11:46] Yi Link Lim: We get greenlight from Ops to proceed with this enhancement after SRD review ya.
[2026-08-11 12:09] Goh Kai Jiaeh: Fyi, Tracey will help on this ticket.
[2026-08-11 13:02] Lim Xiwei: fyi, credit/debit card and online banking (B2B) payment methods have been re-enabled in staging ya thanks
[2026-08-11 16:48] Goh Kai Jiaeh: Fyi. [attachment/image]
[2026-08-11 17:27] Yi Link Lim: Goh Kai Jiaeh Can help to check with Fiuu whether PayNet DuitNow QR is enabled in Sandbox environment? fyi, we received feedback from Ops to add this payment method ya, but still pending confirmation whether to proceed deployment together with debit/credit & B2B [attachment/image]
[2026-08-11 17:37] Yi Link Lim: Goh Kai Jiaeh need ur help to check on this as well ya: I will forward this email to you for reference. [attachment/image]
[2026-08-13 16:28] Goh Kai Jiaeh: Just fyi for the DuitNow QR in Sandbox. Please be informed that the merchant may refer to the following page for the list of all available payment channels under the Sandbox environment: https://bank-simulator.fiuu.com/faq [attachment/image]
[2026-08-17 18:59] Yi Link Lim: Can help to confirm is Mong Guo Hao will be respective dev for this ticket?
[2026-08-17 19:00] Yi Link Lim: If yes, can help to confirm ETA when/ man-day needed this ticket can be done development if: we add new payment method DuitNow QR; we enable back debit/credit card & B2B
[2026-08-18 11:43] Mong Guo Hao: hi may i know how the ui would look like with the new payment method DuitNow QR
[2026-08-18 11:49] Mong Guo Hao: fyi Tracey already enabled debit/credit card & B2B in staging, and i will work on the DuitNow QR part
[2026-08-18 16:09] Yi Link Lim: Hihi QAs, can help to confirm whether how many man-days required for testing if we proceed to enable debit/credit & B2B payment method ya? Maybe can get back to me latest by tmr before lunch? fyi, previously QA side only able to test on debit/credit card as B2B is not ready in sandbox by that time.
[2026-08-18 16:34] Yi Link Lim: to add on, B2B is currently not available in sandbox env too ya. Does QA side has any feedback if we proceed to do patching without testing? As per checking with Mong before lunch, the DuitNow QR is available for testing in sandbox but seems like it is not available in prod. I will double check this with Ops team.
[2026-08-18 17:13] Yi Link Lim: Charmain Ea Chiang As spoken, QA side is fine to proceed with both cards & B2B payment, but QA side need to do regression testing before patch to prod. i will follow up with QA side on the man-days required for regression by tomorrow yaa
[2026-08-18 17:52] Yi Link Lim: Hihi devs, received feedback from Fiuu that B2B has been enabled in sandbox env. can help to check on this?
[2026-08-18 18:00] Mong Guo Hao: i just tried, seems to work
[2026-08-19 12:48] Yi Link Lim: hi all, just to update ya, we received feedback from Fiuu that B2B and DuitNow QR is not enabled in prod just yet (initially was informed that both methods are enabled). Hence, QA side no need to proceed for testing on this ticket first ya.
[2026-08-19 14:26] Muhammad Faizuddin Bin Bidi: Hi Yi Link Lim, just want to update the new effort estimation for QA side, it is 1 + 1 days If the QR is enabled, the effort is 1.5 + 1 days ya
[2026-08-19 18:51] Yi Link Lim: can help to confirm whether the effort is for below items? 1 + 1 days (B2B, Cards) 1.5 + 1 days (B2B, Cards, Duitnow QR)
[2026-08-20 09:34] Muhammad Faizuddin Bin Bidi: yes, but the estimation is including B2C also ya, for regression
[2026-08-21 10:21] Siti Nur Azila Binti Mohamed: hihi Yi Link Lim can help to confirm if the requirement for this CR is already latest? im referring to SRD v1.0. Thanks
[2026-08-21 10:50] Siti Nur Azila Binti Mohamed: hihi Yi Link Lim as per spoken, u confirmed that the requirement is not yet finalized for the B2B, pls help to update in this group once its ready ya, thanks
[2026-08-24 16:59] Yi Link Lim: Hii Everyone Just to update that B2B is enabled in prod. As discussed with dev side, attached image below is the B2B flow: Attached file in this message is the new page will be added for "Pending Approval" page after UCD made payment with Online Banking (Business). Will update SRD to v1.1 later ya. Do lemme know if there is any feedback on this. Thankss [file: EAINT-12153_Pending Approval_B2B 1.html] [attachment/image]
[2026-08-24 17:07] Goh Kai Jiaeh: If the payment is still pending, by right shouldn't have SSM purchase? [attachment/image]
[2026-08-24 17:11] Yi Link Lim: lemme update the design
[2026-08-24 18:15] Yi Link Lim: Hihi Everyone I have uploaded SRD v1.1 to JIRA and the design of PA based on KJ's feedback. Will work on Application design on Wed ya [attachment/image]
[2026-08-26 12:38] Yi Link Lim: Hi all, added design of Application for Pending Approval screen to JIRA ya [attachment/image]
[2026-08-26 12:38] Yi Link Lim: Lim Xiwei Can help to advice when is the ETA can this ticket be ready for testing? including code review ya
[2026-08-26 15:09] Lim Xiwei: hi, eta 2 Sept ya thanks
[2026-09-02 11:19] Yi Link Lim: Hi dev and QA, as discussed, we will separate this payment channels ticket into three tickets: (# / EAINT Ticket / Subject / Payment Channel / Dev) 1 EAINT-12153 [eAuto-Application] Add B2B Payment Channels for Pre-application and Application / B2B / Tracy; 2 EAINT-12257 [eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application / DuitNow QR / Mong; 3 EAINT-12259 [eAuto-Application] Add Credit or Debit Card Payment Channel for Pre-application and Application / Credit or Debit Card / Tracy. Charmain Ea Chiang As confirmed with Tracy, it is ready for testing in staging. QA can proceed to do regression. You may ignore other payment methods as we will only patch debit/credit card method to prod. Do lemme know once QA side dah done testing and ready to patch to prod ya. Thankss
[2026-09-02 11:24] Charmain Ea Chiang: As discussed just now, we will proceed with EAINT-12259 first right?
[2026-09-02 11:25] Yi Link Lim: Yess correct ya. we will proceed this by patching prod
[2026-09-02 11:39] Charmain Ea Chiang: Lim Xiwei as mentioned, QA only needs to create 1 Pre-Application with the E2E happy flow for regression testing ya
[2026-09-02 11:39] Charmain Ea Chiang: okie, please let us know when you are targeting to patch these changes to production
[2026-09-02 11:45] Yi Link Lim: We can patch it anytime today ya.
[2026-09-02 11:46] Charmain Ea Chiang: ok i will do the regression now, and inform here once done
[2026-09-02 12:49] Charmain Ea Chiang: Hi Everyone, just a quick update, QA has completed testing for EAINT-12259 on staging/obs (eAuto). It's ready for patching to production. cc: Yi Link Lim
[2026-09-02 12:51] Yi Link Lim: Okayy thanks for the updates. Devs, may I know when the ETA can dev side patch to prod ya?
[2026-09-02 14:39] Goh Kai Jiaeh: hi all, fyi the patching to prod is done.
[2026-09-02 14:44] Charmain Ea Chiang: showing in prod dy ya, thanks KJ [attachment/image]
[2026-09-03 14:54] Yi Link Lim: Hiii Mong Guo Hao Can help to confirm whether can we do patching for 12257? If cannot do patching, can we do morning deployment?
[2026-09-03 14:57] Mong Guo Hao: cannot just patching, but morning deployment should be ok
[2026-09-03 15:44] Yi Link Lim: Hihi QAs, just to check ya, is QA side available to join a short briefing session tomorrow around 2.45PM (tentatively) for EAINT-12153 to test B2B with simulator? As sandbox env still pending feedback from Fiuu side, Lim Xiwei has prepared simulator for QA to test on B2B first.
[2026-09-03 16:51] Muhammad Faizuddin Bin Bidi: Hi, ya, QA should be able to join at that time
[2026-09-03 16:54] Yi Link Lim: Okayy will inform here once this briefing session is confirmed ya
[2026-09-04 11:27] Yi Link Lim: Hi Everyone Just to inform that we will have this briefing session around 2.45PM online yaa. Thankss
[2026-09-04 14:46] Yi Link Lim: Hi all, will start call here ya
[2026-09-07 15:55] Yi Link Lim: Hihi Everyone Just to inform that I have uploaded SRD v1.3 to JIRA ya. Thankss [attachment/image]
[2026-09-07 18:36] Yi Link Lim: Hi Mong Guo Hao here is the summary discussion based on our discussion related to SRD v1.2: Payment Method - No need to categorize whether this trx is B2B or C2B. "[Approval Deadline Date] at 12:00 PM" in email template (Section 2.3) a. Approval Deadline Date = Submitted Payment Date + 7 Day b. 12 PM - remain unchanged. Submitted Payment Date Time is only displayed for B2B payment method. Do lemme know if there are any feedback or questions. Thankss
[2026-09-10 18:01] Yi Link Lim: Hi Everyone just to inform that I have uploaded SRD v0.1 & v1.0 for 12257 [attachment/image]
[2026-09-10 18:01] Yi Link Lim: I would like to have a briefing session by tomorrow 11AM ya. Do lemme know if there is any feedback. Thankss
[2026-09-11 11:00] Yi Link Lim: will start call here
[2026-09-11 11:14] Yi Link Lim: Hi all, for REQ-001, it means that DuitNow QR is the new payment method in PA & A payment step ya. [attachment/image]
[2026-09-11 11:55] Mong Guo Hao: btw, EAINT-12153 is ready to be deployed to staging
[2026-09-11 18:21] Yi Link Lim: just to confirm, done code review?
[2026-09-11 18:22] Mong Guo Hao: not yet but will do on next monday
[2026-09-11 18:26] Yi Link Lim: ok once done code review, can inform us ready to deploy to staging ya
[2026-09-17 10:49] Yi Link Lim: Mong Guo Hao Just to follow up, this ticket has done code review? / If done, can inform here ya.
[2026-09-17 11:17] Mong Guo Hao: will do the code review today, will inform when ready to test
[2026-09-24 14:12] Yi Link Lim: Mong Guo Hao Just to follow up on the development progress on below tickets: 12153 - Is code review done? I believe it has done code review ya 12257 - done development and code review?.
[2026-09-25 10:38] Mong Guo Hao: 1. 12153 - still under code review / 2. 12257 - will need to test then code review
[2026-09-28 00:23] Yi Link Lim: Hi Mong Guo Hao Just leave a message here, do update us once you have done code review for the tickets and they are ready for testing ya. Thankss
[2026-09-29 10:58] Mong Guo Hao: hi all, both tickets are ready for testing, but not deployed yet
[2026-10-01 15:40] Yi Link Lim: Hii QAs, kindly advice dev side on the staging env if this ticket has arranged deployment date ya. As of now, there is no planned deployment date for this ticket just yet
[system] Yi Link Lim added Jin Siang Boo and 10 others to the chat.
[system] Goh Kai Jiaeh added Lim Xiwei to the chat and shared all chat history.
[system] Goh Kai Jiaeh added Mong Guo Hao to the chat and shared all chat history.
[system] Group renamed from "EAINT-12153 [eAuto-Application] Add Payment Channels for Pre-application and Application" to the 3-ticket name.

## Update 2026-10-16 → 2026-10-26 (captured 2026-10-26)

<!-- Read-only capture via Teams web DOM, 2026-10-26. Times MYT. Messages from 2026-10-16 00:00 to capture time, oldest first.
     Line breaks inside a message shown as " / ". Quoted replies appear inline at the start of a message ("<name> / <date> / <quoted text> / reply"). Images shown as [image]; reactions dropped. -->

**Mei Jia Chee** — 2026-10-22 10:26: Mong Guo Hao, can help to advise for EAINT-12153 & EAINT-12257 whether we can do morning deployment ya? we target next Thursday 29.10.2026 / cc Charmain Ea Chiang

**Mong Guo Hao** — 2026-10-22 10:27: Mei Jia Chee / 22/10/2026 10:26 / Mong Guo Hao, can help to advise for EAINT-12153 & EAINT-12257 whether we can do morning deployment ya? we target next Thursday 29.10.2026 cc Charmain Ea Chiang / yea both can be done on morning deployment

**Muhammad Faizuddin Bin Bidi** — 2026-10-22 10:57: Hi Mong Guo Hao, can help to deploy the changes to staging/obs. thank you

**Mong Guo Hao** — 2026-10-22 11:20: EAINT-12257 have been deployed to staging/obs, will update again when I deploy EAINT-12153

**Mong Guo Hao** — 2026-10-22 11:21: note to use this to scan the qr / https://bank-simulator.fiuu.com/duitnow/viewqr

**Mong Guo Hao** — 2026-10-22 14:41: to update i have deployed EAINT-12153 to staging/obs / Note: to approve the payment can go to / https://bank-simulator.fiuu.com/fpx-b2b/pending

**Yi Link Lim** — 2026-10-26 10:36: Hi QAs, can help to confirm whether when 12153 & 12257 is ready for walkthrough session? / Do lemme know latest by 4PM today ya.

**Muhammad Faizuddin Bin Bidi** — 2026-10-26 12:05: Yi Link Lim / 26/10/2026 10:36 / Hi QAs, can help to confirm whether when 12153 & 12257 is ready for walkthrough session? Do lemme know latest by 4PM today ya. / Hihi. Ya, both are ready for walkthrough sessions
