<!-- Source: Teams group chat "EAINT-12107 [Secarang-Fiuu] Enhance Payment Gateway to Enable SPAY Later and PayLater by Grab".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2026-08-26). Reactions dropped. -->
# EAINT-12107 Secarang Fiuu SPayLater / PayLater by Grab

[2026-08-26 17:36] Yi Link Lim: hi all, here is the CR group for EAINT-12107 [Secarang-Fiuu] Enhance Payment Gateway to Enable SPAY Later and PayLater by Grab
[2026-08-27 09:21] Tan Yi Fung: is this CR urgent? any expected deadline yet?
[2026-08-27 09:26] Goh Kai Jiaeh: Just fyi Fiuu account for secarang is different with eauto one. Need to make sure to enable for the correct merchant account.
[2026-08-27 15:20] Yi Link Lim: Tan Yi Fung This is not an urgent CR and no arranged deployment date just yet
[2026-08-27 15:23] Yi Link Lim: which means secarang and eauto using different merchant id? can share it here? Just want to double confirm with Shamini on this
[2026-08-27 15:28] Goh Kai Jiaeh: You meant the production merchant id for secarang and eauto right?
[2026-08-27 18:11] Yi Link Lim: yesss
[2026-08-28 09:00] Goh Kai Jiaeh: eAuto (preApplication & Application) -> 'eauto' Serbasentral (Secarang) -> 'serbasentral'
[2026-09-02 14:32] Yi Link Lim: Goh Kai Jiaeh Confirmed with Shamini that these new payment channels are enabled for serbasentral ya
[2026-09-03 09:49] Tan Yi Fung: Kasheng Liew, please start with this ticket first
[2026-09-03 09:53] Yi Link Lim: Hi Everyone I would like to have a briefing session for this ticket around 1115AM ya. Do lemme know you have any feedback. Thanks
[2026-09-03 10:17] Yi Link Lim: Hi Everyone received feedback from dev that they have another meeting on 11am. Lets reschedule this briefing to 12PM ya
[2026-09-03 12:01] Yi Link Lim: sorry all, lets have it by 1210PM ya
[2026-09-03 12:03] Yi Link Lim: hii Sorry ya, we can start now.
[2026-09-03 12:21] Yi Link Lim: Hihi Everyone I have uploaded design reference & SRD v0.1 to JIRA ya. [attachment/image]
[2026-09-03 12:27] Yi Link Lim: As discussed in briefing session just now, need dev side to help to confirm below items: How is the payment flow of both method? / According to online materials, system should redirect user to Grab or Shopee to make payment / Can advice whenever user use different devices such as laptop & phone ya. Behaviour of successful payment, failed payment & cancelled payment Any max limit in sandbox for both SPay & GrabPay? How can QA test these two methods in staging?
[2026-09-03 16:27] Kasheng Liew: hi Goh Kai Jiaeh, can i confirm is serbasentral the production merchant ID for fiuu?
[2026-09-03 16:45] Goh Kai Jiaeh: Ya true. This is production one.
[2026-09-03 19:06] Kasheng Liew: Yi Link Lim, here are my findings 1. spay later and paylater by grab are not separate payment channels. / fiuu confirmed they are options inside the shopee and grab apps. on our / side we only add 2 channels, shopeepay and grabpay. 2. customer can choose to pay in full or pay later after they leave our page, this cannot control by us. 3. what the customer sees inside the app, from my testing: / - shopee: pay in full now, next month, or 3/6/12 months instalment. / payment is completed inside the shopee app. / - grab: pay in full now, next month, or 4/8/12 months instalment. / need approval to login in the browser from the grab app, then come back to browser to complete the payment. 4. question for you: do we need to record which option the customer picked? / - grab: yes can, and it is a small change. fiuu returns a field / grabpay_indicator (GPWALLET, POSTPAID, INSTALMENT_4), and our backend already reads this same block of data for card / payments. just need 1 new column. / - shopee: no equivalent field in fiuu's api spec, it only shows in fiuu merchant portal. i am checking with fiuu. also note that their api documentation seems not the latest, so further checking needed if yes, do you need it split by tenure (3/6/12 months), or just enough to know paylater vs normal? it changes how we store it. 5. fiuu mentioned that their sandbox do not have bnpl for us to test, you may refer to the email thread i sent to their support 6. fiuu offered a dev account for testing but said it uses real money. might need to sort out whose account we use and whether it can be cancelled after testing. will confirm with them again. cc Tan Yi Fung Goh Kai Jiaeh
[2026-09-04 10:11] Yi Link Lim: Noted. Lemme inform Shamini on below items: only ShopeePay & GrabPay available; GrabPay & ShopeePay payment option by customer; will inform here once there is any updates. Regarding the sandbox env, is normal shopeepay and grabpay available? If no, are we able to prepare simulator for both shopeepay and grabpay for normal & BNPL? fyi, EAINT-12153 (B2B payment) has implemented simulator for normal flow testing purpose
[2026-09-04 12:02] Kasheng Liew: yes only normal shopeepay and grabpay available in sandbox env. for actual paylater option, fiuu team said it can only be tested in production
[2026-09-07 14:45] Yi Link Lim: Hii Everyone, as discussed, I have confirmed with Shamini on the below items: Enable both ShopeePay & GrabPay in Secarang, as BNPL is one of the payment options. We can proceed to deploy BNPL for both ShopeePay & GrabPay to prod without testing in staging, as this option is unavailable in the sandbox. However, the respective Dev should ensure that both payment methods are deployed in a flexible way, so that the Dev side can disable a particular payment method if needed. FYI, the current payment options in Secarang are hardcoded. I have checked with KJ and confirmed that this approach is possible. Besides, we need QA to advise whether there are any concerns from the QA side if we proceed with BNPL without testing in staging. Thankss. cc: Tan Yi Fung Goh Kai Jiaeh
[2026-09-07 15:21] Kasheng Liew: hi Yi Link Lim, what about the questions regarding cibo dashboard?
[2026-09-07 18:10] Yi Link Lim: Hi Everyone To add on for CIBO > Payment Management > Payment Channels filter, here is the new filter name ya: [x] Fiuu - eWallet [x] GrabPay [x] GrabPay - PayLater by Grab [x] ShopeePay [x] ShopeePay - SPayLater Kindly take note that Shamini just need to know whether it is full payment or installment - no need to state instalment monts. Do lemme know if there is any feedback. Thankss
[2026-09-08 17:15] Kasheng Liew: update on this ticket 1. secarang-backend and serba-sentral-api staging - done and tested 2. cibo - payment management now shows the fiuu ewallet transactions, and the new "Fiuu - eWallet" filter (grabpay, shopeepay) works 3. cibo - transaction management no longer shows "-" for payment method 4. cibo - grabpay paylater filter is not in the dropdown yet because we can only check the indicator in production. will add it after we confirm fiuu does pass the indicator. same goes for spaylater 5. secarang staging - added both grabpay and shopeepay (all payment method working fine except for shopeepay, this 1 has to do with fiuu shopeepay, its stimulator in sandbox doesn't work as well) Yi Link Lim Tan Yi Fung Goh Kai Jiaeh
[2026-09-09 18:00] Yi Link Lim: Kasheng Liew Thanks for informing. Just to double confirm on item 5, does it mean QA is unable to test shopeepay behaviour using sandbox?
[2026-09-09 18:03] Kasheng Liew: yes you are right, because shopeepay in sandbox is failing from fiuu side. so QA can only test on grabpay, but they can only set result to either pass or fail ya, dont have paylater option to select
[2026-09-10 16:45] Yi Link Lim: hi all, just to inform that uploaded SRD v0.2 and v1.0 [attachment/image]
[2026-09-11 15:19] Yi Link Lim: Hi all, as received feedback from dev on payment reference ID, added into SRD v1.1 ya [attachment/image]
[2026-09-15 09:27] Yi Link Lim: Hi Kasheng Liew Can help to confirm that code review for this ticket has done and ready for QA testing?
[2026-09-15 10:21] Kasheng Liew: hi Yi Link Lim, yes good for QA testing ya
[2026-10-07 11:54] Mei Jia Chee: hii Kasheng Liew, can help to advise this CR & EAINT-12327 can deploy in morning session or must proceed night deployment ya?
[2026-10-07 12:40] Kasheng Liew: get back to you soon ya
[2026-10-07 12:55] Kasheng Liew: can deploy in morning ya
[system] Tan Yi Fung added Kasheng Liew to the chat and shared all chat history.
[system] Yi Link Lim added Nur Izni Binti Zurni and 10 others to the chat.

## Update 2026-10-16 → 2026-10-26 (captured 2026-10-26)

<!-- Read-only capture via Teams web DOM, 2026-10-26. Times MYT. Messages from 2026-10-16 00:00 to capture time, oldest first.
     Line breaks inside a message shown as " / ". Quoted replies appear inline at the start of a message ("<name> / <date> / <quoted text> / reply"). Images shown as [image]; reactions dropped. -->

**Muhammad Faizuddin Bin Bidi** — 2026-10-16 15:46: Hi Kasheng Liew, can help to deploy the changes to secarang staging/ia. thanks ya

**Kasheng Liew** — 2026-10-16 17:17: Muhammad Faizuddin Bin Bidi / 16/10/2026 15:46 / Hi Kasheng Liew, can help to deploy the changes to secarang staging/ia. thanks ya / deployed ya thanks

**Mei Jia Chee** — 2026-10-19 08:17: hiii Everyone, to update that this ticket targeted to deploy on Wednesday 21.10.2026 morning ya

**Yi Link Lim** — 2026-10-20 09:26: Muhammad Faizuddin Bin Bidi Can help to confirm whether QA has start testing on this ticket? If yes, can help to update the ticket status? / Also, can inform here once this ticket is ready for walkthrough session?

**Yi Link Lim** — 2026-10-20 09:54: Hi Everyone Received feedback from dev side that system unable to categories pay later & full payment due to insufficient information in shopeepay response. Hence, this filter is no longer valid: ShopeePay - SPayLater / Will update SRD accordingly.

**Muhammad Faizuddin Bin Bidi** — 2026-10-20 09:55: Yi Link Lim / 20/10/2026 09:26 / Muhammad Faizuddin Bin Bidi Can help to confirm whether QA has start testing on this ticket? If yes, can help to update the ticket status? Also, can inform here once this ticket is ready for walkth… / Hi, yup, QA has started testing. The happy flow is working ya

**Yi Link Lim** — 2026-10-20 13:04: Hi all, just to inform that SRD v1.2 is uploaded to JIRA ya. Thanks [image]

**Muhammad Faizuddin Bin Bidi** — 2026-10-20 18:12: Hi Everyone, just a quick update, QA has completed testing for EAINT-12107 on staging/ia (Secarang & CIBO) with no outstanding issues. It's ready for morning deployment on 21 Oct (Wednesday). Thanks to everyone involved!
