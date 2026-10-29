<!-- Source: Teams group chat "EAINT-12348 [eAuto-AATF & BackOffice] eDereg - Enable PBT Organisations as Active eDereg Users".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2026-09-28). Reactions dropped. -->
# EAINT-12348 PBT as eDereg users

[2026-09-28 09:03] Mei Jia Chee: hii everyone, we will use this CR group for https://mfservices.atlassian.net/browse/EAINT-12348
[2026-09-28 09:04] Mei Jia Chee: just to share that srd v0.1 & v0.2 are ready in the jira ticket ya. but not the latest version as of now
[2026-09-28 09:06] Mei Jia Chee: i need advise from dev, maybe Goh Kai Jiaeh Jin Siang Boo can help yaaa. i wan to understand that if we wan to enhance to allow PBT user to perform as dereg user - this is a big effort changes ya? also ops team wan to update the uiux for aatf portal too. i need suggestion whether we can sekali gus to proceed?
[2026-09-28 09:11] Jin Siang Boo: I think quite big effort on the development as it affected all pages in AATF, big effort here refer to the effort of identify the impact of this changes in each AATF Pages and its implementation ya
[2026-09-28 09:32] Mei Jia Chee: okkkies, noted ya Jin Siang Boo, can help to advise also if we exclude uiux how long needed ya?
[2026-09-28 10:20] Jin Siang Boo: could be around 5 to 6 days ya
[2026-09-28 10:22] Jin Siang Boo: uiux means new UI?   Mei Jia Chee: yesss, new ui for aatf portal
[2026-09-28 14:52] Mei Jia Chee: Jin Siang Boo, just to check that who will in charge this ticket from dev side ya? i believe that we might need to work on this ticket first before the SRD conclude siap siap / as ops team there will need to arrange to give training to PBT probably in October or November 2026
[2026-09-28 15:22] Jin Siang Boo: Sia Zhong Tai please help on this ticket
[2026-10-07 14:32] Mei Jia Chee: Sia Zhong Tai, need ur help to advise for these items ya 1. eDereg Pre-Checking: wan to have another set of trx number for PBT. Existing is PC69001611 (PC + Y+M+ 6 digits running number). Can help to check if we can have PBTPC69000001 (PBTPC + Y+M+ 6 digits running number) ya? need to check check when pass to RHB / JPJ there that part enough char or not. 2. For the JPJ Submission there we will need to submit AATF BRN, for PBT dont have BRN. Suggestion - to send with PBT Shortform but gt duplicated. Hence, wan to send something like MDK - we send MDKerian and MDKeningau. possible ya? [attachment/image]
[2026-10-07 15:22] Mei Jia Chee: Everyone, just to share that SRD v0.3 and mockups are ready in the jira ticket.
[2026-10-07 15:23] Mei Jia Chee: Everyone, maybe we can have a briefing session tmr at 11.30am before i compile as SRD v1.0 and send out for external review ya.
[2026-10-07 15:46] Jin Siang Boo: 2) The JPJ Submission here refer to eDereg Pre-checking? I dont think Dereg Submission have send AATF BRN. I think we need connect to JPJ only could know it is working or not? However, for technical side it is possible ya, could reuse same field in the edit company account page [attachment/image]
[2026-10-08 12:00] Mei Jia Chee: Everyone, will start the call now ya (briefing moved 11.30am -> 12pm)
[2026-10-08 15:18] Mei Jia Chee: hiii Jin Siang Boo Sia Zhong Tai, can help to advise that existing Payment ID for AATF version ya? correct me if i am wrong yaaaa. Dereg Transaction Payment Information for AATF version / TransType = DRG Ref 1 = DRG260914000020-HXA224 Ref 2 = null. eDereg Pre-Checking Transaction Payment Information for AATF version / TransType = DPC Ref 1 = DPC260924000005 Ref 2 = DPC260924000005-VA12
[2026-10-08 16:36] Mei Jia Chee: hiii Everyone, just to share that SRD v0.4, invoice & einvoice samples & mockups are ready yaaa. for those pending items - i am arranging a session with requestor
[2026-10-08 16:37] Mei Jia Chee: btw Jin Siang Boo Sia Zhong Tai, just to share that confirmed PBT will have TIN. hence, will have e-invoice
[2026-10-08 16:37] Jin Siang Boo: how we gonna to validate tin ya?
[2026-10-08 17:05] Mei Jia Chee: same as whatever how we validate in prod now for others AATF & UCD
[2026-10-09 11:50] Jin Siang Boo: will use BRN or will bypass tin validation ya?
[2026-10-10 21:15] Mei Jia Chee: what u mean bypass tin validation ya? AATF now using bypass ke?
[2026-10-10 21:16] Mei Jia Chee: item 1: btw Jin Siang Boo Sia Zhong Tai need advise on this ya. item 2: also Jin Siang Boo can help to check in prod now gt which PBT records existed ya? item 3: need advise if let say Step 5 need to show the payment summary breakdown - the changes will apply to both AATF and PBT or just PBT affected ya? item 4: RHB there can accept 30 char for Payment ID part?
[2026-10-10 22:17] Mei Jia Chee: just to share that SRD v0.5 and mockups are available ya.
[2026-10-12 09:27] Sia Zhong Tai: Dereg Transaction Payment Information for AATF version TransType = DRG Ref 1 = DRG260914000020-HXA224 Ref 2 = DRG. eDereg Pre-Checking Transaction Payment Information for AATF version TransType = DPC Ref 1 = DPC260924000005-VA12 Ref 2 = DPC260924000005. i think its like this oh
[2026-10-12 09:42] Sia Zhong Tai: the validation is using BRN + TIN pair. AATF no need bypass because it do have brn, but PBT memang no BRN right?
[2026-10-12 10:04] Sia Zhong Tai: (item 3) for this, depend on the requirement, pbt and aatf are sharing the same page actually, so technically can do either both also see or i add a condition to hide it for aatf.
[2026-10-12 10:11] Sia Zhong Tai: (item 4) this one i not rly sure, cuz its depending on RHB interface spec. do we have any api integration spec doc or something like that from RHB?
[2026-10-12 10:56] Mei Jia Chee: i believe that is fine we can remain how we sent it to AATF ya. based on the explanation from PBT they mentioned that LHDN did shared them a registration Number in order for them to have TIN ya. should not be an issue now
[2026-10-12 10:56] Mei Jia Chee: okkies, if that the case i will check with requestor on his expectation ya
[2026-10-12 17:09] Mei Jia Chee: Everyone, just to share srd v0.6 is available on jira ticket ya.
[2026-10-12 17:44] Goh Kai Jiaeh: Ya 30 chars but this doc is quite old one. [file: eAuto x RHB technical requirement for insurance payment service v1.0 03122020 1.pdf]
[2026-10-14 14:42] Mei Jia Chee: hiii Sia Zhong Tai, need ur help to check check these items ya Item 1 - Dereg Submission a. the AATF email existing system is referring to BackOffice > Company Details page > Company Email field? Item 2 - eDereg Pre-Checking Submission a. just check if requestor request to have new format for Receipt No., is this possible?
[2026-10-14 15:43] Sia Zhong Tai: 1. yepp, BackOffice > Manage AATF/PBT Account 2. its for all edereg prechecking transactions right? not just pbt right? possible to have new format for receipt no. but depends on the new format, it cannot start the same way as the old one (YYMMDD0807...)
[2026-10-14 17:26] Mei Jia Chee: noted ya yea yea, apply to PBT.
[2026-10-14 17:30] Mei Jia Chee: Sia Zhong Tai, updated srd v0.7, u can take a look first but still not yet finalize as of now ya, still have few items pending requestor there for confirmation
[2026-10-15 14:40] Mei Jia Chee: Sia Zhong Tai, can help to check existing the number for 0807 - what is the latest running number using now ya? / wan to have the new running number for PBT version
[2026-10-15 14:40] Sia Zhong Tai: this one need Jin Siang Boo help oh, i no access to both prod & staging db
[2026-10-15 16:55] Mei Jia Chee: Sia Zhong Tai, SRD v0.8 is ready ya. still have some items pending requestor to update. mockup gt changes but haven't upload to jira
[2026-10-15 17:45] Mei Jia Chee: Sia Zhong Tai, there is a handling to allow user to search for 5 vehicle number only. can help to check this one only applicable to eDereg Pre Checking Standalone process or actually also apply to Dereg Step 2 ya?
[2026-10-15 21:28] Jin Siang Boo: I think should be Insurance cancellation "0809"
[system] Jin Siang Boo added Sia Zhong Tai; Mei Jia Chee added Nur Izni Binti Zurni and 9 others.

## Update 2026-10-16 → 2026-10-26 (captured 2026-10-26)

<!-- Read-only capture via Teams web DOM, 2026-10-26. Times MYT. Messages from 2026-10-16 00:00 to capture time, oldest first.
     Line breaks inside a message shown as " / ". Quoted replies appear inline at the start of a message ("<name> / <date> / <quoted text> / reply"). Images shown as [image]; reactions dropped. -->

**Mei Jia Chee** — 2026-10-19 08:19: Jin Siang Boo / 15/10/2026 21:28 / I think should be Insurance cancellation "0809" / okkkies, if that the case i believe for the PBT version we will use "0810" ya. thanks Jin Siang Boo

**Mei Jia Chee** — 2026-10-19 08:35: Mei Jia Chee / 15/10/2026 17:45 / 📷 Sia Zhong Tai, there is a handling to allow user to search for 5 vehicle number only. can help to check this one only applicable to eDereg Pre Checking Standalone process or actually also apply… / Jin Siang Boo Sia Zhong Tai, i still need advise for this ya

**Mei Jia Chee** — 2026-10-19 09:45: Mei Jia Chee / 15/10/2026 17:45 / 📷 Sia Zhong Tai, there is a handling to allow user to search for 5 vehicle number only. can help to check this one only applicable to eDereg Pre Checking Standalone process or actually also apply… / Sia Zhong Tai, as liaised just now - this handling has been removed last year ya

**Mei Jia Chee** — 2026-10-19 10:48: Everyone, just to share that v0.9 & v1.0 are ready in the jira ticket ya. [image]

**Mei Jia Chee** — 2026-10-19 10:48: the flow is confirmed, now just pending the perakuan part from ops team

**Mei Jia Chee** — 2026-10-19 10:49: Sia Zhong Tai, need ur help to advise eta when ready for testing ya (exclude the perakuan part)

**Sia Zhong Tai** — 2026-10-19 11:06: Mei Jia Chee / 19/10/2026 10:48 / Everyone, just to share that v0.9 & v1.0 are ready in the jira ticket ya. 📷 / noted thanks

**Sia Zhong Tai** — 2026-10-19 11:07: Mei Jia Chee / 19/10/2026 10:49 / Sia Zhong Tai, need ur help to advise eta when ready for testing ya (exclude the perakuan part) / i think next Monday EOD including code review

**Mei Jia Chee** — 2026-10-20 17:01: Sia Zhong Tai, updated based on ur feedback ya. do let me know if SRD v1.1 is okay for me to proceed to send out for external review [image]

**Mei Jia Chee** — 2026-10-21 10:33: Sia Zhong Tai, updated based on ur feedback ya. do let me know if SRD v1.1 is okay for me to proceed to send out for external review [image]

**Mei Jia Chee** — 2026-10-22 14:18: Sia Zhong Tai, uploaded new version for SRD v1.1 ya. let me know by tmr 10am if there is any feedback ya else i will send our SRD tmr for requestor to review after that [image]

**Mei Jia Chee** — 2026-10-23 15:26: Everyone, just to share that sent out srd v1.1 for requestor to review ya [image]

**Mei Jia Chee** — 2026-10-26 15:04: Sia Zhong Tai, just to check when this ticket ready for testing ya?

**Sia Zhong Tai** — 2026-10-26 15:05: Mei Jia Chee / 26/10/2026 15:04 / Sia Zhong Tai, just to check when this ticket ready for testing ya? / Hihi, should be this thurs ya
