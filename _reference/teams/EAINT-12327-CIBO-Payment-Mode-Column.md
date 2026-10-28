<!-- Source: Teams group chat "EAINT-12327 [CIBO] To Enhance Payment Mode Column Format in Transaction Listing and Payment Report".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2026-09-17). Reactions dropped. -->
# EAINT-12327 CIBO Payment Mode column format

[2026-09-17 18:32] Yi Link Lim: hi Everyone here is the cr group for EAINT-12327 [CIBO] To Enhance Payment Mode Column Format in Transaction Listing and Payment Report
[2026-09-17 18:38] Yi Link Lim: just to inform that i have uploaded v0.1 & v1.0 to JIRA [attachment/image]
[2026-09-18 10:30] Yi Link Lim: Hihi all, I would like to have a briefing session on this ticket around 2.45PM later
[2026-09-18 15:30] Yi Link Lim: hi sorry all, lets have it around 4PM later ya.
[2026-09-18 16:05] Yi Link Lim: hi all, lets have the call now ya
[2026-09-18 21:35] Yi Link Lim: Since no one is joining the session, we will reschedule the session to next Monday 1045AM ya
[2026-09-24 14:22] Yi Link Lim: Hi Everyone lets have the briefing session later around 330PM ya
[2026-09-25 10:00] Yi Link Lim: hi all, lets have a briefing session on this ticket later at 11am ya. if no one is attending, will record the session for reference as this is a small ticket. do lemme know if there is any feedback. Thanks
[2026-09-25 11:41] Yi Link Lim: Hi will start call here. can join if anyone available
[2026-09-25 11:55] Yi Link Lim: Devs, do update here once any dev is assigned to this ticket ya. Kindly take note that this ticket is planned to be deployed together with EAINT-12107
[2026-09-28 08:33] Mei Jia Chee: hiii Tan Yi Fung, need ur help to arrange dev to pick up this CR ya
[2026-09-28 08:45] Tan Yi Fung: ok, btw, the briefing only Yi Link talk to herself?
[2026-09-28 09:02] Mei Jia Chee: bcz no one joining the briefing and she on leave this whole week.
[2026-09-28 09:32] Goh Kai Jiaeh: hi Kasheng Liew, I think this ticket you somehow already done when working on EAINT-12107. Could help to cross check?
[2026-09-28 10:14] Kasheng Liew: lemme see
[2026-09-28 13:21] Kasheng Liew: cross checked 12327, not done yet. transaction listing and payment report both untouched on latest staging, need frontend and backend. 12107 got some parts can reuse, will share with dev in charge
[2026-09-28 14:09] Goh Kai Jiaeh: Alright thanks for checking.
[2026-09-28 14:09] Goh Kai Jiaeh: Fyi, Kar Kin will help on this ticket.
[2026-10-01 10:35] Kasheng Liew: hi, i will takeover this ticket from Kar Kin ya, he handled over to me
[2026-10-15 23:35] Kasheng Liew: hi, dev for this ticket is completed ya, together with
[system] Goh Kai Jiaeh added Kasheng Liew to the chat and shared all chat history.
[system] Goh Kai Jiaeh added Unknown User to the chat and shared all chat history.
[system] Yi Link Lim added Nur Izni Binti Zurni and 9 others to the chat.

## Update 2026-10-16 → 2026-10-26 (captured 2026-10-26)

<!-- Read-only capture via Teams web DOM, 2026-10-26. Times MYT. Messages from 2026-10-16 00:00 to capture time, oldest first.
     Line breaks inside a message shown as " / ". Quoted replies appear inline at the start of a message ("<name> / <date> / <quoted text> / reply"). Images shown as [image]; reactions dropped. -->

**Muhammad Faizuddin Bin Bidi** — 2026-10-16 15:49: Hi Kasheng Liew, can help to deploy the changes to staging/cibo. thanks a lot ya

**Kasheng Liew** — 2026-10-16 17:17: Muhammad Faizuddin Bin Bidi / 16/10/2026 15:49 / Hi Kasheng Liew, can help to deploy the changes to staging/cibo. thanks a lot ya / deployed ya thanks

**Mei Jia Chee** — 2026-10-19 08:17: hiii Everyone, to update that this ticket targeted to deploy on Wednesday 21.10.2026 morning ya

**Yi Link Lim** — 2026-10-20 09:26: Muhammad Faizuddin Bin Bidi Can help to confirm whether QA has start testing on this ticket? If yes, can help to update the ticket status? / Also, can inform here once this ticket is ready for walkthrough session?

**Yi Link Lim** — 2026-10-20 09:48: Hi Everyone Received feedback from dev side on below items: / 1. shopeepay unable to categories pay later & full payment / -> Filter for shopeepay change to: Fiuu | eWallet – ShopeePay / 2. Grabpay - able to receive response for 3 payment method / a. Fiuu | eWallet – GrabPay – Full Amount – Single Payment / Method 1: full amount / Method 2: full amount next month (Pay later) / b. Fiuu | eWallet – GrabPay – BNPL – Installment / Method 3: installment / Will update SRD accordingly.

**Muhammad Faizuddin Bin Bidi** — 2026-10-20 09:55: Yi Link Lim / 20/10/2026 09:26 / Muhammad Faizuddin Bin Bidi Can help to confirm whether QA has start testing on this ticket? If yes, can help to update the ticket status? Also, can inform here once this ticket is ready for walkth… / Hi, yup, QA has started testing ya

**Yi Link Lim** — 2026-10-20 11:49: How is the testing progress on happy flow? Is it ready for walkthrough sessionn?

**Muhammad Faizuddin Bin Bidi** — 2026-10-20 11:52: Yi Link Lim / 20/10/2026 11:49 / How is the testing progress on happy flow? Is it ready for walkthrough sessionn? / Yup. the happy flow is working as expected

**Yi Link Lim** — 2026-10-20 13:00: Just to inform that I have uploaded v1.1 to JIRA ya. [image]

**Yi Link Lim** — 2026-10-20 15:07: Hihi Kasheng Liew Muhammad Faizuddin Bin Bidi As spoken, added Fiuu - FPX display format for Secarang payment method ya: Fiuu | Online Banking – FPX-Bank Name [image]

**Kasheng Liew** — 2026-10-20 15:30: Yi Link Lim / 20/10/2026 15:07 / Hihi Kasheng Liew Muhammad Faizuddin Bin Bidi As spoken, added Fiuu - FPX display format for Secarang payment method ya: Fiuu | Online Banking – FPX-Bank Name 📷 / hi, new change is in, can retest [image]

**Muhammad Faizuddin Bin Bidi** — 2026-10-20 18:12: Hi Everyone, just a quick update, QA has completed testing for EAINT-12327 on staging/cibo (Secarang & CIBO) with no outstanding issues. It's ready for morning deployment on 21 Oct (Wednesday). Thanks to everyone involved!
