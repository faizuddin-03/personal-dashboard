<!-- Source: Teams group chat "EAINT-12180 & 12253 [eAuto-UCD] Homepage - To Display Announcement and Browser Reminder for Mozilla Firefox to Google Chrome Migration Effective 1 January 2027".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (2026-08-26 to 2026-09-08, 44 messages); acknowledgements dropped. "Unknown User" = Wong Kar Kin. -->
# EAINT-12180 / EAINT-12253 Firefox to Chrome migration announcement

[2026-08-26 17:35] Yi Link Lim: CR group for EAINT-12180 Homepage: To Display Announcement and Browser Reminder for Mozilla Firefox to Google Chrome Migration Effective 1 January 2027
[2026-08-28 10:11] Tan Yi Fung: Wong Kar Kin, please help on this, get it done today
[2026-08-28 10:56] Wong Kar Kin: questions: popups only for users still using firefox 36 or under? ucd homepage popup first visit only? does this cr also block firefox 36 after 1 Jan 2027? scope of last-step popup? ordering vs existing popups? pdf guide/tutorial video/user guide reuse?
[2026-08-28 11:15] Yi Link Lim: we might proceed with the announcement popup first by patching to prod.
[2026-08-28 12:26] Mei Jia Chee: just replace will do ya, no longer need this existing firefox popup anymore / nvm, no need to set the date to remove as of now first
[2026-08-28 12:27] Wong Kar Kin: browser reminder popup for all transaction types: stms, estm, bmk, jomcheck, wholesale stms, wholesale full payment?, apt?, insurance?, service hub?
[2026-08-28 18:09] May Chin Mei Theng: currently there's no available staging test environment for this ticket, as all environments are occupied by other CRs or deployment windows Can Dev spin up another staging branch for testing? If not, the earliest available environment will be staging/uat4 AFTER morning deployment on 2nd September
[2026-09-01 09:22] Yi Link Lim: All trx type listed here shud be included (if UCD using firefox browser)
[2026-09-01 18:09] Yi Link Lim: received feedback from QA to separate ticket for Announcement popup & browser reminder: EAINT-12180 Homepage - To Display Announcement ...; EAINT-12253 To Display Browser Reminder in Last Step of Transaction ...
[2026-09-02 10:23] Charmain Ea Chiang: yup2, can use staging/uat4 ya
[2026-09-03 09:51] Yi Link Lim: We have missed out to include below modules to display browser reminder: UCD to UCD (Standard / Interstate), Derege-Dereg. Besides, to highlight that confirmed with Ops that system DO NOT display browser reminder for Update Company Profile (as known as Pre e-Invoice)
[2026-09-03 16:19] Yi Link Lim: (footer "Best Compatible With Mozilla Firefox V36.0.4") We should remain unchanged for this footer after deployment of 12180 ya. We will address this once we dont allow UCD to use firefox
[2026-09-03 16:34] Yi Link Lim: yes, AATF shud have same behaviour as well ya. (AATF homepage announcement)
[2026-09-03 17:59] Yi Link Lim: SRD v1.1 for 12253; SRD v1.2 for 12180
[2026-09-04 15:56] Wong Kar Kin: also EAINT-12253 the changes cover too many pages already, will suggest to do deployment
[2026-09-07 18:26] May Chin Mei Theng: QA has completed testing for EAINT-12180 on staging/uat4 (eAuto) with no outstanding issues. It's ready for deployment / patching tomorrow once we've gotten the greenlight from Ops ya
[2026-09-08 09:26] Yi Link Lim: can dev get ready for patching to prod for 12180? We have gotten greenlight from Ops side ya

## Update 2026-10-16 → 2026-10-26 (captured 2026-10-26)

<!-- Read-only capture via Teams web DOM, 2026-10-26. Times MYT. Messages from 2026-10-16 00:00 to capture time, oldest first.
     Line breaks inside a message shown as " / ". Quoted replies appear inline at the start of a message ("<name> / <date> / <quoted text> / reply"). Images shown as [image]; reactions dropped. -->

**Mei Jia Chee** — 2026-10-20 14:25: hiii Tan Yi Fung, may i know who is the dev will take over this ticket? we planning to deploy on 28.10.2026 (Wed), wanted to know if this ticket can be morning or must be night deployment?

**Tan Yi Fung** — 2026-10-20 17:11: Wong Zhan Choon, i merging prod/master into dev/feat/EAINT-12253, help to take over this

**Tan Yi Fung** — 2026-10-20 17:18: Mei Jia Chee / 20/10/2026 14:25 / hiii Tan Yi Fung, may i know who is the dev will take over this ticket? we planning to deploy on 28.10.2026 (Wed), wanted to know if this ticket can be morning or must be night deployment? / Can be morning

**Tan Yi Fung** — 2026-10-20 17:19: Wong Zhan Choon, there is a MR pointing to staging/eauto https://masterjedi.modefair.com/eauto/eauto_v2/-/merge_requests/4758#7cda4b03fa0e2b209a9218e5461573b74d2f12cd

**Wong Zhan Choon** — 2026-10-20 17:20: will study now

**Tan Yi Fung** — 2026-10-20 17:24: ok , make sure the dev is align with SRD and sort out all doubt

**Amirul Azfar** — 2026-10-21 10:13: Hi morning Wong Zhan Choon, is this ticket 12253 ready for qa to start test?

**Wong Zhan Choon** — 2026-10-21 10:13: Amirul Azfar / 21/10/2026 10:13 / Hi morning Wong Zhan Choon, is this ticket 12253 ready for qa to start test? / Hi Morning Amirul Azfar, yes ready for testing, pending for staging env

**Amirul Azfar** — 2026-10-21 10:21: Wong Zhan Choon / 21/10/2026 10:13 / Hi Morning Amirul Azfar, yes ready for testing, pending for staging env / Can use /uat1 for this ticket ya

**Wong Zhan Choon** — 2026-10-21 10:22: ok will merge now ya

**Wong Zhan Choon** — 2026-10-21 10:33: Already done ya merged to staging/uat1 / Wong Zhan Choon / 21/10/2026 10:22 / ok will merge now ya

**Yi Link Lim** — 2026-10-21 17:12: hii Everyone, this ticket tentatively target to deploy on next Wednesday 28.10.2026 morning ya /

**Yi Link Lim** — 2026-10-26 10:30: Hi QAs, can help to confirm whether when this ticket is ready for walkthrough session? Do lemme know latest by 4PM today ya.

**Amirul Azfar** — 2026-10-26 10:39: Yi Link Lim / 26/10/2026 10:30 / Hi QAs, can help to confirm whether when this ticket is ready for walkthrough session? Do lemme know latest by 4PM today ya. / Hi Yi Link Lim, for 12253, everything except APT is tested on staging /uat1/ and ready for the walkthrough. For APT, the reminder itself is fine. It shows on Step 6 Transfer. The problem is that after a successful payment, the "Payment request sent" popup takes the user to the listing, not to Step 6 Transfer. The current build does the same thing, it is raised under Existing Known Issues : https://mfservices.atlassian.net/browse/EAINT-12626. Do you want to fix EAINT-12626 together with this ticket before the 28.10 deploy, or leave it as a separate fix?

**Yi Link Lim** — 2026-10-26 12:02: Amirul Azfar / 26/10/2026 10:39 / Hi Yi Link Lim, for 12253, everything except APT is tested on staging /uat1/ and ready for the walkthrough. For APT, the reminder itself is fine. It shows on Step 6 Transfer. The problem is that aft… / Wong Zhan Choon has reach out to me on this just now in person. / As discussed earlier last week, we should deploy this bug ticket together with 12253 ya. If not mistaken, QA side only need small effort to test on this bug ticket tgt with 12253 ya. / Amirul Azfar Does QA side has any concern to proceed to deploy this ticket by this Wed? If QA side has concern or feedback, can lemme know ya.

**Amirul Azfar** — 2026-10-26 14:49: Yi Link Lim / 26/10/2026 12:02 / Wong Zhan Choon has reach out to me on this just now in person. As discussed earlier last week, we should deploy this bug ticket together with 12253 ya. If not mistaken, QA side only need small ef… / No concern from QA side ya

**Yi Link Lim** — 2026-10-26 15:01: Amirul Azfar / 26/10/2026 14:49 / No concern from QA side ya / okkiess, then we will deploy this 12626 with 12253 ya
