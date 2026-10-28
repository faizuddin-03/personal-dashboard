<!-- Source: Teams group chat "EAINT-12342". Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2026-09-28, 39 messages). Acknowledgements dropped. -->
# EAINT-12342 WhatsApp alert recipient list

[2026-09-28 08:54] Mei Jia Chee: hii everyone, will use this CR group for EAINT-12342 / srd v0.1 is ready on jira but still not final as of now ya.
[2026-09-28 08:57] Mei Jia Chee: also i need dev to advise if this ticket QA need to involve for testing or not yaa
[2026-09-28 09:45] Goh Kai Jiaeh: hi all, I believe this ticket is just to remove KM's number from message sending. If that's the case I believe no need QA testing since staging config already took out KM's number.
[2026-09-28 09:46] Goh Kai Jiaeh: If okay then I will deploy together with EAINT-12151 in this Wed deployment.
[2026-09-28 09:50] Mei Jia Chee: i believe that we not only need to remove KM's number yaaa. i will share the listing later once confirm, as there are few numbers i believe no longer relevant anymore
[2026-09-28 12:36] Mei Jia Chee: Shamini just wan to remain those whatsapp alert that related to failed trx, cover note failed, jpj failed or anything related to the trx cannot be created successfully ya. Note: for the success whatsapp still need to send to customer
[2026-09-28 12:50] Goh Kai Jiaeh: If got changes other than taking out KM's phone, might involve QA to test.
[2026-09-28 15:19] Goh Kai Jiaeh: Ya, consider inactive for that phone number.
[2026-09-28 15:20] Mei Jia Chee: i would suggest to proceed to remove those phone number in order to achieve "inactive" ya.
[2026-09-29 10:22] Mei Jia Chee: SRD v1.2 is ready ya / basically, the changes is to remove eAuto Support from the listing and add Wani's phone number to the listing ya
[2026-09-29 11:54] Mei Jia Chee: just to share that Shamini given green light for SRD v1.2 ya
[2026-09-29 14:38] Goh Kai Jiaeh: Can include together on Wed one.
[2026-09-29 14:44] Goh Kai Jiaeh: Just to confirm the latest config will include 3 type with the number then the rest no need to send right? [img]
[2026-09-29 15:43] Mei Jia Chee: yea yea, just follow this will do ya / others no need ad
[2026-09-29 16:54] Goh Kai Jiaeh: Fyi, I will do some changes for covernote message sending as currently it doesn't support multiple recipient. / I will enable messagebird on staging and do some testing. I have informed Shamini on this.
[2026-09-29 17:00] Goh Kai Jiaeh: hi Charmain Ea Chiang, could help to verify if you receive the msg of TEST1234?
[2026-09-29 17:06] Charmain Ea Chiang: Hi KJ, yup2, here you go [img]
