<!-- Source: Teams group chat "EAINT-12175 [Secarang-Insurance] To Correct Insurer Name to Lonpac Insurance Bhd & Update SDPA Policy Wording Link".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2026-08-17). Reactions dropped.
     Batrisyia Hasanah's later messages show as "Unknown User" in Teams (account removed). -->
# EAINT-12175 Lonpac Insurance Bhd & SDPA wording

[2026-08-17 14:38] Batrisyia Hasanah Binti Nursyamsi: Hi Everyone, we will use this CR group for https://mfservices.atlassian.net/browse/EAINT-12175
[2026-08-17 14:38] Batrisyia Hasanah Binti Nursyamsi: To update, PO requested for BA to have session with Lonpac to understand the urgency for this ticket. I will arrange for this session before drafting the changes needed in SRD. Let you guys know back once everything confirmed
[2026-08-20 12:28] Batrisyia Hasanah Binti Nursyamsi: Hi Everyone, to update, I will have session with Lonpac on next Wednesday, 3PM. Anything will update back here
[2026-08-27 15:48] Batrisyia Hasanah Binti Nursyamsi: Hi Everyone, as per the discussion with Lonpac just now, we will amend all Lonpac Insurance "Berhad" to Lonpac Insurance "Bhd". Also to change the SDPA's Policy Wording. This applies to eAuto as well ya Goh Kai Jiaeh has sent me the affected pages for eAuto and Secarang, may refer this one also while I'm working on the SRD Secarang - https://claude.ai/code/artifact/196ad2cb-f9f3-4909-8e0b-c7de413398e5 eAuto - https://claude.ai/code/artifact/9259d062-2a97-4673-aced-546ac1b3b6cd
[2026-09-02 17:28] Batrisyia Hasanah Binti Nursyamsi: Hi Everyone, uploaded SRD V0.1 in Jira ya, let me know if have any feedbacks [attachment/image]
[2026-09-04 15:46] Batrisyia Hasanah Binti Nursyamsi: Hi Everyone, uploaded V0.2 ya, just to update the changes in Secarang has been pushed to Production [attachment/image]
[2026-09-07 10:52] Batrisyia Hasanah Binti Nursyamsi: Hi Everyone, I've uploaded SRD V1.0 in Jira ya [attachment/image]
[2026-09-07 11:26] Batrisyia Hasanah Binti Nursyamsi: To update Shamini has given greenlight to proceed with this ticket ya
[2026-09-07 12:13] Tan Yi Fung: Goh Kai Jiaeh, you on this ticket d?
[2026-09-07 12:14] Goh Kai Jiaeh: Only for secarang frontend part last time.
[2026-09-11 10:52] Mei Jia Chee: hiiii, may i know when is the eta ready for testing on this ticket?
[2026-09-14 11:34] Goh Kai Jiaeh: Sorry for late. Shane will take a look this ticket. He will study first and come back again on this.
[2026-09-23 15:24] Mei Jia Chee: hiii Everyone, just to share that SRD v1.1 is available ya [attachment/image]
[2026-09-23 15:58] Mei Jia Chee: just to share that requestor given green light for this ya
[2026-09-28 08:49] Charmain Ea Chiang: Hi morning all, Kasheng Liew, just want to follow up if there is any update on the ETA for testing for this ticket ya?
[2026-09-28 10:26] Kasheng Liew: good morning, dev is completed ya, ready for testing
[2026-09-28 11:03] Charmain Ea Chiang: Hi Shane, can deploy the changes to staging/uat4 ya, we are targeting 2 October deployment window
[2026-09-28 17:19] Kasheng Liew: hi, changes deployed to uat4 ## not changed REQ-006 to REQ-011 already render "Lonpac Insurance Bhd" today, verification only, no code touched. serba-sentral-api is not touched. its `InsurancePlanCode.Lonpac` value `LonpacInsuranceBerhad` is the integration token sent to Lonpac's API, not a display name. leave it alone. ## how to test on uat4 1. UCD > Insurance > Enquiry. Insurance Company dropdown should read "Lonpac Insurance Bhd". 2. filter by Lonpac, results table insurer column should read "Lonpac Insurance Bhd" on every row. 3. payment report and SST report rows should also read Bhd. ## note for BA there is no cut-off date on this, unlike the 2025 logo change. the name is not stored per transaction, it is looked up at display time. so after this merges, reprinting a 2024 policy will show "Bhd" even though it showed "Berhad" when it was issued. flagging it, nobody asked either way.
[2026-09-28 17:24] Charmain Ea Chiang: okie noted ya
[2026-10-01 11:36] Charmain Ea Chiang: Hi Everyone, just a quick update, QA has completed testing for EAINT-12175 on staging/uat4 (eAuto) with no outstanding issues. It's ready for morning deployment on 2 Oct (Friday). Thanks to everyone involved!
[2026-10-02 08:36] Goh Kai Jiaeh: hi all, fyi deployment is done.
[2026-10-02 08:42] Siti Nur Azila Binti Mohamed: ok QA will start regress prod now
[2026-10-02 12:15] Siti Nur Azila Binti Mohamed: Quick update, QA already done regression testing on prod for this ticket and no issue found ya, thanks!
[system] Batrisyia (Unknown User) added Nur Izni Binti Zurni and 10 others to the chat.
[system] Goh Kai Jiaeh added Mong Guo Hao to the chat; Tan Yi Fung added Kasheng Liew to the chat (shared all chat history).
