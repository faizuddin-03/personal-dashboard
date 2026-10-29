<!-- Source: Teams 1:1 chat "Charmain Ea Chiang" (Senior QA Engineer, Faiz's day-to-day senior) with Muhammad Faizuddin Bin Bidi.
     Captured 2026-10-16 (read-only sweep). Times MYT. Coverage: 2026-04-09 (chat start) to 2026-10-05; later messages are in the 10-06..15 digest.
     Trimmed: scheduling chatter, acknowledgements, personal content dropped; quoted forwards shortened.
     ALL credentials posted in this chat (UCD test login 2026-05-06, Fiuu sandbox card/login data 2026-05-22 and 2026-08-20,
     mfizni production passwords 2026-08-13 / 2026-09-20 / 2026-09-21 / 2026-09-28) are [redacted]. Phone numbers removed.
     "Charmain:" = Charmain Ea Chiang; "Faiz:" = Muhammad Faizuddin Bin Bidi. -->
# DM — Charmain Ea Chiang

## April–May 2026
[2026-04-09 08:59] Faiz: Regarding my ticket EAINT-3090, which senior can I approach later to go through this ticket?   Charmain: i think you can reach out to Azfar on this ticket ya, as he has experience testing similar cr before
[2026-04-14 16:14] Charmain: Hi Faiz, this is the sample issue ticket i mentioned earlier: https://mfservices.atlassian.net/browse/EAINT-10015 no need to follow it exactly, it is just for reference. Feel free to make any changes, but please ensure the ticket you raise is clear and easy for the dev to understand ya
[2026-04-14 17:50] Charmain: Hii Faiz, the overall progress should be the progress of the whole ticket ya, can refer back to the overall progress table in the excel, it is currently around 57% (71/125) [re Faiz's EOD for EAINT-9944 - To Enhance Web Socket with MyBioID Service Installer v2, which showed "Overall Testing Progress: 4/5 (80%) - PASS only" for the Dermalog TS subset]
[2026-04-15 14:55] Charmain: Hi Faiz, can you please upload your test evidence for 9944 to sharepoint? ...
[2026-04-15 15:32] Charmain: you can study this CR first EAINT-8606 - [eAuto][Insurance] To onboard Zurich Takaful under Pemaju Eksklusif Sdn. Bhd. ... (15:36) here is the Miro board, Azfar is currently drafting the test plan and test scenarios ... you may proceed to request for access ya and i will grant it to you
[2026-04-15 16:37] Charmain: Hi Faiz, just to update you that our side no need to provide the estimation for the 2 tickets for now ya, we will draft it later / you can focus on drafting the ts first ya
[2026-04-15 17:13] Charmain: Hi Faiz, nick just informed that Azfar still needs help with Zurich ... You can put EAINT-9715 aside and focus on Zurich first for now ya
[2026-05-04 17:19] Faiz: Hi Charmain, while doing the testing for 3090, I encountered some issues and discussed with the dev about it. It seems like there are some changes to the requirements that was not reflected in the SRD. The dev got it direct from the BA. ...
[2026-05-05 11:19] Faiz: I encountered bug where the report is not displaying the actual payment amount. When i check with the old system at staging/eauto, the old report is displaying the correct amount. ... I told Zhan Choon directly and he's currently in the process of fixing it. I raised the ticket also for the record
[2026-05-05 11:49] Charmain: Hii Faiz, for me it is high priority issue ya ... i think can raise this in the cr group and mentioned that dev currently is fixing it / need to highlight it is high priority issue / after zhan choon fixed it, you will need to check the rootcause and bug fix retest scope with him
[2026-05-05 15:43] Charmain: i think by lunch tmr might be too rushed for BA, as they need to arrange time to walkthrough the ticket with Ops ya
[2026-05-06 08:30] Charmain: i run the automation script to test 3090 jn, we still getting the wrong amount for some of the transaction type right? / ... eauto and service tax amount also all wrong
[2026-05-06 08:34] Charmain: you can refer to this gsheet ya [eAuto price list Google Sheet] / but it is not the latest cus we dont have the access to edit it / Latest Charges: STMS should be 20 for car and 10 for bike, and SSM should be 18
[2026-05-06 08:43] Charmain: nope they are diff modules ya, can refer to the keterangan column
[2026-05-06 10:41] Charmain: Hi Faiz, i just realised that your acc might not have any existing or old transaction / i think you can borrow our ucd account to test ya / either mine or nick's ucd acc / (credentials [redacted])
[2026-05-06 14:31] Charmain: (SSM charge change dated 23 April) yea i believe is expected ya, cus i remember that time nick side started testing earlier / i have confirmed with dev as well
[2026-05-11 09:31] Faiz: (Zurich) i tried both eauto and secarang. seems like the ISM API issue from last week ... All other TS requires the ISM API
[2026-05-11 09:40] Charmain: okie can2, please work on these ts first and let me know once your side has capacity ... you can check with Aliah to see if she needs help drafting ts for cibo tickets ya ... (10:04) yup2, you should prioritize zurich first
[2026-05-11 12:12] Faiz: TPFT: Not showing for both Individu and company (for Zurich). Company quotation: Not showing for Zurich. When i search for company, it shows this refer risk ... same goes for secarang
[2026-05-11 15:30] Charmain: okie noted ya, can focus on E2E TS first, any high priority issues can directly raise in the cr group
[2026-05-11 16:58] Charmain: (Secarang Car tab only accepts car VN, Motorcycle tab only motorcycle VN) yes by right should behave like this
[2026-05-14 08:36] Charmain: Hi good morning Faiz, based on the QA Planned Tasks shared earlier, please help Aliah with the 20th deployment items. Please prioritize 7495 and 9715 first ya
[2026-05-18 09:22] Charmain: Hi Faiz, as mentioned earlier, you will need to follow up with BA on the pending items and check with dev on the issue tickets ya
[2026-05-19 09:01] Charmain: can help to announce in the cr group as well? thankss
[2026-05-20 14:12] Charmain: Faiz, need your help to test macrokiosk ya, i will brief you on this later around 230pm [Miro board]
[2026-05-20 16:11] Charmain: Hi Faiz, currently staging/ia (secarang) is connected to prod boldpay payment ya, please dont do any payment for macrokiosk insurance trx for now
[2026-05-20 16:38] Charmain: can refer back to the miro for the staging env we use for secarang and eauto
[2026-05-21 08:21] Charmain: ... i need you help to draft and start testing on CIBO related SnF ya ... it is quite straightforward, basically to add another tag for Secarang - MK for 4 modules below: - Transaction Listing (drafted) - Payment Listing - Referred Risk Log Listing - Agent Management Listing; you can just copy the existing ts we have and draft for other module ya
[2026-05-21 10:25] Charmain: Hi Faiz, i created this issue ticket jn and it is related to the CIBO module SnF ya: EAINT-11524 There are some items pending confirmation with BA. Can you please help to check with Bat on this? I have assigned the ticket to you as well
[2026-05-21 15:04] Faiz: Hi charmain. I confirmed with Bat that Agent Management will not be included ya ... Only for the 3 Trx Management, Payment Management and Referred Risk Log ... all 3 affected modules will have nested filter ya: Secarang / Secarang only / Secarang-MK
[2026-05-22 09:28] Faiz: ... For Payment Report, the search time is averaging from 1-3 minutes every time. ...   Charmain: okie noted ya, can also raise this in issue ticket and assign to mong
[2026-05-22 10:09] Charmain: (BoldPay page TS) ya, but you no need to complete until finish / cus you will need to use that 1 trx to test all the ts ya
[2026-05-22 15:23] Faiz: (asks whether Fiuu sandbox card test data shared by KJ on 16/01/2026 still valid for /preprod) [card data redacted]
[2026-05-22 16:25] Charmain: i raised already ya / you can refer to this filter for all the issues raised that have not been fixed yet https://mfservices.atlassian.net/issues/?filter=13948
[2026-05-22 17:08] Charmain: Hi Faiz, are you available to support macrokiosk this weekend? / the expected deployment date is 25th May, Monday and the progress is not even 50% now
[2026-05-22 21:16] Charmain: Hii Faiz, you can proceed with testing the Secarang E2E Test Scenarios. Please compare it apple to apple with staging/preprod Secarang Homepage E2E flow, as it should behave exactly the same. This will be counted as regression testing, the Macrokiosk flow should not affect the Secarang Homepage flow.
[2026-05-23 15:27] Charmain: (an IC-looking value on a prod eSTM record) this is company new brn ya, company registration no
[2026-05-23 16:59] Charmain: just checking, the Secarang E2E Test Scenarios you tested, did you check the cibo modules as well?
[2026-05-24 14:12] Charmain: usually you dont record the test evidence in fullscreen? cus i cant see the date and time in the recording you shared ya
[2026-05-24 14:14] Charmain: moving forward it is better to record the date and time in test evidence so we can protect ourselves (touch wood if anything happens)
[2026-05-24 14:15] Charmain: for this case, can you help to update in the cr group and mention that the flow was tested ok yesterday, but today it seems to have the issue again? please tag everyone and cc dev KJ and Mong to fix this asap
[2026-05-25 09:16] Charmain: (where to find the transaction id) you can get from the url ya / transaction details page url
[2026-05-26 09:54] Charmain: (eSTM pay now flow) Can just test with esim ya
[2026-05-26 11:43] Charmain: Hi Faiz, this is the colour assigned to each QA that i mentioned just now ya [Miro]
[2026-05-26 12:08] Charmain: i will disable both tmim and lonpac insurance for awhile ya
[2026-05-26 14:42] Charmain: (CIBO Transaction Management shows WhatsApp-message time) yea im aware of this as well / the trx will show in cibo but without trx ref no / can you put the ticket onhold first, i need to check with BA ya
[2026-05-28 08:51] Charmain: (to get TMIM quotations) you need to disable the lonpac quotation in esim ya / you share the test data with dev, before dev trigger WA API, go to esim to chg the quotation display for Lonpac to false / then you will get all the trx with TMIM insurance quotation
[2026-05-28 09:00] Charmain: Hi Faiz, just a headsup ya, Nick's side might need help on Wholesale today since both Mai and Azfar are on leave. ...

## June–July 2026
[2026-06-03 08:30] Charmain: (simulate API down) yes can simulate using esim ya, just need to update insurance quotation > Lonpac and TMIM = false
[2026-06-03 08:43] Charmain: ok, please raise this as low priority issue ya, thanks
[2026-06-03 09:30] Charmain: according to the QA planned task i shared just now, please study 8700 credit note ya / Nabila will arrange a walkthrough session later
[2026-06-11 14:39] Charmain: Hi Everyone, just a quick update on yesterday discussion with Shamini and Dev. Payment Flow / Updated flow: Confirmation Page → Make Payment → Bold Pay (Popup). Payment Methods (Bold Pay) / - Credit Card / Debit Card: Pending check with Shamini — Dev mentioned cannot edit in Bold Pay settings / - FPX / - eWallet — MAE Scan QR: Dev checking with Macrokiosk on credentials, if need use real money will ask Shamini. CIBO — Payment Management / - New add in Filter (Payment Method): eWallet: Pending check with Shamini. Macrokiosk SMS (0182880075) / 1. Macrokiosk flow — all successful transactions / 2. Non-Macrokiosk flow — all successful transactions (100 messages/month). I will update back once everything confirmed ya
[2026-06-11 15:27] Charmain: (homepage auto-fill issue) i think it's due to cache / ... you try to clear cache and retest
[2026-06-18 14:44] Faiz: Hi Charmain. just updating that we asked KJ to change sit3 to eSIM insurance ya
[2026-06-25 10:25] Charmain: eDereg PreCheck Flow: Active / Approved / Failed - Vehicle Not Exist / Failed - JPJ Error Code / Expired (After 6 months). Dereg Flow: Active / Expired (After 6 months)
[2026-06-25 11:27] Faiz: (9306 walkthrough outcome) To confirm with BA: If purchase failed, what is the expected behaviour if user repurchases using the same VN again; Expected display in listing after clicking Yes (hyperlink) in the details page; Expected behaviour if refresh the page. To add: Additional E2E test cases as discussed (to cover all pages); eDereg Pre-Checking Expired Cronjob; Multiple AATF Users Scenario; RHB API Down; After Reset Payment; JPJ XML Log
[2026-07-02 16:50] Charmain: Hi Faiz, can refer the sample below for the ETA ya: Est. Testing Mandays: 6 days (1 QA); Base Testing Time: 4 days; Buffer (Req Change + Bug Fix + Retest Bug): 2 day
[2026-07-06 09:16] Charmain: Hi Faiz, as mentioned earlier, please help to list down all the pending items for zurich ya / also to follow up with BA on the latest requirements
[2026-07-06 15:57] Faiz: (Zurich meeting items) ... Zurich API will return the upper and lower limit for agreed value and market value. Need to test scenarios that will cover Agreed Value and Market Value. There will be scenarios where Agreed Value is not eligible (will return 0) and can only choose Market Value. Changes in eAuto UI: Need to add the BRN after 'Zurich General Takaful Malaysia Berhad'; Change from 'Zurich Takaful Malaysia Berhad' to 'Zurich General Takaful Malaysia Berhad'; Insurance Payment Page > Disclaimer Section ... Changes in Secarang UI: ... Terminologies in insurance details need to change to follow Zurich terminologies. Example Premium/Price > Contribution; Sum Insured > Sum Covered; Insured > Participant ...
[2026-07-08 10:23] Charmain: Faiz, once you have capacity, please study 10960 ya
[2026-07-10 16:35] Charmain: (forwarding Batrisyia's slot booking rules) Faiz, need to include these scenarios under slot capacity and boundary test ya
[2026-07-20 09:11] Charmain: Hi morning Faiz, just a heads up that you will be hosting the QA weekly huddle. I will add your name to the [QA] Huddle Host Roster (Google Sheet) Please check the schedule from time to time and prepare before the Monday and Wednesday huddle ya, thanks.
[2026-07-24 11:10] Charmain: (Mailtrap) you try to login with your modefair email and check whether you have the access to the modefair project
[2026-07-27 14:39] Charmain: Hi Faiz, are you available tonight to support the deployment?

## August–October 2026
[2026-08-04 12:27] Charmain: Hi Faiz, as discussed earlier, our understanding is correct ya, please help to update the high level test scope and provide the estimation for 11878 ya, thank you
[2026-08-04 12:32] Faiz: Hi charmain, i have question on how to determine which staging to be used?
[2026-08-04 12:32] Charmain: you can check here in the QA resource planning miro ya [Miro] / check whether there is any available staging env / please double confirm in QA group before you proceed to inform dev ya / i believe we can use uat4 / but not sure whether we merge down latest prod code base already
[2026-08-04 12:49] Charmain: (merge-down list incl. envs with conflicts) i think need to include uat3 and preprod1 ya / can follow up with karkin on that? / the env with conflict
[2026-08-04 17:32] Charmain: yup all items under the same deployment window should use the same staging env ya / can help to check with Mong is 11878 ready for testing? / remember to ask him to prepare the vehicle prefix in esim for you to test ya / i think need to advise secarang staging env also right? can use /ia
[2026-08-05 10:25] Charmain: Hi morning Faiz, for the happy flow regression, i think Mong need to setup esim for you to test also ya / to test on the cover note enquiry, cover note + jpj enquiry return at the same time but with both success status
[2026-08-05 12:23] Charmain: (WhatsApp from Lonpac flow) yaya need to ask Mong to patch the phone no to your phone no / ... make sure the msg is sending from the correct phone no
[2026-08-06 08:44] Charmain: ... i might need your help to test EAINT-8622. We are preparing the test data to share with JPJ ... The test data requires real ic no to test with the JPJ Staging API, so we wont need to keep patching the ic no every time we create a trx. ...
[2026-08-06 10:53] Charmain: (mock payment hardcoded to success for 11878) ya no concerns from my side ya, to bypass the payment / since our test scope is to check on the WA msg only
[2026-08-06 11:00] Charmain: remember to inform in QA group and Main Group before you connect to messagebird ya
[2026-08-06 13:04] Faiz: ... the Fiuu portal for sandbox payment had some changes where the IP is suddenly removed, so KJ needs to put in the IP again. ... Can consider this change is not from our side. Since it affects the sandbox env, should not effect the prod env
[2026-08-06 15:02] Charmain: Hi Faiz, as mentioned earlier, please share a copy of your test evidence and the screenshot of the WhatsApp message to YiLink after you done testing on EAINT-11878 ya, thank you
[2026-08-11 07:59] Charmain: Hi morning Faiz, im reviewing your test scenarios for 11979 ya. the SRD doesn't mention these two items, did you check with BA whether we need to remove them? The same applies to the exported csv file / We have different company type and also business type, are they sharing the same verify button? can help to check with dev if we need to test for all?
[2026-08-12 14:19] Charmain: https://mfservices.atlassian.net/browse/EAINT-148 (EAINT-148: [eAuto] Existing Known Issue (Pending Client Approval))
[2026-08-12 15:16] Faiz: (feedback on the QA-Issue skill) ... Since im using this to raise an existing issue, i point it to EAINT-148. But i notice that in the skill's step 1, it will start to understand the EAINT-148 ticket itself. ...   Charmain (15:18): oh ya, it will try to study the ticket first before creating issue ticket / i think you can just ask claude to skip that part for issue ticket under 148 ya
[2026-08-12 15:49] Charmain: Hi Faiz, please draft the prod regression scope for both 11978 and 11979 after you complete testing ya
[2026-08-13 08:42] Charmain: (mfizni prod account) izni is not in office yet / i get brandon to help to patch her acc pw already ya / [password redacted]
[2026-08-14 12:07] Faiz: (Secarang sandbox payment) ... the mock payment is currently only enabled in /ia. if want to use /preprod, need to ask mong to enable first ya
[2026-08-14 16:51] Charmain: Hi Faiz, here is the automation script i have ya, can ask claude to study [Mailtrap-Email-Checker.zip]
[2026-08-17 09:59] Faiz: since my ticket's changes affects the database (added 4 new columns in the database), should i ask db screenshot from dev during the prod deployment, to verify the details?   Charmain: ... i think can ask dev to provide db ss for prod as well ya, if they have no concerns
[2026-08-17 11:00] Charmain: nope i dont think im using mailtrap api to test with automation script ya, it actually using chrome mcp to access the mailtrap and test manually
[2026-08-17 11:01] Charmain: Faiz, as mentioned just now, you will be supporting tonight's deployment alone ya. If anything happens during the deployment, for example, if issue found and dev manages to fix it right away or makes any decisions, please drop a message in the QA group so that we are aware of what happened during the deployment ya, thank you / anything you can call me or Azila if you need help
[2026-08-18 14:19] Charmain: (eSTM fingerprint bypass) Brandon helped us to setup ya
[2026-08-18 17:56] Faiz: (12153 scope) Pre-Application - All 4 payment methods / FPX (B2C) FPX (B2B) Card QR (if BA confirms later on); Application - All 4 Payment methods / (same); Invoice & e-invoice from the application listing; The full flow from pre-application until complete creation of new UCD. My estimation on the testing is around 2+1 days
[2026-08-19 14:33] Charmain: (11864 new issue EAINT-12213) but the issue you raised is medium priority / i assume dev able to fix it on time / can you double check with JC?
[2026-08-19 15:00] Charmain: Faiz, just checking ya, 11864 cant verify on prod right?   Faiz: Yup correct2. everything reflects on the UCD side first, so no way to trigger   Charmain: okie then i will support the morning deployment tmr alone
[2026-08-20 17:04] Charmain: (Fiuu sandbox card credentials) [redacted] / i only have these but im not sure whether it is for razer or fiuu
[2026-09-01 11:46] Charmain: you tested with automation script? or m&m automation and manual ya?   Faiz: i got m&m both. but most of it automation script
[2026-09-03 12:26] Charmain: here ya [eAuto-PreApplication-to-Registered-E2E-Flow-Pack.zip]
[2026-09-04 11:59] Faiz: (9306) i got sync up with BA to demo the flow just now, and mentioned that some response code should be able to repurchase, while others cannot. My claude didnt pick that up. i ask dev also didnt notice this so right now im compiling the codes for different behaviours to send to dev
[2026-09-04 17:49] Charmain: ... study this ticket: EAINT-12289 To study and draft the high level scope / MeiJia mentioned that we need to reset payment for existing trx as well / I think we wont have any srd for this ticket, you need to check all affected areas / To provide QA testing estimation / please include this in your morning update ya
[2026-09-10 14:30] Charmain: (QA Tracker activity log) no need ya, that one is for your own reference, we prioritise the duration in the capacity tracker
[2026-09-14 10:31] Charmain: Hi morning Faiz, please rmb to draft the prod regression scope for 9306 ya, target to deploy tmr morning / ... you let me know how long you need to regress after completed the prod regression scope ya
[2026-09-14 12:31] Charmain: okie noted ya, can i put 30min with buffer?
[2026-09-14 17:33] Charmain: okie, make sure to regress the happy flow also ya
[2026-09-15 14:46] Charmain: Faiz, just checking ya, dev got merge down uat1 with last night prod deployment items before deploying to prod? / cus im not sure whether uat1 is with the latest prod code base now
[2026-09-15 14:49] Faiz: oh ya ya got. The eauto deployment notification said got uat1 deploy this morning at 7.40am ish
[2026-09-18 10:21] Charmain: (May reacted but no explicit green light) i think you can just proceed to update ya / you got do quick check on firefox for all ticket? / i think can wrap up dy / remember to update qa portal ya
[2026-09-18 11:10] Charmain: (12028 estimate 8+2) oh i see, okie then i remain as 8+2 first ya
[2026-09-18 16:34] Faiz: ... for the regression and monitoring, i will require izni's account to access Biometric Device Purchase & Software Installation Listing page. My prod account doesnt have access
[2026-09-20 09:29] Charmain: Faiz, headsup first ya, i haven't received reply from izni regarding her prod superadmin account credentials yet. If there is still no reply by Monday 8am, i think you can proceed to ask Brandon to help patch the password for the mfizni account in prod, you can use the temporary password to [redacted] for testing, then ask dev to revert the password once testing is completed. please also headsup MJ first about the mfizni password patching so BAs are aware ya
[2026-09-21 09:35] Charmain: (huddle hosting) EAINT-12341 we are looking at tmr or 23 Sep morning deployment, but it is depends on our testing progress ya, i think you can mention the deployment date as tbc first. LKM Refund, yup we have 3 tickets 104 10093 10119, tentative deployment date is 24 Sep, it depends on the UAT (mention this and also the UAT date range)
[2026-09-21 14:34] Charmain: (pending Izni's screenshot of prod BDP/SI transactions) i think should be fine ya / can just proceed to merge down latest prod code base
[2026-09-21 15:35] Charmain: yup2, need to click the release button for that staging env, then click the merge down all button every time after dev merge down latest prod code base ya, but i merge down and release already jn, you can do it next time. i will also prepare a user guide for QA flow in QA Portal and share it in our group later
[2026-09-21 15:36] Charmain: Faiz, you can assign the staging branch here ya [img]
[2026-09-21 16:08] Charmain: Faiz, for 12151, can you help check with Dev whether it will affect the 1 Oct items? Currently, the 12218 changes are already in staging/cibo, so im not sure whether they can split the changes and deploy them separately or not   Faiz (16:14): Mong said should not affect the 1st october tickets
[2026-09-22 12:03] Charmain: (UAT duration) normally will last whole day, until 5pm then continue tmr / ... then better ask MJ first (before deploying to staging during UAT, in case tomcat restart)
[2026-09-23 09:57] Charmain: lkm refund, can update that qa in the midst of regression testing ya and the progress percentage
[2026-09-23 12:01] Faiz: Oh ya. Dev confirmed its actually the Transaction Details Page. Her AI renamed the page itself
[2026-09-25 11:10] Charmain: Faiz, i have assigned you to support both 28 and 30 Sep morning deployment ya, please confirm your availability in QA Portal and let me know how long you need for prod regression testing
[2026-09-25 14:59] Faiz: (single-option status dropdown) Yea expected. Dev said he also dunno, ops want like this, he just make it
[2026-09-25 16:01] Charmain: i think we can only use izni's prod acc to access BDP page
[2026-09-25 16:04] Charmain: (BDP page for main user only in prod) you can chg UCD TEST director to yourself ya / chg it back after done testing
[2026-09-25 17:29] Charmain: Faiz just checking ya, your automation script cover got include these scenarios? ... (17:44) can go ahead and announce that ya / you prepared the prod regression checklist dy?
[2026-09-28 14:27] Charmain: (merge down after 28 Sep monitoring) yup2 can proceed to do so
[2026-09-29 09:07] Charmain: (12339 night deployment) eh i thought will be morning deployment / let me check with MJ again ya
[2026-10-01 15:34] Charmain: Faiz, you start testing 12339 dy? / remember to update the ticket status ya

## Update 2026-10-16 → 2026-10-26 (captured 2026-10-26)

<!-- Read-only capture via Teams web DOM, 2026-10-26. Times MYT. Messages from 2026-10-16 00:00 to capture time, oldest first.
     Line breaks inside a message shown as " / ". Quoted replies appear inline at the start of a message ("<name> / <date> / <quoted text> / reply"). Images shown as [image]; reactions dropped. -->

**Muhammad Faizuddin Bin Bidi** — 2026-10-16 10:53: Hi morning Charmain. For secarang/ia, is it currently in use or free ya?

**Charmain Ea Chiang** — 2026-10-16 10:55: it is currently available ya

**Charmain Ea Chiang** — 2026-10-16 10:55: i have updated the portal

**Muhammad Faizuddin Bin Bidi** — 2026-10-16 10:56: okay thanks a lot

**Charmain Ea Chiang** — 2026-10-16 10:56: i think got bug, let me push the fix later

**Charmain Ea Chiang** — 2026-10-21 00:08: Hi Faiz, putting this here first ya. Please ask Dev to merge the latest prod code base down to staging/uat1 before deploying 21 Oct morning deployment items to production / Also, remember to monitor prod for both tonight's and tomorrow morning's deployment items / Charmain Ea Chiang / 19/10/2026 17:09 / Hi Muhammad Faizuddin Bin Bidi, just leaving a message here first ya regarding tomorrow morning's support. / Please monitor production and check whether there are multiple failed transactions with the same error code. If yes, please raise this to Dev, either YiFung or KJ. [image]

**Muhammad Faizuddin Bin Bidi** — 2026-10-21 09:02: okay noted on this. will do

**Muhammad Faizuddin Bin Bidi** — 2026-10-26 09:34: Hi charmain. want to ask you for these deployment items: / I notice that the deployment item for this morning is only EAINT-12431. So what will happen for EAINT-12589 / And for EAINT-12431, can i say in the huddle later that deployment is done and QA will monitor from time to time [image]

**Charmain Ea Chiang** — 2026-10-26 09:37: Muhammad Faizuddin Bin Bidi / 26/10/2026 09:34 / Hi charmain. want to ask you for these deployment items: 📷 I notice that the deployment item for this morning is only EAINT-12431. So what will happen for EAINT-12589 And for EAINT-12431, can i… / no QA needed for 12589 ya

**Charmain Ea Chiang** — 2026-10-26 09:39: Muhammad Faizuddin Bin Bidi / 26/10/2026 09:34 / Hi charmain. want to ask you for these deployment items: 📷 I notice that the deployment item for this morning is only EAINT-12431. So what will happen for EAINT-12589 And for EAINT-12431, can i… / as for EAINT-12431: QA has completed the prod regression testing and will continue to monitor prod from time to time

**Muhammad Faizuddin Bin Bidi** — 2026-10-26 09:39: Charmain Ea Chiang / 26/10/2026 09:37 / no QA needed for 12589 ya / i see. so for this one, still includ in the huddle as usual right?

**Charmain Ea Chiang** — 2026-10-26 09:41: Muhammad Faizuddin Bin Bidi / 26/10/2026 09:39 / i see. so for this one, still includ in the huddle as usual right? / ya just mention that it has been deployed to prod

**Muhammad Faizuddin Bin Bidi** — 2026-10-26 09:42: okay, I've updated the message ya. Thanks a lot
