<!-- Source: Teams group chat "EAINT-9306 EAUTO | To Set eDereg Pre-Check Transaction as a Compulsory Step in the eDereg Transaction Creation Flow".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2025-11-27). Reactions and acknowledgements dropped.
     "Unknown User" = Batrisyia Hasanah Binti Nursyamsi (BA). -->
# EAINT-9306 eDereg Pre-Check compulsory

[2025-11-27 15:45] Nur Izni Binti Zurni: Hi, we'll use this group for discussion pertaining to this CR ya - EAUTO | To Set eDereg Pre-Check Transaction as a Compulsory Step in the eDereg Transaction Creation Flow https://mfservices.atlassian.net/browse/EAINT-9306
[2025-12-15 16:54] Kin Hang Aw: Hi Batrisyia & everyone, here is the first draft for eDEREG pre-checking in eDereg transaction creation flow https://www.figma.com/design/l3HOoBRG97sO3Nkjo9dx2l/eAuto-AATF?node-id=2323-16052 Let me know if you have any question. Thanks
[2025-12-29 12:12] Batrisyia Hasanah Binti Nursyamsi: Hi Everyone, I would like to have a briefing session for this ticket around 330PM here ya, let me know if have any concerns.
[2025-12-29 16:08] Batrisyia Hasanah: Everyone, I've uploaded SRD V0.1 in Jira along with the Figma link. Let me know if have any feedbacks.
[2026-01-02 16:15] Batrisyia Hasanah: Everyone, I've uploaded SRD V0.2 and V1.0 in Jira ticket ya.
[2026-01-02 16:47] Tan Yi Fung: Goh Kai Jiaeh, can assign the PIC developer for this?
[2026-01-02 16:48] Goh Kai Jiaeh: Ya added Tracey and me.
[2026-01-02 17:03] Batrisyia Hasanah: Everyone, as discussed with Tracey, we proceed with ya. eDereg Pre-Checking: Done Pre-Checking & Approved: Payment = OK, JPJ Pre-Checking = OK, Trx Status = OK. Done Pre-Checking & Failed: Payment = OK, JPJ Pre-Checking = Failed, Trx Status = Failed. Not Done Pre-Checking: No Info for that vehicle num. cc: Goh Kai Jiaeh
[2026-01-05 11:22] Batrisyia Hasanah: Everyone, to update we've received the green light from the Ops team for this ticket ya
[2026-06-09 10:08] Tan Yi Fung: Goh Kai Jiaeh, what is the status of this ticket?
[2026-06-09 10:11] Goh Kai Jiaeh: This one last time Tracey done deveploment dy but after that on hold if not mistaken.
[2026-08-18 11:45] Mei Jia Chee: hii everyone Jin Siang Boo, as discussed that need ur help to arrange to check on this ticket and update again when ready for testing ya
[2026-08-18 11:46] Jin Siang Boo: Hi Lim Xiwei, could check on the readiness of the development and update here again ya. Thanks
[2026-08-18 12:16] Mei Jia Chee: also, can help to advise this CR required to deploy during night or can morning session ya?
[2026-08-18 12:59] Lim Xiwei: hi, EAINT-9306 should be done dev, and I think KJ helped review last time so its ready for testing
[2026-08-20 15:51] Lim Xiwei: hi, can proceed morning session
[2026-08-20 18:29] Muhammad Faizuddin Bin Bidi: Hi Everyone. Here to notify that for this ticket, we tentatively plan to use /uat1 ya. Thank you
[2026-08-21 08:35] Mei Jia Chee: hiii morning Everyone, this ticket tentatively we target to deploy on 10.09 (thurs) morning ya
[2026-08-21 10:36] Lim Xiwei: hi all, do let me know when I can proceed with staging deployment thanks
[2026-08-21 11:40] Muhammad Faizuddin Bin Bidi: Hi, i believe can proceed with staging deployment ya
[2026-08-21 12:31] Lim Xiwei: hi all, EAINT-9306 is ready in staging/uat1 ya thanks and here's the QA testing guide artifact: https://claude.ai/code/artifact/a0a4e364-6618-45ef-90d9-9d616e (truncated in Teams)
[2026-09-01 09:36] Batrisyia Hasanah: Hi Everyone, received question from Dev which is On Step 2, AATF user enter vehicle number and proceed with eDereg Pre-Checking, the eDereg Pre-Checking Payment = Successful but JPJ Enquiry = Failed. Then what is the expectation? Expectation from Ops: On Step 2, AATF user enter vehicle number and proceed with eDereg Pre-Checking, the eDereg Pre-Checking Payment = Successful but JPJ Enquiry = Failed. Once user close the popup, and try to proceed with the same VN again, to show the popup again (May refer the video by Tracey), and remarks under Vehicle Number field will be "Your eDereg Pre-Checking is unsuccessful. Kindly contact our Customer Service at 03-27798899". Will update the SRD accordingly ya [video: Online Services - DEREGISTRATION SERVICE - Google Chrome 2026-08-31 21-50-32.mp4]
[2026-09-01 10:31] Muhammad Faizuddin Bin Bidi: Hi Batrisyia Hasanah Binti Nursyamsi, for this one when user retry with the same VN, does it call the previous pre-check transaction, or will it create a new transaction ya
[2026-09-01 10:39] Batrisyia Hasanah: Hi, if this case for JPJ Enquiry = Failed, should call the previous eDereg Pre-Checking transaction that hit this error
[2026-09-01 12:54] Batrisyia Hasanah: Hi all, uploaded SRD V1.1 ya
[2026-09-04 17:19] Muhammad Faizuddin Bin Bidi: Hi Everyone. Here to inform that QA has finished testing with no pending issues ya. Thank you
[2026-09-08 17:08] Batrisyia Hasanah: Hi Everyone, update on walkthrough just now. I've reached out to all of you personally for this one on Ops feedbacks which is AATF Portal and BO Portal / Deregistration Transaction Listing > Details Page / 1. Download Invoice > Download both Invoice PDF (Dereg and eDereg Pre-Checking) / 2. Download e-Invoice > Download both e-Invoice PDF (Dereg and eDereg Pre-Checking) / 3. Add JPJ Official Receipt button under Uploaded Consent > Download JPJ Official Receipt for eDereg Pre-Checking. Conclusion: I've liaised with Ops back on this after discussing with the team, Ops agree to proceed with whatever we have concluded. No changes needed. They will create new CR for the recent feedback. Thanks ya
[2026-09-09 15:01] Mei Jia Chee: hiii Everyone, Izni helped to liaised with Nik from ops whether they wan to proceed with Method 1: Deploy whatever we developed + hard code the email to AATF tmr as planned on Next Tuesday morning - to include the prechecking perakuan in Step 2. Method 2: not going to deploy tmr; include the prechecking perakuan in Step 2 and deploy next Tuesday morning. by 3.30pm Nik will update again. then i will share again on which method we going to proceed ya cc Nur Izni Binti Zurni
[2026-09-09 16:00] Mei Jia Chee: to update that we wont proceed deployment tmr morning for this ticket. Jin Siang Boo, pls help to take out this ticket from tmr deployment. QAs side will need to proceed regression
[2026-09-09 16:01] Jin Siang Boo: ok sure, I think KJ is helping on this ya, can wait for his signal thanks
[2026-09-09 16:01] Mei Jia Chee: tentatively target to deploy next Tuesday morning - if we sempat we can include in next Monday night deployment. Perakuan expectation: at step 2 dereg - popup on the payment summary for pre-checking. to include the perakuan on top of the payment summary; no need to have the checkbox, expected is user clicks on "Next" mean agree with the perakuan. give me some time to come out with the UI yaaa, will share later
[2026-09-09 16:02] Jin Siang Boo: the email also not editable right?
[2026-09-09 18:22] Batrisyia Hasanah: Hi Everyone, here's the expectation for the updated UI, can follow this one ya. Later will update SRD [file: eDereg_Pre_Checking_HTML_Mockup.html]
[2026-09-10 09:55] Mei Jia Chee: Jin Siang Boo, editable like how they purchase for the standalone pre checking
[2026-09-10 14:14] Mei Jia Chee: hiii Everyone, as liaised with Lim Xiwei just now that the perakuan we just wan to apply to those first time purchase ya. no need to apply to those resubmit & RE case.
[2026-09-10 15:13] Lim Xiwei: hi all, the changes are ready, may I know which staging env to deploy to?
[2026-09-10 15:21] Muhammad Faizuddin Bin Bidi: Hi for this one, can proceed with /uat1
[2026-09-10 15:28] Lim Xiwei: done thanks, the changes are ready in staging/uat1 ya and here's the artifact of what's affected: https://claude.ai/code/artifact/6ae8ef6f-8210-4270-b6da-9c1e95889010
[2026-09-10 17:07] Mei Jia Chee: hiii Everyone, just to share that i done SRD v1.2 ya. / if required any briefing can let me know ya, will try to arrange
[2026-09-11 11:04] Mei Jia Chee: Batrisyia Hasanah Binti Nursyamsi, for the perakuan changes that i helped to include in the SRD v1.2, pls help to follow up with team members and arrange the walkthrough session with ops team ya
[2026-09-11 12:00] Mei Jia Chee: just fyi that requestor given green light for srd v1.2 ya
[2026-09-14 18:20] Muhammad Faizuddin Bin Bidi: Hi Everyone, just a quick update, QA has completed testing for EAINT-9306 on staging/uat1 (eAuto) with no outstanding issues. It's ready for morning deployment on 15 Sep (Tuesday). Thanks to everyone involved!
[2026-09-15 08:38] Goh Kai Jiaeh: hi all, fyi deployment is done.
[2026-09-15 09:08] Muhammad Faizuddin Bin Bidi: Hi all. QA has done regression ya. As of 9.00 AM; Pre-checking popup shows in deregistration step 2; 1 approved precheck transaction; No deregistration transactions yet
[system] Nur Izni Binti Zurni added Mei Jia Chee and 10 others to the chat. Batrisyia added Muhammad Faizuddin Bin Bidi and Kin Hang Aw. Mei Jia Chee added Jin Siang Boo. Goh Kai Jiaeh added Lim Xiwei.
