<!-- Source: Teams group chat "EAINT-8622 [eAuto-Backend] Switch from Old BRN To New BRN for JPJ Enquiry and Final Submission".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2026-08-04). Reactions dropped.
     Trimmed: JPJ SOAP envelopes reduced to their header codes and <data1> lines; the <pcid> value is [redacted] (gateway identifier). -->
# EAINT-8622 Switch from Old BRN to New BRN (JPJ)

[2026-08-04 17:00] Yi Link Lim: hihi Everyone, here is the cr group for EAINT-8622 [eAuto-Backend] Switch from Old BRN To New BRN for JPJ Enquiry and Final Submission
[2026-08-04 18:49] May Chin Mei Theng: Mei Jia Chee Yi Link Lim I've prepared the SIT TS for 8622 in this excel here, can you help to take a look if the formats & everything are okay before QAs fill in the Test Data? EAINT-8622 - SIT Test Scenarios.xlsx cc: Charmain Ea Chiang Nur Izni Binti Zurni (file: QATeam > eAuto Project) [attachment]
[2026-08-05 14:28] Mei Jia Chee: hiii Everyone, any dev can help to advise whether this ticket previously done development or haven't start anything ya?
[2026-08-05 14:38] Jin Siang Boo: think yet to start development ya
[2026-08-05 16:17] Mei Jia Chee: can help to advise how many days that dev will need to develop this ticket ya?
[2026-08-06 08:20] Tan Yi Fung: this one depends on JPJ ? Or now JPJ already expecting new BRN?
[2026-08-06 09:55] Charmain Ea Chiang: Hihi good morning Mei Jia Chee Yi Link Lim, QA has finished preparing the test data for all the SIT test scenarios for EAINT-8622 ya, can you please take a look and let me know if you have any feedback or concerns? cc: May Chin Mei Theng
[2026-08-06 15:17] Mei Jia Chee: Tan Yi Fung, JPJ is ok for us to test sending New BRN for enquiry and submission. before apply to prod, we will need to test on staging first. hence, now May & Charmain preparing the TS and share to JPJ as requested by JPJ. so we wan to understand dev side need how long to make this changes and ready for testing, can help to advise ya?
[2026-08-06 15:18] Mei Jia Chee: hiii Charmain Ea Chiang, as liaised just now ya. once done will review again
[2026-08-06 15:21] Charmain Ea Chiang: Okiee, i have updated the test data accordingly ya, thank you MeiJia
[2026-08-06 16:55] Yi Link Lim: Charmain, SIT looks fine for us ya, tapi can add company name in company details as per discussed yaa. cc; May Chin Mei Theng
[2026-08-06 16:57] Charmain Ea Chiang: okie, i have added into the excel ya
[2026-08-06 17:03] Tan Yi Fung: Lim Xiwei, please help. Can study and arrange tech walkthrough (either a meeting or just a post in Dev teams)
[2026-08-07 11:30] Charmain Ea Chiang: Hi Yi Link Lim i have updated the SIT test data and our side has finalized it, i think it is ready to be shared with JPJ side ya, thank you. EAINT-8622 - SIT Test Scenarios.xlsx
[2026-08-07 13:05] Mei Jia Chee: Lim Xiwei, just to check may i know when is the eta ready for testing ya? including code review
[2026-08-07 14:42] Lim Xiwei: hi, eta 12/8 (wed) thanks
[2026-08-12 08:27] Lim Xiwei: hi morning all, may I know which staging env QA will be using to test this ticket?
[2026-08-12 08:32] Charmain Ea Chiang: Hi morning Tracey, not sure yet ya, we haven't confirmed the deployment date for this CR. i will let you know once it's confirmed. Please wait for our green light before deploying the changes to any staging environment ya, thank you
[2026-08-12 08:34] Lim Xiwei: alright thanks
[2026-08-18 11:39] Mei Jia Chee: hii Everyone, just to update that JPJ replied that we need to provide them the testing timeline ya. [attachment/image]
[2026-08-18 11:40] Mei Jia Chee: can i get QAs to advise on the testing planning ya?
[2026-08-18 11:40] Mei Jia Chee: we will run the internal testing first before connect to JPJ or sekali gus one round test with JPJ connection ya?
[2026-08-18 19:14] Goh Kai Jiaeh: Hi Mei Jia, dev side need some clarifications for this ticket. Could we have quick meeting maybe before or while running the testing?
[2026-08-19 08:56] Charmain Ea Chiang: Hi morning all, i think can directly test with JPJ staging ya, here is the testing effort estimate for EAINT-8622 Estimated Testing Effort: 2 days Base Testing: 1 day Buffer (Requirement Changes + Bug Fix + Retest): 1 day cc: Yi Link Lim
[2026-08-19 11:30] Yi Link Lim: Goh Kai Jiaeh BA side is available by 1230PM ya. Are u available this time?
[2026-08-19 11:34] Goh Kai Jiaeh: Ya can.
[2026-08-19 12:26] Goh Kai Jiaeh: Can just meet at pantry?
[2026-08-19 14:11] Yi Link Lim: maybe we meet tmr 1130AM yaa
[2026-08-20 11:30] Goh Kai Jiaeh: Could we meet at room3?
[2026-08-26 15:03] Yi Link Lim: hii all, just to update that I have uploaded SRD v0.2 & v1.0 to JIRA ya. do lemme know if there is any feedback ya thanksss [attachment/image]
[2026-09-09 12:57] Tan Yi Fung: this one on hold?
[2026-09-10 17:23] Yi Link Lim: Hi Everyone Just to inform here is our planned UAT session with JPJ side: 13 Oct 2026 (Tues) - 16 Oct 2026 (Fri) cc: Tan Yi Fung [attachment/image]
[2026-10-13 14:19] Charmain Ea Chiang: Hihi Lim Xiwei, just double checking ya, is the code review done and the ticket ready for testing? only pending the staging env now?
[2026-10-13 15:15] Charmain Ea Chiang: Hi Tracey to update on this, can use staging/uat3 for this ticket ya, thank you
[2026-10-13 17:32] Lim Xiwei: hi all, I will deploy to uat3 in 1min
[2026-10-13 17:35] Lim Xiwei: done thanks
[2026-10-14 08:57] Charmain Ea Chiang: Hi morning all, Lim Xiwei, just checking ya, 8622 is ready for testing on staging/uat3 right?
[2026-10-14 09:00] Lim Xiwei: hi, yeah
[2026-10-14 09:02] Charmain Ea Chiang: okie QA will start testing now ya, thank you
[2026-10-14 09:42] Yi Link Lim: Hi Everyone just to inform that I have updated to SRD v1.1 to include LKM refund for this enhancement: [attachment/image]
[2026-10-14 09:44] Yi Link Lim: Charmain Ea Chiang no changes are required to the SIT scenarios, as they will use STMS data, similar to how eLKM and eVOC use the same eSTM data.
[2026-10-14 09:46] Charmain Ea Chiang: okie noted ya, thanks YiLink
[2026-10-14 09:46] Yi Link Lim: hii Lim Xiwei need your help to check whether LKM refund is included when u deploy yesterday yaa.
[2026-10-14 09:56] Lim Xiwei: hi, LKM Refund seems included but Transfer History submission missed the change, fixing now will ready before lunch
[2026-10-14 10:15] Charmain Ea Chiang: Hii Lim Xiwei, can help to check on this blocker issue? currently unable to go through payment i will raise issue ticket shortly [attachment/image]
[2026-10-14 10:21] Charmain Ea Chiang: to addon, this happens in all modules ya
[2026-10-14 10:37] Charmain Ea Chiang: Hi Mei Jia Chee Yi Link Lim, this is the latest test data ya EAINT-8622 - SIT Test Scenarios.xlsx (QATeam > 1. eAuto Project) [attachment]
[2026-10-14 10:43] Charmain Ea Chiang: Lim Xiwei here is the ticket ya: https://mfservices.atlassian.net/browse/EAINT-12535 cc: Goh Kai Jiaeh (EAINT-12535: [eAuto - UCD] [Blocker] STMS Payment Page - Payment fails with "Sila hubungi 1700 816 186 untuk bantuan" in all modules; Highest; TO DO)
[2026-10-14 10:47] Lim Xiwei: hi all I will deploy uat3 in 1 min
[2026-10-14 10:55] Lim Xiwei: done thanks payment should be ok
[2026-10-14 13:51] Mei Jia Chee: Charmain Ea Chiang, HTP there replied "Just proceed with the testing first. We'll review what has been submitted later." so later if gt any blocker can let us know ya, once done also let us know. so we could get JPJ to verify them cc Yi Link Lim
[2026-10-14 13:53] Charmain Ea Chiang: okie can2, thanks MeiJia
[2026-10-14 13:55] Charmain Ea Chiang: Hi Lim Xiwei, please help to look into the 2 issue tickets below: https://mfservices.atlassian.net/browse/EAINT-12540 https://mfservices.atlassian.net/browse/EAINT-12541 EAINT-12541 is currently on hold as i need to confirm the expected result with SA first. You can fix EAINT-12540 first ya
[2026-10-14 14:18] Lim Xiwei: alright, also forgot to mention this deployment also include the latest changes
[2026-10-14 16:15] Charmain Ea Chiang: Hi Lim Xiwei, just checking ya, ETA when can i retest the issues raised? EAINT-12540 EAINT-12542
[2026-10-14 16:57] Lim Xiwei: hi all, I will deploy to uat3 in 1 min for the bug fixes
[2026-10-14 17:02] Lim Xiwei: done thanks
[2026-10-15 08:53] Charmain Ea Chiang: Hi morning all, Lim Xiwei as mentioned earlier, please help connect staging/uat3 to JPJ Staging ya, let me know once it is done thank you
[2026-10-15 09:39] Lim Xiwei: hi all, I will deploy to uat3 in 1 min for bug fix and connecting to JPJ staging
[2026-10-15 09:42] Lim Xiwei: this is done ya, thanks
[2026-10-15 11:43] Charmain Ea Chiang: Hi Yi Link Lim, can you please help to check with JPJ side, currently my side unable to go through with the VN stated in the SIT Test Script shared cc: Lim Xiwei May Chin Mei Theng Mei Jia Chee [attachment/image]
[2026-10-15 11:47] Charmain Ea Chiang: fyi it's blocker ya
[2026-10-15 14:00] Yi Link Lim: Charmain Ea Chiang can try again
[2026-10-15 14:13] Charmain Ea Chiang: Hi Lim Xiwei, can help to patch the vehicle no of transaction below: id = eac794c5-414d-421a-9901-2f156b947c33 VN = JQA10245
[2026-10-15 14:21] Lim Xiwei: done
[2026-10-15 14:39] Charmain Ea Chiang: Yi Link Lim i hit this error now Response Data from JPJ: (eTMSRes; sp_code eTMS; ss_code 676967T; pcid [redacted]; branchcode 6014611; trxid AUTOeTMSEnq20261015142910217181) <data1>000210140678~1~JQA1024~~~0~0~0~~6T~AB~MKR~0.00</data1> [attachment/image]
[2026-10-15 14:53] Mei Jia Chee: sent to JPJ ya
[2026-10-15 15:21] Charmain Ea Chiang: Hi Lim Xiwei, can help to patch the vehicle no of transaction below: id = 5670944b-2a43-47ee-8eb8-2ba5938a0430 VN = JQA10246
[2026-10-15 15:25] Lim Xiwei: done
[2026-10-15 15:54] Charmain Ea Chiang: Hi Mei Jia Chee Yi Link Lim, i have proceeded with testing the other modules, and these are the errors i encountered for eSTM, BMK, and eDereg Pre-Checking. Please refer to the attached screenshots and response data from JPJ. Can you help to forward these to JPJ for further checking? i used the information provided in the test scripts, but im still encountering errors
  1. eSTM TS4.1 – VBK4960. Environment: staging /uat3. Transaction No.: E601941703 (15-10-2026 15:08). Buyer: Individual, 030217141005. UCD: UCD TEST SDN BHD 1100676, Old 002606822-A / New 201703006321. Result: Failed, INVALID VEHICLE NO at Step 4 JPJ Check. BRN in request: Field 2 = 201703006321 (New BRN). Request data line (BO JPJ XML log): 1100676~201703006321~4~030217141005~1~VBK4960~CHSBK4960XYZ~ENGBK4960~1~10~N~0~N. Response (JPJRes, sp_code eSTM, ss_code 676967T, trxid AUTOeSTMEnq20261015150834599441): <data1>~~~VBK4960~~~0~0~0~~~~VEL000001E~~~~0~~0~~0~~~~</data1>
  2. BMK TS2.1 – AHM5476. Environment: staging /uat3. Transaction No.: BK600002085 (15-10-2026 15:12). Owner: Individual, 000210140678. UCD: UCD TEST SDN BHD 1100676, Old 002606822-A / New 201703006321. Result: Failed, VEHICLE OWNER NOT MATCH at Step 4 JPJ Check. BRN in request: No BRN field (individual-owner enquiry, as designed). Request data line: AHM5476~000210140678~1. Response (JPJRes, sp_code eAuto, ss_code 1100676, trxid eAUTOBMKEnq20261015151214124804): <data1>VEL000008E~000210140678~1~AHM5476~000000000</data1>
  3. eDereg TS5.1 – MKW1526. Environment: staging /uat3. Transaction No.: PC60001621 (15-10-2026 15:15). Owner: 000210140678. AATF: AATF SDN BHD 4020001, Old 002606833-A / New 201703006331. Result: Failed, VEL000045E PLEASE CONTACT HELPDESK at Step 3 Result (after payment, RHB OK). BRN in request: Field 9 = 201703006331 (New BRN). Request data line: MKW1526~2026-10-15 15:15:15.000~DPC261015000001~26101508070001~72404~2910002~E~5.00~201703006331~iznizurni@eauto.my~systemtest@eauto.my. Response (JPJRes, sp_code eAutoPreDeregEnq, ss_code 676967T, trxid eAutoPreDereg_Enq20261015151516057551): <data1>VEL000045E~MKW1526~-805</data1> [attachment/image]
[2026-10-15 16:02] Yi Link Lim: Noted. lemme inform JPJ on this
[2026-10-15 16:08] Lim Xiwei: hi all, I will deploy to uat3 in 1 min
[2026-10-15 16:13] Lim Xiwei: done thanks
[2026-10-15 17:07] Charmain Ea Chiang: Hi Yi Link Lim, any update on this ya?
[2026-10-15 17:07] Yi Link Lim: no updates from JPJ side just yet ya
[2026-10-15 21:40] Charmain Ea Chiang: Hi Yi Link Lim i put this here first ya, fyi i can get STMS Approved now, but TH still failed with the same VN [attachment/image]
[2026-10-16 08:29] Charmain Ea Chiang: Hi morning YiLink, just wanted to follow up, any update from JPJ side ya?
[2026-10-16 09:55] Yi Link Lim: Charmain Ea Chiang Currently no update just yet ya. As spoken, JPJ will check again and configure based on our SIT.
[2026-10-16 09:56] Charmain Ea Chiang: okie noted ya, thanks YiLink
[system] Yi Link Lim added Nur Izni Binti Zurni and 9 others to the chat.
[system] Tan Yi Fung added Lim Xiwei to the chat and shared all chat history.
[system] Charmain Ea Chiang added / removed Unknown User (shared all chat history).

## Update 2026-10-16 → 2026-10-26 (captured 2026-10-26)

<!-- Read-only capture via Teams web DOM, 2026-10-26. Times MYT. Messages from 2026-10-16 00:00 to capture time, oldest first.
     Line breaks inside a message shown as " / ". Quoted replies appear inline at the start of a message ("<name> / <date> / <quoted text> / reply"). Images shown as [image]; reactions dropped. -->

**Charmain Ea Chiang** — 2026-10-16 08:29: Yi Link Lim / 15/10/2026 17:07 / no updates from JPJ side just yet ya / Hi morning YiLink, just wanted to follow up, any update from JPJ side ya?

**Yi Link Lim** — 2026-10-16 09:55: Charmain Ea Chiang / 15/10/2026 21:40 / Hi Yi Link Lim i put this here first ya, fyi i can get STMS Approved now, but TH still failed with the same VN 📷 / Charmain Ea Chiang / 16/10/2026 08:29 / Hi morning YiLink, just wanted to follow up, any update from JPJ side ya? / Charmain Ea Chiang Currently no update just yet ya. As spoken, JPJ will check again and configure based on our SIT.

**Charmain Ea Chiang** — 2026-10-16 09:56: Yi Link Lim / 16/10/2026 09:55 / Charmain Ea Chiang Currently no update just yet ya. As spoken, JPJ will check again and configure based on our SIT. / okie noted ya, thanks YiLink

**Charmain Ea Chiang** — 2026-10-16 15:06: Hi Lim Xiwei, can you please help reconnect staging/uat3 to esim? Let me know once it is done ya, thankss

**Lim Xiwei** — 2026-10-16 15:12: hi all, I will deploy uat3 in 1 min

**Yi Link Lim** — 2026-10-16 15:15: Charmain Ea Chiang / 16/10/2026 15:06 / Hi Lim Xiwei, can you please help reconnect staging/uat3 to esim? Let me know once it is done ya, thankss / Charmain Ea Chiang As discussed, QA side can continue testing using esim since JPJ side did not complete the configuration for SIT test scenario.

**Lim Xiwei** — 2026-10-16 15:16: Lim Xiwei / 16/10/2026 15:12 / hi all, I will deploy uat3 in 1 min / done thanks, uat3 is connect back to esim ya

**Mei Jia Chee** — 2026-10-16 15:55: hii Everyone, to update that as confirmed with Nurul just now - we wont proceed testing with JPJ side ya. anyway we will still proceed deployment on next Monday night session. then Tuesday need help to monitor monitor / cc Yi Link Lim

**Charmain Ea Chiang** — 2026-10-16 15:56: Mei Jia Chee / 16/10/2026 15:55 / hii Everyone, to update that as confirmed with Nurul just now - we wont proceed testing with JPJ side ya. anyway we will still proceed deployment on next Monday night session. then Tuesday need help… / okie noted ya, thanks for the update, Mei Jia

**Charmain Ea Chiang** — 2026-10-19 08:46: Hi Everyone, just a quick update, QA has completed testing for EAINT-8622 on staging/uat3 (eAuto) with no outstanding issues. It's ready for night deployment on 19 Oct (Monday). Thanks to everyone involved! / STMS + TH / eSTM / BMK / APT / UCD to UCD / eDereg PreChecking / cc: Yi Link Lim Lim Xiwei [image]

**Jin Siang Boo** — 2026-10-19 14:10: Hi Everyone, I merged two changes to staging/uat3, let me know if have any concern. Thanks / Hak Milik Enquiry after Approved eSTM - Not required QA to test / Wholesale STMS - Need QA to regress whether use New BRN

**Charmain Ea Chiang** — 2026-10-19 14:15: Hi Everyone, just to make sure we are aligned, we will include 2 additional flows as discussed just now: / Hak Milik JPJ Enquiry - After eSTM transaction is approved / Wholesale STMS - STMS JPJ Enquiry and Final Submission / Wholesale Chat - STMS & eSTM JPJ Enquiry / Wholesale APT - APT JPJ Enquiry and Final Submission / cc: Jin Siang Boo Yi Link Lim

**Charmain Ea Chiang** — 2026-10-19 14:15: Jin Siang Boo / 19/10/2026 14:10 / Hi Everyone, I merged two changes to staging/uat3, let me know if have any concern. Thanks Hak Milik Enquiry after Approved eSTM - Not required QA to test Wholesale STMS - Need QA to regress whether… / ok let me know once you done ya

**Charmain Ea Chiang** — 2026-10-19 15:01: Jin Siang Boo / 19/10/2026 14:10 / Hi Everyone, I merged two changes to staging/uat3, let me know if have any concern. Thanks Hak Milik Enquiry after Approved eSTM - Not required QA to test Wholesale STMS - Need QA to regress whether… / Hi Brandon, any update on this? deployment done?

**Charmain Ea Chiang** — 2026-10-19 15:07: Charmain Ea Chiang / 19/10/2026 14:15 / Hi Everyone, just to make sure we are aligned, we will include 2 additional flows as discussed just now: 1. Hak Milik JPJ Enquiry - After eSTM transaction is approved 2. Wholesale STMS - STMS JPJ En… / Wei Ting Lim as mentioned just now, you will deploy the changes for item #3, and QA testing is not required ya / cc: Jin Siang Boo Yi Link Lim

**Wei Ting Lim** — 2026-10-19 15:09: ya i will check on item 3, ady deployed changes for wholesale related on uat 3, wholesale uat also point to uat3 already

**Charmain Ea Chiang** — 2026-10-19 15:10: Wei Ting Lim / 19/10/2026 15:09 / ya i will check on item 3, ady deployed changes for wholesale related on uat 3, wholesale uat also point to uat3 already / okie i will start testing on item #2 now, thank you

**Wei Ting Lim** — 2026-10-19 15:14: we got cover for APT ? for old -> new brn

**Wei Ting Lim** — 2026-10-19 15:15: coz just now fix we didn't cover wholesale apt, for the case seller need to pay apt, then pay at wholesale side, use wholesale flow to pay / create / update apt

**Charmain Ea Chiang** — 2026-10-19 15:20: nope, we didnt cover wholesale APT, tested for normal APT flow only

**Wei Ting Lim** — 2026-10-19 15:21: ya i mean apt normal

**Wei Ting Lim** — 2026-10-19 15:21: now wholesale part not yet handle

**Charmain Ea Chiang** — 2026-10-19 15:21: Wei Ting Lim / 19/10/2026 15:21 / ya i mean apt normal / oh, covered dy

**Wei Ting Lim** — 2026-10-19 15:22: Jin Siang Boo u mentioned APT not yet handled ?

**Charmain Ea Chiang** — 2026-10-19 15:22: Wei Ting Lim can help to provide the JPJ XML Log for the Wholesale transactions below: / transactionId=afe2e88e-e66b-4bcb-9efb-e6e3fc0d2296 / transactionId=5be5da82-2ebf-473c-85fc-66155e071049 / i need both jpj enquiry and final submission request and response data as test evidence, thank you

**Charmain Ea Chiang** — 2026-10-19 15:22: Charmain Ea Chiang / 14/10/2026 10:37 / Hi Mei Jia Chee Yi Link Lim, this is the latest test data ya EAINT-8622 - SIT Test Scenarios.xlsx 📄 / can refer to this SIT test script for the testing scope ya

**Wei Ting Lim** — 2026-10-19 15:28: trx id: afe2e88e-e66b-4bcb-9efb-e6e3fc0d2296 / jpj enq req: / 1446363-V~4~RAD6736~PM2M806S002117512~2NR0V40821~1149578~202301020647~1 / jpj enq resp: / 1446363-V~4~RAD6736~~~0~0~0~~00~AB~MKR~ / jpj sub req: / VEL04007~1446363-V~4~RAD6736~202301020647~EAUTO DIGITS SDN BHD~1149578~86, JLN AMPANG, KUALA LUMPUR, 50450 KUALA LUMPUR, WILAYAH PERSEKUTUAN KUALA LUMPUR~~~50450~1401~14~2026-10-19 15:16:06.000~2610190017000023~72423~2361001~10.00~maisarah.nuraliyaa@modefair.com~systemtest@eauto.my / jpj sub resp: / RAD6736~00~202301020647~VEL04007~0.00~2027-04-19~2026101986266399~~~~~~~ /

**Wei Ting Lim** — 2026-10-19 15:30: trx id: 5be5da82-2ebf-473c-85fc-66155e071049 / jpj enq req: / 1514569-H~4~RAD6736~PM2M806S002117512~2NR0V40821~1101022~201301014762~1 / jpj enq resp: / 1514569-H~4~RAD6736~~~0~0~0~~00~AB~MKR~ / jpj sub req: / VEL04007~1514569-H~4~RAD6736~201301014762~GLOBAL WHEELS AUTOMOTIVE SDN. BHD.~1101022~LOT 391, BATU 14, JALAN CHERAS~~~43000~1000~10~2026-10-19 15:18:31.000~2610190017000025~72423~2361001~10.00~weiting.lim@modefair.com~systemtest@eauto.my / jpj sub resp: / RAD6736~00~201301014762~VEL04007~0.00~2027-04-19~2026101912758289~~~~~~~

**Charmain Ea Chiang** — 2026-10-19 15:58: Charmain Ea Chiang / 19/10/2026 14:15 / Hi Everyone, just to make sure we are aligned, we will include 2 additional flows as discussed just now: 1. Hak Milik JPJ Enquiry - After eSTM transaction is approved 2. Wholesale STMS - STMS JPJ En… / Everyone, i have completed testing for item #2, and all tests passed ya, you can refer to the test evidence here: / Wei Ting Lim / 19/10/2026 15:28 / trx id: afe2e88e-e66b-4bcb-9efb-e6e3fc0d2296 jpj enq req: 1446363-V~4~RAD6736~PM2M806S002117512~2NR0V40821~1149578~202301020647~1 jpj enq resp: 1446363-V~4~RAD6736~~~0~0~0~~00~AB~MKR~ jpj sub req:… / Wei Ting Lim / 19/10/2026 15:30 / trx id: 5be5da82-2ebf-473c-85fc-66155e071049 jpj enq req: 1514569-H~4~RAD6736~PM2M806S002117512~2NR0V40821~1101022~201301014762~1 jpj enq resp: 1514569-H~4~RAD6736~~~0~0~0~~00~AB~MKR~ jpj sub req:…

**Wei Ting Lim** — 2026-10-19 16:25: wholesale pre checking / stms jpj enq req: / 1446363-V~4~JQD7363~CN7363~EN7363~1149578~202301020647~1 / stms jpj enq resp: / 1446363-V~4~JQD7363~~~0~0~0~~00~AA~MKR~ / estm jpj enq req: / 1109451~202201000666~4~1514569-H~4~JQD7363~CN7363~EN7363~1~10~N~0~N / esm jpj enq resp: / 1109451~4~202201000666~JQD7363~~~0~0~0~~~~GLB000000I~AB~MKR~2361007~100.00~2354071~50.00~~0.00~~~~Brandon Boo

**Wei Ting Lim** — 2026-10-19 16:25: here are the wholesale pre checking xml, later i check if correct

**Wei Ting Lim** — 2026-10-19 16:30: ok should be good for stms and estm enq

**Mei Jia Chee** — 2026-10-19 16:43: Everyone, as liaised we will still proceed deployment today. / for the changes that Jin Siang Boo working on, please put the details on what is the affected part and what QA need to test / Tan Yi Fung, need ur side to prepare and arrange man power tmr to monitor on the result, and touch wood if anything happen have to take action on how to solve it. before that do share the planning to SAs / cc Nur Izni Binti Zurni Yi Link Lim Charmain Ea Chiang

**Charmain Ea Chiang** — 2026-10-19 16:50: Hi Jin Siang Boo, as mentioned just now, for the further enhancement of this ticket after tonight's deployment, QA will cover the following scenarios: / BRN flag = TRUE / BRN flag = FALSE / APT Cronjob, JPJ Enquiry and Final Submission / As for the testing estimation, QA side will need around 0.5 day with buffer ya / Please let me know if anyone has any concerns, thanks / cc: Yi Link Lim

**Yi Link Lim** — 2026-10-19 17:02: Charmain Ea Chiang / 19/10/2026 16:50 / Hi Jin Siang Boo, as mentioned just now, for the further enhancement of this ticket after tonight's deployment, QA will cover the following scenarios: 1. BRN flag = TRUE 2. BRN flag = FALSE 3. APT C… / Just to confirm, BRN flag is based on New BRN?

**Charmain Ea Chiang** — 2026-10-19 17:06: Yi Link Lim / 19/10/2026 17:02 / Just to confirm, BRN flag is based on New BRN? / Jin Siang Boo can help to confirm on this?

**Jin Siang Boo** — 2026-10-19 17:15: Yi Link Lim / 19/10/2026 17:02 / Just to confirm, BRN flag is based on New BRN? / No, based on company / if True, means will use currently behaviors in staging/uat3 / if False, means will use current production behaviors (either new brn or old brn based on module)

**Jin Siang Boo** — 2026-10-19 19:46: Charmain Ea Chiang / 19/10/2026 16:50 / Hi Jin Siang Boo, as mentioned just now, for the further enhancement of this ticket after tonight's deployment, QA will cover the following scenarios: 1. BRN flag = TRUE 2. BRN flag = FALSE 3. APT C… / The changes ready in staging/uat4 ya

**Charmain Ea Chiang** — 2026-10-20 08:16: Hi morning all, Jin Siang Boo please let me know once you have deployed all the changes to staging/uat3 ya. QA will start testing once ready

**Charmain Ea Chiang** — 2026-10-20 09:02: fyi Lim Xiwei has deployed the changes to staging/uat3 ya, i will start testing now / cc: Yi Link Lim Jin Siang Boo

**Wei Ting Lim** — 2026-10-20 09:02: fyi, i also deploy changes for wholesale apt checking, which trigger stms jpj enq

**Wei Ting Lim** — 2026-10-20 09:03: also updated wholesale payment to call that stms jpj enq once a day only

**Charmain Ea Chiang** — 2026-10-20 09:03: okie thank you so much Wei Ting

**Charmain Ea Chiang** — 2026-10-20 09:17: Hi good morning Jin Siang Boo, can you please provide screenshot of the BRN flag for the company below ya? / UCD TEST SDN BHD / Company ID = 1100676

**Jin Siang Boo** — 2026-10-20 09:39: [image]

**Charmain Ea Chiang** — 2026-10-20 10:48: Jin Siang Boo / 20/10/2026 09:39 / 📷 / Brandon, can help to patch the New BRN Flag to False, thank you

**Charmain Ea Chiang** — 2026-10-20 11:40: Charmain Ea Chiang / 20/10/2026 10:48 / Brandon, can help to patch the New BRN Flag to False, thank you / Brandon, this one done ya?

**Jin Siang Boo** — 2026-10-20 11:45: [image]

**Charmain Ea Chiang** — 2026-10-20 12:34: Hi Jin Siang Boo, can help to patch the transaction below: / Trx id = 9880b50d-fb56-46d7-85d9-6cb52957b8a8 / JPJ Submission = Pending due to issue with JPJ API / Tx Status = Pending

**Charmain Ea Chiang** — 2026-10-20 13:12: Charmain Ea Chiang / 19/10/2026 16:50 / Hi Jin Siang Boo, as mentioned just now, for the further enhancement of this ticket after tonight's deployment, QA will cover the following scenarios: 1. BRN flag = TRUE 2. BRN flag = FALSE 3. APT C… / Hi Everyone, a quick update on the testing progress / QA has completed testing for items 1 and 2. So far everything looks good, with no blockers. / New BRN flag = TRUE / New BRN flag = FALSE / For item #3, im currently waiting for the aptJpjSubmissionTrigger cronjob to be ready, Brandon is checking on it. / i will update again once everything is completed ya [image]

**Wei Ting Lim** — 2026-10-20 13:19: Jin Siang Boo I need to test this flag thing with wholesale ?

**Jin Siang Boo** — 2026-10-20 13:19: Wei Ting Lim / 20/10/2026 13:19 / Jin Siang Boo I need to test this flag thing with wholesale ? / better to

**Wei Ting Lim** — 2026-10-20 13:19: Ok

**Wei Ting Lim** — 2026-10-20 13:20: I cover the precheck only first

**Wei Ting Lim** — 2026-10-20 13:20: Later

**Wei Ting Lim** — 2026-10-20 14:15: stms jpj enq req: 1446363-V~4~ALA6873~CN6873~EN6873~1149578~202301020647~1 / estm jpj enq req: 1109451~202201000666~4~1514569-H~4~ALA6873~CN6873~EN6873~1~10~N~0~N

**Wei Ting Lim** — 2026-10-20 14:27: apt checking at seller side, stms jpj enq req: 1446363-V~4~ALA6873~CN6873~EN6873~1149578~202301020647~1 / apt enq: 202201000666~4~ALA6873~CN6873~EN6873~1109451~000808010801~1 / apt sub: ALA6873~202201000666~1109451~20261020~1428~2610200017000001~72423~2361002~100.00~202201000666~weiting.lim@modefair.com~systemtest@eauto.my

**Charmain Ea Chiang** — 2026-10-20 14:57: Hi Jin Siang Boo, can you please provide screenshot of the BRN flag for the company below ya? / GLOBAL WHEELS AUTOMOTIVE SDN. BHD. / Company ID = 1101022 / MD AUTOMOBILE / Company ID = 1100583 / EAUTO DIGITS SDN BHD / Company ID = 1149578 / should be all New BRN flag = TRUE ya

**Wei Ting Lim** — 2026-10-20 14:58: [image]

**Wei Ting Lim** — 2026-10-20 14:59: [image]

**Wei Ting Lim** — 2026-10-20 14:59: [image]

**Wei Ting Lim** — 2026-10-20 14:59: md auto is 1109451 [image]

**Charmain Ea Chiang** — 2026-10-20 15:07: Hi Jin Siang Boo Lim Xiwei, can you help to screenshot the APT request XML from DB for the transactions below? / Dealer: CHARRRRRR CHICKCOLI SDN BHD123321 (1109610) / JpjPermanentTransferTrigger, VN = UTDH343DD, APT ref A60347827 / (trx id = 1044e094-3446-4a86-b221-c6bac9e34a1b) / 6.0 APT (AT), 20-10-2026 10:51 / APTPaymentSubmission, VN = UTCFGDFT444, APT ref A60347829 / (trx id = 088b75a6-1c9a-493f-9b74-e88bab2d339d) / 6.0 APT (ATSubmission), 20-10-2026 12:00 / aptJpjSubmissionTrigger, VN = UTFFG222S3, APT ref A60347830 / (trx id = 9880b50d-fb56-46d7-85d9-6cb52957b8a8) / 6.0 APT (ATSubmission), 20-10-2026 14:20

**Charmain Ea Chiang** — 2026-10-20 15:27: Hihi Wei Ting Lim, can help to patch the company below with New BRN Flag = False / GLOBAL WHEELS AUTOMOTIVE SDN. BHD. / Company ID = 1101022 / MD AUTO CARS SDN. BHD. / Company ID = 1109451 / EAUTO DIGITS SDN BHD / Company ID = 1149578 / please provide the screenshot as well ya, thanks

**Jin Siang Boo** — 2026-10-20 15:29: / Plain Text / UTDH343DD~201403045623~1109610~20261020~1100~2610200017000029~72423~2361002~100.00~201403045623~charmainec@modefair.com~systemtest@eauto.my / UTCFGDFT444~201403045623~1109610~20261020~1200~2610200017000045~72423~2361002~100.00~201403045623~charmainec@modefair.com~systemtest@eauto.my / UTFFG222S3~201403045623~1109610~20261020~1224~2610200017000059~72423~2361002~100.00~201403045623~charmainec@modefair.com~systemtest@eauto.my /

**Jin Siang Boo** — 2026-10-20 15:30: [image]

**Jin Siang Boo** — 2026-10-20 15:34: Charmain Ea Chiang done change [image]

**Charmain Ea Chiang** — 2026-10-20 15:42: Hi Wei Ting Lim can help to provide the JPJ XML Log for the Wholesale transactions below: / transactionId=a7217707-88a8-486b-a8d8-dddc893465d8 / transactionId=79594b02-1c28-43ad-9091-de1c72b217e0 / transactionId=e9a3d484-bfc8-48e3-a716-f244a6a81132 / transactionId=62f41449-0388-46f1-b3aa-c3365eec077c

**Wei Ting Lim** — 2026-10-20 15:43: ok later

**Wei Ting Lim** — 2026-10-20 15:47: after flag is false / precheck / stms jpj enq req: 1446363-V~4~JQD7363~CN7363~EN7363~1149578~1514569-H~1 / estm jpj enq req: 1109451~1446363-V~4~1514569-H~4~JQD7363~CN7363~EN7363~1~10~N~0~N / seller page load check for apt / stms jpj enq req: 1446363-V~4~JQD7363~CN7363~EN7363~1149578~1514569-H~1 / wholesale apt / apt enq: 1446363-V~4~JQD7363~CN7363~EN7363~1109451~000808010801~1 / apt sub: JQD7363~1446363-V~1109451~20261020~1545~2610200017000091~72423~2361002~3.00~1446363-V~weiting.lim@modefair.com~systemtest@eauto.my /

**Wei Ting Lim** — 2026-10-20 15:51: Charmain Ea Chiang / 20/10/2026 15:42 / Hi Wei Ting Lim can help to provide the JPJ XML Log for the Wholesale transactions below: 1. transactionId=a7217707-88a8-486b-a8d8-dddc893465d8 2. transactionId=79594b02-1c28-43ad-9091-de1c72b217e0… / a7217707-88a8-486b-a8d8-dddc893465d8 / enq: 1446363-V~4~ALS173~PL1BT3SRRMB132592~S4PEWF1369~1149578~202301020647~1 / sub: VEL04007~1446363-V~4~ALS173~202301020647~EAUTO DIGITS SDN BHD~1149578~86, JLN AMPANG, KUALA LUMPUR, 50450 KUALA LUMPUR, WILAYAH PERSEKUTUAN KUALA LUMPUR~~~50450~1401~14~2026-10-20 15:20:13.000~2610200017000081~72423~2361001~10.00~maisarah.nuraliyaa@modefair.com~systemtest@eauto.my / 79594b02-1c28-43ad-9091-de1c72b217e0 / enq: 1514569-H~4~ALS173~PL1BT3SRRMB132592~S4PEWF1369~1101022~201301014762~1 / sub: VEL04007~1514569-H~4~ALS173~201301014762~GLOBAL WHEELS AUTOMOTIVE SDN. BHD.~1101022~LOT 391, BATU 14, JALAN CHERAS~~~43000~1000~10~2026-10-20 15:23:41.000~2610200017000083~72423~2361001~10.00~weiting.lim@modefair.com~systemtest@eauto.my / e9a3d484-bfc8-48e3-a716-f244a6a81132 / enq: 1446363-V~4~VD8071~PL1CR6SDRHG071173~S4PHVB1379~1149578~1514569-H~1 / sub: VEL04007~1446363-V~4~VD8071~1514569-H~EAUTO DIGITS SDN BHD~1149578~86, JLN AMPANG, KUALA LUMPUR, 50450 KUALA LUMPUR, WILAYAH PERSEKUTUAN KUALA LUMPUR~~~50450~1401~14~2026-10-20 15:40:36.000~2610200017000087~72423~2361001~10.00~maisarah.nuraliyaa@modefair.com~systemtest@eauto.my / 62f41449-0388-46f1-b3aa-c3365eec077c / enq: 1514569-H~4~VD8071~PL1CR6SDRHG071173~S4PHVB1379~1101022~1044595-W~1 / sub: VEL04007~1514569-H~4~VD8071~1044595-W~GLOBAL WHEELS AUTOMOTIVE SDN. BHD.~1101022~LOT 391, BATU 14, JALAN CHERAS~~~43000~1000~10~2026-10-20 15:41:29.000~2610200017000089~72423~2361001~10.00~weiting.lim@modefair.com~systemtest@eauto.my

**Wei Ting Lim** — 2026-10-20 15:58: Wei Ting Lim / 20/10/2026 15:47 / after flag is false precheck stms jpj enq req: 1446363-V~4~JQD7363~CN7363~EN7363~1149578~1514569-H~1 estm jpj enq req: 1109451~1446363-V~4~1514569-H~4~JQD7363~CN7363~EN7363~1~10~N~0~N seller page… / i compare liao flag on vs off macam correct, Charmain Ea Chiang you also helping to cross check right ?

**Charmain Ea Chiang** — 2026-10-20 15:59: Wei Ting Lim can help to check these 2 trx? Flag = TRUE should send new BRN [image]

**Wei Ting Lim** — 2026-10-20 16:00: shd be correct, wait a

**Charmain Ea Chiang** — 2026-10-20 16:00: Wei Ting Lim / 20/10/2026 15:58 / i compare liao flag on vs off macam correct, Charmain Ea Chiang you also helping to cross check right ? / yup2 i crosscheck dy, should be correct

**Charmain Ea Chiang** — 2026-10-20 16:01: oh wait

**Wei Ting Lim** — 2026-10-20 16:01: stms jpj enq only 7th fields will be new roc (ucd), the first part seller no change use roc

**Charmain Ea Chiang** — 2026-10-20 16:01: haha im wrong

**Charmain Ea Chiang** — 2026-10-20 16:01: Wei Ting Lim / 20/10/2026 16:01 / stms jpj enq only 7th fields will be new roc (ucd), the first part seller no change use roc / yaya correct, sorry confused for awhile

**Wei Ting Lim** — 2026-10-20 16:02: stms sub is 5th is ucd roc need use new brn

**Wei Ting Lim** — 2026-10-20 16:03: ok ok sorry for confusing [image]

**Wei Ting Lim** — 2026-10-20 16:03: that why need you help cross check mine also

**Wei Ting Lim** — 2026-10-20 16:04: i think wholesale done ady right ?

**Wei Ting Lim** — 2026-10-20 16:04: testing part

**Charmain Ea Chiang** — 2026-10-20 16:04: yup2 done

**Wei Ting Lim** — 2026-10-20 16:05: ok bye haha

**Charmain Ea Chiang** — 2026-10-20 16:05: my side all done as well, let me do a final check on the test evidence

**Charmain Ea Chiang** — 2026-10-20 16:34: Hi Everyone, just a quick update, QA has completed testing for EAINT-8622 on staging/uat3 (eAuto) with no outstanding issues. It's ready for night deployment on 20 Oct (Tuesday). Thanks to everyone involved!

**Wei Ting Lim** — 2026-10-20 16:35: all good ady ? maybe i will deploy wholesale payment earlier

**Charmain Ea Chiang** — 2026-10-20 16:41: Wei Ting Lim / 20/10/2026 16:35 / all good ady ? maybe i will deploy wholesale payment earlier / ya so far all good

**Charmain Ea Chiang** — 2026-10-21 15:02: Hi Tan Yi Fung Jin Siang Boo Goh Kai Jiaeh, i will share the test evidence here ya / Tested the UCD to UCD Interstate flow with the 3B error code. As expected, whenever a JPJ enquiry returns a 3B error code, the system will resubmit another JPJ enquiry using the UCD New BRN. / Testing passed, and everything is working as expected. / cc: Yi Link Lim [image]

**Yi Link Lim** — 2026-10-21 17:51: Jin Siang Boo Kindly create a ticket to be deployed by tonight deployment: / BRN Type Handling for JPJ Submission / If JPJ returns error code VEL000008E or REF000006E, switch the BRN type before resubmitting. / If the current BRN type is Old BRN and the system submits using New BRN, switch to Old BRN and resubmit to JPJ.

**Yi Link Lim** — 2026-10-21 18:12: Yi Link Lim / 21/10/2026 17:51 / Jin Siang Boo Kindly create a ticket to be deployed by tonight deployment: BRN Type Handling for JPJ Submission • If JPJ returns error code VEL000008E or REF000006E, switch the BRN type before resub… / Goh Kai Jiaeh Jin Siang Boo To update, here is the ticket created for tonight deployment: https://mfservices.atlassian.net/browse/EAINT-12578

**Yi Link Lim** — 2026-10-22 09:51: Hi devs Tan Yi Fung Goh Kai Jiaeh Jin Siang Boo, can share here how many trx has been affected in prod yesterday due to eaint-8622?

**Yi Link Lim** — 2026-10-22 11:02: Yi Link Lim / 22/10/2026 09:51 / Hi devs Tan Yi Fung Goh Kai Jiaeh Jin Siang Boo, can share here how many trx has been affected in prod yesterday due to eaint-8622? / Hi devs, any updates on this?

**Jin Siang Boo** — 2026-10-22 11:11: More info can refer here. / https://claude.ai/artifact/Mr3gqMAna7Lp6s63ph7dYW?sk=[share key redacted]#e34cf252-7c5f / By KJ [image]

**Yi Link Lim** — 2026-10-22 11:19: Thanks for sharing

**Goh Kai Jiaeh** — 2026-10-22 12:49: Here is the dealer affected. updated in artifact also. [image]

**Yi Link Lim** — 2026-10-22 14:15: Goh Kai Jiaeh / 22/10/2026 12:49 / 📷 Here is the dealer affected. updated in artifact also. / KJ ah, I just need info as per below ya: [image]

**Goh Kai Jiaeh** — 2026-10-22 14:29: As spoken can refer above.

**Yi Link Lim** — 2026-10-22 15:06: Goh Kai Jiaeh / 22/10/2026 14:29 / As spoken can refer above. / To add on, / Can ignore APT as handling helped on APT and get successful response & AJ AUTOMART / Attached table is the affected trx number & UCD / Modules / Transactions Vehicles / Dealers / STMS (UCD to UCD) 87 / 26 / 20 / BMK 11 4 3 / Total 98 30 23 /
