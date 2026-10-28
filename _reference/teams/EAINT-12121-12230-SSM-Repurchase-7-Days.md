<!-- Source: Teams group chat "EAINT-12121 & EAINT-12230 | [eAuto-UCD] SSM - Remove 7 Days Validation After First Purchase to Allow SSM Repurchase".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2026-08-06, 29 messages). Acknowledgements dropped. -->
# EAINT-12121 / 12230 SSM repurchase (remove 7-day validation)

[2026-08-06 10:43] Yi Link Lim: Hihi Everyone here is CR group for this ticket: EAINT-12121 [eAuto-UCD] SSM: Remove 7 Days Validation After First Purchase to Allow SSM Repurchase
[2026-08-06 16:59] Tan Yi Fung: Wong Zhan Choon, please help on this also
[2026-08-07 08:14] Goh Kai Jiaeh: Morning Wong Zhan Choon, could you help to check and study any negative impact or concern if remove this validation before you start development? Thanks
[2026-08-07 12:07] Jin Siang Boo: I do rmb rafftech have some handling on cooldown before next purchase one, think need study back the IDD or check with Rafftech side
[2026-08-07 12:08] Wong Zhan Choon: From what I found is will return response code "008" when requesting within the timeframe, current timeframe I checked is 3 hours
[2026-08-10 10:24] Goh Kai Jiaeh: hi all, fyi Rafftech feedback that our account is excluded for this 008 checking which meant can purchase same BRN within 3 hours.
[2026-08-10 10:36] Goh Kai Jiaeh: But think we need to have some cooling period as per Yi Fung's suggestion. Can take a look this. (claude.ai artifact)
[2026-08-10 12:17] Yi Link Lim: Noted KJ. which means 1 hr cooling period is strongly suggested and UCD not allowed to repurchase SSM document within this 1 hr cooling period. Will inform Ops on this ...
[2026-08-10 12:28] Goh Kai Jiaeh: Think 15 or 30 mins also can. Just that not advisable to completely remove the validation only.
[2026-08-11 18:01] Yi Link Lim: Goh Kai Jiaeh As spoken earlier, confirmed with Nurul to have 10 min cooling down period. Within this 10 min period, UCD is unable to repurchase this SSM Document. System only allow UCD to repurchase ssm after this cool down period.
[2026-08-13 15:34] Yi Link Lim: Hihi Everyone just to update that SRD v0.1 is uploaded to JIRA. ...
[2026-08-14 17:07] Yi Link Lim: Hihi Everyone here is the summary and updates during our briefing session just now: BA to update SRD: 1. Affected page > add Resubmission case from Listing 2. STMS purchased SSM, UCD can repurchase SSM in eSTM. BA to double confirm on requirement: 1. BO - If UCD repurchase case, system remain unchanged to allow BO download SSM documents in zip file. 2. Special scenario / 1st purchase - SSM status = OK / 2nd purchase - SSM status = Failed should 1st purchase SSM still valid to be downloaded? Nurul: No, system should only allow UCD to download latest SSM doc. If 2nd purchase, SSM Status = Failed, UCD unable to view & download SSM Doc for 1st purchase.
[2026-08-18 18:17] Yi Link Lim: Hi Everyone Just to share that I have uploaded v0.2 and v1.0 to JIRA. ...
[2026-08-19 10:58] Wong Zhan Choon: need some time on this, need to have a technical walkthrough before code review ... (11:09) ready for testing (next Monday)
[2026-08-24 09:07] Yi Link Lim: Hii morning Wong Zhan Choon Once done code review and ready for testing, can inform here ya. fyi, this ticket dont have planned deployment date just yet. QA side will advice staging env once it is confirmed.
[2026-08-24 09:11] Yi Link Lim: Kindly update the ticket status to "Code Review" ya / once deployed to staging, kindly update to "Ready in 1st env"
[2026-08-24 09:50] Charmain Ea Chiang: Hi Wong Zhan Choon, please wait for QA's greenlight ya, dont deploy to any staging env first, thank you
