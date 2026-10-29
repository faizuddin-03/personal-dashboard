<!-- Source: Teams group chat "EAINT-12019 [eAuto-UCD] eMOVE – Standalone Logistics Service".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2026-08-26). Reactions dropped; share keys redacted.
     "Unknown User" in quotes = Nur Izfarwiza Binti Mohd Talib (dev, later left). -->
# EAINT-12019 eMOVE Standalone Logistics

[2026-08-26 12:19] Mei Jia Chee: hii everyone, can use this CR group for ticket https://mfservices.atlassian.net/browse/EAINT-12019
[2026-08-26 12:28] Tan Yi Fung: Izfa, please help and remember to report progress daily ya
[2026-08-26 16:42] Nur Izfarwiza Binti Mohd Talib: Hi Mei Jia Chee, the driver app for this ticket is similar to the wholesale scanner right specifically for ticket EAINT-11731?
[2026-08-26 17:34] Nur Izfarwiza Binti Mohd Talib: Spent today studying the SRD and requirements, tracing the workflow/context across the affected repos, and identifying reusable patterns from prior tickets. Currently preparing the implementation plan and architecture proposal ahead of the BA briefing and technical walkthrough with senior. It's a large, multi-repo ticket (58 requirements across 4 flows), so today's time went into study + planning before any build work starts.
[2026-08-27 12:21] Nur Izfarwiza Binti Mohd Talib: Hi Mei Jia Chee, can I ask will there be a briefing session for this ticket cause I already studied the srd and have some open questions.
[2026-08-27 12:38] Mei Jia Chee: yes Nur Izfarwiza Binti Mohd Talib, similar but whether can reuse or not, u can advise later
[2026-08-27 12:38] Mei Jia Chee: the srd just a draft, still gt a lot of thing haven't confirm. dont think is time to give u the briefing
[2026-08-28 10:27] Nur Izfarwiza Binti Mohd Talib: Hi Mei Jia Chee, I have a few questions: 1. Clarify: This ticket is similar to wholesale but isn't related right? 2. REQ-018-022's acceptance criteria only cover distance tier + door surcharge + eAuto Fee + SST — will vehicle type also affect the charges? (The background section mentions vehicle type as a pricing factor, but it's not in the formal criteria.) 3. Since auto-routing is out of scope, distance will be a lookup table (state-to-state and/or hub-to-hub) rather than calculated live — confirming that's the approach. And is this table a fixed constant, or editable later like the Charges Matrix? 4. Confirming the 3 BackOffice pages are: eMOVE Transaction Listing, Transaction Details, and Logistics Charges Matrix Setup — is that the complete list?
[2026-08-28 12:25] Mei Jia Chee: Nur Izfarwiza Binti Mohd Talib, item 1 - there is nothing related to the wholesale flow, this is the logistics standalone module. which eAuto already subscribe the logistic service, other than just provide the service to wholesale customer, actually they can expand the service to more customer on using logistics service. on item 2 - 4: i dont think is the suitable time to answer u anything, as the requirement still not yet firm at this point
[2026-09-04 16:27] Mei Jia Chee: Everyone, just to update that i had uploaded srd v0.2 and the latest mock up. as of now this is not the latest version just yet yaaa
[2026-09-10 14:49] Nur Izfarwiza Binti Mohd Talib: Hi Mei Jia Chee, I have some enquiries to clarify regarding this ticket: 1. Will you be providing the hub master list, or will it be the same as wholesale? / 2. For the driver app QR (both pickup and delivery) — should it be a general QR code, or one per transaction? / 3. Do you have a list of vehicle types for the dropdown, or is this still unconfirmed as of now? / 4. For the driver app — do you want the photos to be able to be displayed/previewed?
[2026-09-14 16:51] Mei Jia Chee: Everyone, uploaded srd v0.3 and htmls ya. may take a look / Nur Izfarwiza Binti Mohd Talib, u may take a look on the latest docs i uploaded to jira first see if those update can solve ur question
[2026-09-15 10:34] Nur Izfarwiza Binti Mohd Talib: Hi Mei Jia Chee, I have some questions regarding the updated srd REQ-060 / REQ-064 mentiones driver scanning a qr, but there is no mention where this qr is generated or what it encodes, is it per transaction? or general? or does it contains the vehicle information like vehicle reg no. Also in the mock there is a delivery order, will you share what will be on it.
[2026-09-15 14:21] Mei Jia Chee: hii Nur Izfarwiza Binti Mohd Talib, for these 2 questions i believe u can go and study abit for wholesale logistics flow, the QR and Delivery Order use the existing flow and template / there are no changes on QR and delivery order in this ticket
[2026-09-17 10:40] Nur Izfarwiza Binti Mohd Talib: Will the delivery order be exactly the same as wholesale? or should it be a standalone?
[2026-09-17 10:43] Nur Izfarwiza Binti Mohd Talib: The wholesale driver scans the qr first then only insert the vehicle, but this ticket REQ-060, the driver app scans the QR or enters the vehicle registration number. So to confirm should it be: 1. Same as Wholesale — QR scan is mandatory first step (determines pickup vs drop-off), vehicle reg no is only entered afterward to identify the job / 2. Different from Wholesale, as literally written in REQ-060 — QR scan and manual reg-no entry are two independent alternate paths ...
[2026-09-17 17:06] Mei Jia Chee: Everyone, just to share that uploaded SRD v0.4 and htmls ya. please take note that is not the latest version as of now, once finalize will have briefing session
[2026-10-11 21:38] Mei Jia Chee: hiii Everyone, just to share that SRD v0.5 and mockups are ready ya.
[2026-10-11 21:39] Mei Jia Chee: Tan Yi Fung Goh Kai Jiaeh, can help to advise which dev will take over this ticket ya? i do have some items would like to get advise
[2026-10-11 21:47] Jin Siang Boo: if not mistaken, Wei Ting Lim will help on this ticket
[2026-10-12 08:51] Mei Jia Chee: Wei Ting Lim, maybe tmr we can have a syncup session for this ticket yaaaa.   Wei Ting Lim: ok can
[2026-10-14 10:19] Wei Ting Lim: https://claude.ai/artifact/QDkNTKNgLFLuvTNoAnMPdS?sk=[redacted] Tan Yi Fung for emove photo i store in s3 ya
[2026-10-14 16:10] Wei Ting Lim: btw, who is going to test this ticket, later maybe will release full scope what to test, but just inform first for wholesale part will need to regress, maybe on DO generation + qr scanning, since we will share those between emove and wholesale logistic
[2026-10-14 18:27] Mei Jia Chee: also to update that emove payment will go to eAuto Sdn Bhd ya. / for wholesale part will go to eAuto Digits which is related to the ticket EAINT-11884 - now working in progress by YiFung
[system] Tan Yi Fung added Nur Izfarwiza; Jin Siang Boo added Wei Ting Lim (shared past 46 days); Mei Jia Chee added Nur Izni Binti Zurni and 10 others.

## Update 2026-10-16 → 2026-10-26 (captured 2026-10-26)

<!-- Read-only capture via Teams web DOM, 2026-10-26. Times MYT. Messages from 2026-10-16 00:00 to capture time, oldest first.
     Line breaks inside a message shown as " / ". Quoted replies appear inline at the start of a message ("<name> / <date> / <quoted text> / reply"). Images shown as [image]; reactions dropped. -->

**Mei Jia Chee** — 2026-10-20 08:09: Everyone, just to update that srd v0.7 is available yaa. [image]

**Mei Jia Chee** — 2026-10-21 10:54: Everyone, just to update that srd v0.8 is available ya [image]

**Mei Jia Chee** — 2026-10-21 10:54: Wei Ting Lim Tan Yi Fung, will have discussion with Nurul on this coming Friday 11am at Meeting Room 1 ya
