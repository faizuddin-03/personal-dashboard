<!-- Source: Teams group chat "EAINT-11934 & EAINT-12058 [CIBO-Transaction Management Listing & Payment Report] Enhance field to include User ID of used car dealer representative & enhancement on the Transaction Listing Table".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2026-07-14). Reactions and acknowledgements dropped. -->
# EAINT-11934 & 12058 CIBO UCD user ID / Transaction Listing

[2026-07-14 13:06] Mei Jia Chee: hiii Everyone, will use this CR group for ticket: https://mfservices.atlassian.net/browse/EAINT-11934 / uploaded SRD v0.1 ya, may take a look [attachment/image]
[2026-07-14 13:06] Mei Jia Chee: Tan Yi Fung, can help to assign dev to work on this ya? tentatively target to deploy latest by early of Aug
[2026-07-14 14:43] Tan Yi Fung: Leong Jin Chuen, please help on this ticket
[2026-07-14 15:49] Mei Jia Chee: Everyone, uploaded SRD v0.2 ya
[2026-07-14 16:04] Mei Jia Chee: Everyone, would like to have a briefing session for this ticket tmr around 12pm ya.
[2026-07-15 08:27] Yi Link Lim: Hi Everyone we would like to reschedule briefing session for this ticket to tmr around 11am yaa.
[2026-07-16 11:00] Mei Jia Chee: start the call now ya
[2026-07-16 12:57] Leong Jin Chuen: Hi Mei Jia Chee, can be done on next Wednesday including code review
[2026-07-16 15:04] Mei Jia Chee: Everyone, just to share that i sent out SRD v1.0 for requestor to review ya. once dpt green light will update again
[2026-07-20 09:01] Mei Jia Chee: morning Everyone, targeted to deploy this ticket on 24.07.2026 (Fri) morning ya
[2026-07-23 09:55] Leong Jin Chuen: Hi guys, will deploy EAINT-11934 to staging now, affected branch to be aware : cibo-frontend - staging/cibo; secrang-eauto-intergration - staging/preprod; secarang-backend - staging/ins (11:06 Deployment done)
[2026-07-23 17:11] Mei Jia Chee: Leong Jin Chuen Maisarah Nuraliyaa Binti Masrom, as liaised just now for tmr deployment we will deploy on the payment report part first. will push transaction listing later once is ready. Leong Jin Chuen, do update in the group once is ready for QA to have a quick check on the transaction listing - to hide the UCD name column ya cc May Chin Mei Theng Goh Kai Jiaeh
[2026-07-23 17:13] Mei Jia Chee: added another ticket to enhance the for transaction listing table ya, is related to the EAINT-11934 Transaction Listing part: https://mfservices.atlassian.net/browse/EAINT-12058
[2026-07-23 18:03] Leong Jin Chuen: Hi guys, will deploy EAINT-11934 to staging now, affected branch to be aware : cibo-frontend - staging/cibo; secarang-backend - staging/ins (18:15 Deployment done, may test it now)
[2026-07-23 18:20] Maisarah Nuraliyaa Binti Masrom: QA side already checked ya. UCD Name column is hidden now in the Transaction Listing both listing and excel.
[2026-07-23 18:29] Maisarah Nuraliyaa Binti Masrom: Hi Everyone, this is to inform that QA testing for EAINT-11934 has been completed and verified as good. Thank you
[2026-07-24 08:31] Goh Kai Jiaeh: hi all, deployment is done.
[2026-07-24 08:45] Maisarah Nuraliyaa Binti Masrom: Hi Everyone, QA has completed the production regression testing ya, thank you
[2026-07-27 09:33] Mei Jia Chee: hiii morning everyone, Goh Kai Jiaeh wan to check with u for EAINT-12058 eta when could ready for testing ya?
[2026-07-27 09:37] Goh Kai Jiaeh: hi Mei Jia, this one let me study what's the impacted area 1st then get back again.
[2026-08-04 09:13] Goh Kai Jiaeh: Morning Mei Jia, sorry overlook this. Eta next Monday.
[2026-08-04 09:15] Mei Jia Chee: may i know QA side eta need how long to test for this ya?
[2026-08-07 11:18] Mei Jia Chee: hii Goh Kai Jiaeh, wan to check for this changes need night deployment or can done during morning session ya?
[2026-08-10 09:42] Goh Kai Jiaeh: hi all, will need more time for this ticket. Will target to get ready Wednesday morning.
[2026-08-11 17:56] Goh Kai Jiaeh: hi may I know QA got any plan on the eauto staging branch for this ticket?
[2026-08-12 10:15] Goh Kai Jiaeh: hi all, fyi the changes is ready on staging. Just pending the confirmation on eauto staging branch.
[2026-08-12 12:07] Charmain Ea Chiang: Hi KJ, sorry for the late reply, can use staging/uat4 for eauto changes ya
[2026-08-12 14:07] Goh Kai Jiaeh: Thanks. Fyi changes is deployed to staging/uat4.
[2026-08-14 09:56] Mei Jia Chee: hiii morning, wan to check this ticket ready to show happy flow ya?
[2026-08-14 10:37] Muhammad Faizuddin Bin Bidi: Hi morning. Currently still checking. Will update here if ready
[2026-08-14 11:04] Muhammad Faizuddin Bin Bidi: should be in 30 minutes can complete for happy flow ya
[2026-08-14 11:59] Muhammad Faizuddin Bin Bidi: Hi Mei Jia, the happy flow for eauto is complete. Just note that if we were to simulate from Secarang, currently have existing payment issue in staging so will need to dev help to patch the payment
[2026-08-14 12:31] Mei Jia Chee: okkies, the ucd name can show, right?
[2026-08-14 14:52] Muhammad Faizuddin Bin Bidi: Yup. all showing
[2026-08-14 17:19] Mei Jia Chee: just fyi that i shared the changes to Shamini ad ya, she ok and can proceed to deploy on next Monday
[2026-08-14 18:00] Muhammad Faizuddin Bin Bidi: Hi Everyone, here to inform that QA has finished testing this ticket and is ready for deployment ya. Thank you
[system] Group renamed from "EAINT-11934 [CIBO-Transaction Management Listing & Payment Report] Enhance field to include User ID of used car dealer representative" to include EAINT-12058. Charmain Ea Chiang added Muhammad Faizuddin Bin Bidi; Goh Kai Jiaeh added Mong Guo Hao.
