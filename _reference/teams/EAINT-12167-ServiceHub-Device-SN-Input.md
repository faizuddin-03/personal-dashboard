<!-- Source: Teams group chat "EAINT-12167 [eAuto-BackOffice] Service Hub - Allow Ops to Input Device SN on Device Purchase SR Info Page When Updating Delivery Status to Arranged".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2026-08-11). Reactions dropped. -->
# EAINT-12167 Service Hub Device SN input

[2026-08-11 18:09] Yi Link Lim: Hi Everyone here is the cr group for this ticket EAINT-12167 [eAuto-BackOffice] Service Hub: Allow Ops to Input Device SN on Device Purchase SR Info Page When Updating Delivery Status to Arranged
[2026-08-11 19:44] Yi Link Lim: hi all, to inform that I have uploaded SRD v0.1 and v1.0 to JIRA. I would like to have a briefing session on this ticket by next Monday 11AM ya. Do lemme know if there is any concern. [attachment/image]
[2026-08-12 08:23] Tan Yi Fung: Wong Zhan Choon, please help on this, thanks
[2026-08-12 12:16] Wong Zhan Choon: Hi Everyone, Regarding ticket EAINT-12167 (Device Serial No.), there are a few pending items I need answers on before start development: 1. The "Number of Device" dropdown — do we still need Ops to pick it? Example: company buys 3 devices, the listing already shows 3 lines today. If Ops picks 2, we don't know which is correct. Suggest the system auto-fills it from the order instead as now the listing displays based on quantity (E.g. 3 device units will have 3 listing, each showing 1 quantity). 2. What if the order is more than 10 units? Example: company buys 12 devices, but the dropdown stops at 10 — no place to key in device 11 and 12. Either the SN boxes follow the order qty, or we cap the purchase at 10. 3. A wrongly keyed SN cannot be corrected. Example: real SN is AB12345679 but Ops types AB12345678 and saves. Once the status becomes Arranged the field is locked, and later the real AB12345678 device will be rejected as duplicate. Fix by IT support request, or allow a senior Hub Admin to edit it? The rest of the SRD is fine, we will build as written. Yi Link Lim appreciate your confirmation, especially on item 1 as that one blocks the start.
[2026-08-14 10:08] Yi Link Lim: Lemme get back to you on this. Need discussion with Ops first. Fyi, one orders can have more than 10 units, but each parcel they only allowed to deliver up to 10 devices, that's why max limit is 10 ya
[2026-08-17 10:47] Yi Link Lim: Hi Wong Zhan Choon here are the feedback after discussion with Ops: 1. (Number of Device dropdown) -> We can proceed to allow system auto fills it from order. If it auto fill, the 3 records in listing will have same info for the device number and serial number (SN) right? 2. (order more than 10 units) -> As discussed, the max limit will increase to 40 ya. The SN field will follow order qty 3. (wrongly keyed SN) -> Fix by IT support request. Confirmed with Ops that no one can edit the keyed SN
[2026-08-17 11:02] Yi Link Lim: hi all, will start meeting here ya
[2026-08-17 18:58] Yi Link Lim: Hi Everyone just to inform that uploaded SRD v1.1 yaa [attachment/image]
[2026-08-17 19:22] Yi Link Lim: Sorry all, uploaded v1.2 - missed out to mention a behaviour in SRD [attachment/image]
[2026-08-18 17:17] Yi Link Lim: Wong Zhan Choon Can help to confirm ETA when this ticket can be ready for testing including code review ya?
[2026-08-18 17:17] Wong Zhan Choon: ready for testing, will review tomorrow
[2026-08-18 17:17] Yi Link Lim: have you done code review?
[2026-08-19 09:43] Yi Link Lim: hii Wong Zhan Choon can help to confirm on when can done code review?
[2026-08-19 09:45] Wong Zhan Choon: after lunch can done code review
[2026-08-20 11:27] Yi Link Lim: Wong Zhan Choon Just to confirm, is this ticket has done its code review and ready for testing?
[2026-08-20 11:30] Wong Zhan Choon: ready for testing
[2026-08-21 09:13] Yi Link Lim: Wong Zhan Choon I have asked help from Kin Hang on the design. You could update your design based on figma here: https://www.figma.com/design/zDOwcO12fHv6vLhyzsC2gK/eAuto---Backoffice?node-id=3562-10973 (truncated in Teams)
[2026-09-21 15:52] Muhammad Faizuddin Bin Bidi: Hi Everyone. We tentatively plan to use /uat1 for the staging environment ya. Thank you
[2026-09-24 10:28] Yi Link Lim: hi all, Just to check, has QA side start testing on this ticket? If yes, can help to update the ticket status?
[2026-09-25 08:38] Charmain Ea Chiang: Hi morning Muhammad Faizuddin Bin Bidi, can help to update on this?
[2026-09-25 09:09] Yi Link Lim: Can QA side help to confirm whether happy flow for this ticket is ready for walkthrough? SA side need to have a walkthrough session with Ops latest by today ya
[2026-09-25 10:34] Muhammad Faizuddin Bin Bidi: Hi, sorry for the late reply. Ya, the happy flow is ready for walkthrough
[2026-09-25 11:26] Yi Link Lim: Hii devs and QAs, to feedback that this device serial no in details page should display all serial number under this SR. If SR consists of 21 devices purchase, then here shud display 21 devices in numbering list ya. [attachment/image]
[2026-09-25 12:40] Yi Link Lim: Wong Zhan Choon As spoken, need ur help to improve this field and display of device serial no. a. device serial no in popup remove placeholder text "type serial number" separate into two columns: left & right / left list 1 to 20 right list 21 to 40 b. device serial no in details page display same format as popup - separate into two columns: left & right left list 1 to 20 right list 21 to 40 Muhammad Faizuddin Bin Bidi Kindly take note on this updates ya. Just ensure updates above ready in staging before deployment will do ya [attachment/image]
[2026-09-25 17:51] Muhammad Faizuddin Bin Bidi: Hi Everyone, just a quick update, QA has completed testing for EAINT-12167 on staging/uat1 (eAuto) with no outstanding issues. It's ready for morning deployment on 28 Sep (Monday). Thanks to everyone involved!
[system] Tan Yi Fung added Wong Zhan Choon to the chat and shared all chat history.
[system] Yi Link Lim added Nur Izni Binti Zurni and 10 others to the chat.
