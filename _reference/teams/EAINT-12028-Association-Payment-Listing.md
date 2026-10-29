<!-- Source: Teams group chat "EAINT-12028 [eAuto-BackOffice] New Module – Association Payment Listing (Automate Association/Vendor Payment Requests)".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2026-07-28). Reactions dropped.
     "Unknown User" in quotes = Nur Izfarwiza Binti Mohd Talib (account since removed). -->
# EAINT-12028 Association Payment Listing

[2026-07-28 08:58] Mei Jia Chee: hiii Everyone, will use this CR group for ticket: https://mfservices.atlassian.net/browse/EAINT-12028
[2026-07-28 08:59] Mei Jia Chee: Tan Yi Fung, can help to assign any dev to work on this ticket? i roughly get the requirement from ops ad. would like to get advise from dev first before proceed further
[2026-07-28 09:21] Tan Yi Fung: Nur Izfarwiza Binti Mohd Talib need your help on this ticket
[2026-07-28 10:02] Mei Jia Chee: okay, i would like to have a discussion session for this ticket at 12pm later ya. venue - Meeting Room 3
[2026-07-28 12:34] Mei Jia Chee: Goh Kai Jiaeh Nur Izfarwiza Binti Mohd Talib, as liaise just now i will update the SRD ya. as of now can refer to this version first [attachment/image]
[2026-07-30 11:20] Mei Jia Chee: Everyone, just to share that SRD v0.3 is available ya. [attachment/image]
[2026-07-30 11:21] Mei Jia Chee: i will send out srd v1.0 to requestor to review later ya
[2026-07-31 17:06] Mei Jia Chee: hiii Everyone, just to share that srd v1.1 is available ya. updated accordingly to ops team feedback [attachment/image]
[2026-08-04 09:20] Mei Jia Chee: hiii morning Everyone, i would like to have a briefing session based on SRD v1.1 later around 12pm ya. do let me know if anyone has concern or feedback
[2026-08-04 12:00] Mei Jia Chee: just fyi, Requestor given green light for srd v1.1 ya
[2026-08-04 12:00] Mei Jia Chee: i will start the call now, anyone who available can join
[2026-08-04 12:59] Nur Izfarwiza Binti Mohd Talib: Hi Mei Jia Chee For this rate, will it change in the future? [attachment/image]
[2026-08-04 14:12] Mei Jia Chee: yes, there is a possibility
[2026-08-04 15:51] Nur Izfarwiza Binti Mohd Talib: Hi Mei Jia Chee, based on REQ-003, a user may hold more than one role. But since there is a flow for drafter, reviewer and approver. Can the same person approve as different roles?
[2026-08-04 16:19] Mei Jia Chee: yes, there is a possibility on this ya
[2026-08-05 11:25] Nur Izfarwiza Binti Mohd Talib: Hi Mei Jia Chee, regarding REQ-018 and REQ-019 for the FMC/MMSDA PDF generation: Current Requirement: The SRD specifies fixed values for Pay-To details (e.g., Bank Account, Person in Charge) and Company contacts (Attn: Marie Ann). Are these expected to remain? Future Changes Scenario: If FMCCAM/MMSDA changes their bank account or if our internal contact (Marie Ann) changes in the future, should the PDF automatically reflect the latest updated details, or should older generated PDFs strictly lock in and retain the historical contact/bank details active during that specific record month?
[2026-08-05 14:26] Mei Jia Chee: as of now just make it as fixed info will do ya
[2026-08-06 09:20] Mei Jia Chee: hii Nur Izfarwiza Binti Mohd Talib, just to check that any eta this ticket done code review & ready for testing ya?
[2026-08-06 09:35] Nur Izfarwiza Binti Mohd Talib: Can I get to you by this evening for the eta, cause there is some refinement on the planning that I need to show my seniors
[2026-08-07 09:19] Nur Izfarwiza Binti Mohd Talib: Morning, I will say in about 2 weeks?
[2026-08-07 10:46] Tan Yi Fung: Nur Izfarwiza Binti Mohd Talib, can we discuss?
[2026-08-07 11:09] Nur Izfarwiza Binti Mohd Talib: Correction, it can be done by Thursday
[2026-08-07 13:03] Mei Jia Chee: just to double confirm which mean next Friday 14.08 ready for testing, right? and is including code review?
[2026-08-07 14:11] Nur Izfarwiza Binti Mohd Talib: Yes
[2026-08-17 09:25] Mei Jia Chee: morning everyone, Nur Izfarwiza Binti Mohd Talib may i know what is the progress for this ticket?
[2026-08-18 09:11] Jin Siang Boo: Izfarwiza on AL ya, will be back on Thursday. Does this ticket urgent? if no, think we could wait her back from AL ya
[2026-08-18 09:27] Yi Link Lim: This ticket is not urgent. Will liaise with her on Thursday
[2026-08-20 11:18] Mei Jia Chee: Nur Izfarwiza Binti Mohd Talib, can u update the status of this ticket?
[2026-08-20 11:39] Nur Izfarwiza Binti Mohd Talib: My part, I am testing it locally e2e, will discuss with Brandon for review
[2026-08-20 11:51] Mei Jia Chee: which mean next Monday ready for testing?   Nur Izfarwiza: Yes
[2026-08-20 12:21] Mei Jia Chee: ok, please update the status tmr once the ticket is ready for testing. / if u have any concern or issue, raise in the group and make sure everyone is aware
[2026-08-20 16:00] Nur Izfarwiza Binti Mohd Talib: Hi Mei Jia Chee, is it possible to get a pdf version of the payment requisition instead of excel?
[2026-08-20 17:00] Nur Izfarwiza Binti Mohd Talib: For format/layout confirmation
[2026-08-20 17:08] Mei Jia Chee: or maybe u can share whatever u have done? we can share the version to ops team and get them to confirm whether ok to proceed or not
[2026-08-20 17:10] Nur Izfarwiza Binti Mohd Talib: Can ignore the name as of now Payment Requisition_FMC_March 2026.pdf [attachment/image]
[2026-08-21 08:43] Mei Jia Chee: other than the name issue, can i consider this is the final version that u already done and ready for testing?   Nur Izfarwiza: Yes
[2026-08-21 09:19] Mei Jia Chee: Nur Izfarwiza Binti Mohd Talib, on the pdf sample. i believe that u could take excel and save it as PDF, it will be exact what ops team saved and submit to finance. u may try first, if u face any issue can drop msg and screenshot here
[2026-08-26 09:31] Nur Izfarwiza Binti Mohd Talib: Just to update, my side has done development, pending for review
[2026-08-26 11:35] Tan Yi Fung: Nur Izfarwiza Binti Mohd Talib, could you please check if this deployment need eauto downtime?
[2026-08-26 11:46] Nur Izfarwiza Binti Mohd Talib: There is a brief downtime from some changes in the login/logout updates in core. But most of the changes is in the new repo which doesn't effect core
[2026-08-26 12:12] Tan Yi Fung: Mei Jia Chee, then this one need downtime, sorry If really need prepare for urgent deployment, then can deploy and hide the link in backoffice first
[2026-08-28 14:31] Nur Izfarwiza Binti Mohd Talib: Development is done, is there a eauto staging branch can point to?
[2026-08-28 14:32] Nur Izfarwiza Binti Mohd Talib: When is the testing eta for this ticket?
[2026-08-28 14:36] Charmain Ea Chiang: Hi Nur Izfarwiza Binti Mohd Talib, please wait for QA's greenlight ya, dont deploy to any staging env first, thank you
[2026-09-03 08:34] Nur Izfarwiza Binti Mohd Talib: Hi Mei Jia Chee, while going through my implementation, there is a few things I have to clarify with you if is correct 1. Vehicle types — I'm counting both private and company vehicles for each group (cars = private + company car; motorcycles = private + company bike), matching the existing Transaction Summary Report. Flagging in case you intended private only. 2. I just realized that eSTM has a JPJ- cancellation flow — eSTM can cancel an already-JPJ-approved transaction (the approval date isn't cleared), so what I am doing is count only transactions that are still Approved and Paid. This excludes cancelled/unpaid ones. / 3. the per-state breakdown I've used the dealer's registered state, not the vehicle's number-plate state — same basis as the existing state report. Is that the intended definition?
[2026-09-04 10:32] Mei Jia Chee: Nur Izfarwiza Binti Mohd Talib Item #1 - yes, no need to separate whether is private or company, as long as is car then total up the amount will do, same goes to motorcycle Item #2 - i dont think that ops team got this SOP, can u check again? Item #3 - what u mean by vehicle's number-plate state? can explain abit?
[2026-09-04 10:45] Jin Siang Boo: Hi Mei Jia Chee, for item#3, do Ops will based on the State in the export file from the backoffice transaction listing? if yes, think we use UCD company state ya [attachment/image]
[2026-09-04 11:17] Mei Jia Chee: yes Jin Siang Boo, u are correct. they export file from backoffice trx listing ya
[2026-09-18 11:07] Mei Jia Chee: hiii Nur Izfarwiza Binti Mohd Talib Jin Siang Boo, can help to advise this ticket can proceed morning deployment?
[2026-09-18 11:31] Jin Siang Boo: I think should be ok
[2026-09-24 14:32] Jin Siang Boo: Hi Kasheng Liew please help on this ticket. thanks
[2026-09-29 16:04] Kasheng Liew: hi all, i just done local testing on the previous work, all ok except 1 bug.. once drafter click KIV.. nobody can approve that month anymore.. so the payment request can never be generated.. im fixing it now.. will update in the group again
[2026-10-14 12:03] Mei Jia Chee: hiiii Everyone, just to update that this ticket will rearrange ya. not going to deploy on end of this month anymore. will update again on the targeteddeployment date
[system] Jin Siang Boo added Kasheng Liew to the chat and shared all chat history.
[system] Tan Yi Fung added Unknown User to the chat and shared all chat history.
[system] Mei Jia Chee added Nur Izni Binti Zurni and 11 others to the chat.
