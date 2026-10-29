# Releases and deployments — chronological

Built from every ticket source in the repo on 2026-10-15. Companion to
`cr-ledger.md` (one section per ticket). Release version = the Jira fix version
(`S<sprint>.<n>-<YYYYMMDD>`). "Env used" is the testing environment QA ran on
before the deploy, when a source names it. Provenance tags as in `cr-ledger.md`.
Rows with `[unconfirmed]` have a date from one source only and no corroboration.

Rows from 2026-10-20 onward were updated on 2026-10-26 from the future-deployments
study (`_reference/tickets/Studying/`: per-ticket `<KEY>-study.md` §1 for Jira status
and fix version read 2026-10-26, `_miro-board-capture-2026-10-26.md` for the Miro
"QA Resource Planning" deploy columns, `_teams-sweep-2026-10-26.md` for Teams). The
fix version "[QA]Ready for Testing Tickets" carries a release date of 2026-11-02 but
is a holding bucket, not a deploy date. Per-ticket status: `cr-ledger.md` § "Status
snapshot 2026-10-26".

## Table

| Date | Release | Tickets | Env used | Who tested | Source |
|---|---|---|---|---|---|
| 2026-03-31 | – | Scope label "Add RM5 STMS & UTU" (ticket keys not in the folder name) | – | – | regression folder `20260331 - 31st Mar 2026 (Add RM5 STMS & UTU)` `[from SharePoint library listing 2026-10-16]` |
| 2026-04-01 | ETA test | EAINT-9820 [eAuto-Production] Patch 4 SSM Documents | – | Faizuddin (Jira QA) | `[from appraisal proof pack 2026-10-15 §A]` |
| 2026-05-06 | S29.1-20260506 | EAINT-3090 [eAuto-UCD] Payment Breakdown Reports BMK/TH/eLKM/eVOC | – | Faizuddin | `[from appraisal proof pack 2026-10-15 §A]` |
| 2026-05-13 | S29.X-20260513 | EAINT-8606 [eAuto][Insurance] Onboard Zurich Takaful (3 md); EAINT-8608 [Secarang][Insurance] Onboard Zurich Takaful (15 md) | – | Faizuddin; status "Testing In 1st Env" on 2026-10-15 | `[from appraisal proof pack 2026-10-15 §A]` |
| 2026-06-03 | S30.1-20260603 | EAINT-11558 [eAuto-BackOffice] Transaction restriction status, 334 UCDs | – | Faizuddin | `[from appraisal proof pack 2026-10-15 §A]` |
| 2026-06-30 | S30.9-20260630 | EAINT-8669 MacroKiosk Business Messaging; EAINT-9064 [Secarang] MacroKiosk successful-payment message | – | Faizuddin | `[from appraisal proof pack 2026-10-15 §A]`; regression folder label "(MacroKiosk + Recon + Adhoc)" `[from SharePoint library listing 2026-10-16]` |
| 2026-07-08 night | S31.2-20260708 | EAINT-10164 "UCD Group" label; EAINT-11763 Application & Registration Document enhancement. The night held 8 items, among them EAINT-5972, 10164, 11731, 11763, 11835, 11857, 11877, 11887 | – | Faizuddin | `[from appraisal proof pack 2026-10-15 §A]` `[from Teams eAuto & Secarang Main Group, 2026-07-08 15:51, Yi Link Lim]` |
| 2026-07-24 | S31.8 | EAINT-11934 CIBO Payment Report UCD Name column (Transaction Listing half cut → EAINT-12058) | – | Maisarah | `[from knowledge/cibo.md, Chee Mei Jia Jira comment 2026-07-26]` |
| 2026-07-27 (regression 2026-07-28) | S31.9-20260727 | EAINT-10960 Shopping Cart – Software Installation (7 md); Shopping Cart Phase 1 (SI & BDP, parent EAINT-11880) | – | Faizuddin; Charmain (BDP issues 2026-07-27) | `[from appraisal proof pack 2026-10-15 §A]` regression folder `20260728 - 28th July 2026 Deployment (eAuto Shopping Cart & Payment Report ...)`; `[from study EAINT-12095-study.md]` |
| 2026-08-03 morning | S32.1-20260803 | EAINT-11855 [eAuto-APT] Auto Reset Payment on RHB Payment Error (APT auto reset on RHB RE); EAINT-11977 and 2 more | – | Faizuddin | `[from appraisal proof pack 2026-10-15 §A]` `[from Teams eAuto & Secarang Main Group, 2026-07-31 17:56, Yi Link Lim]` |
| 2026-08-06 | (patch) | EAINT-12130 | – | – | `[from Teams EAINT-12130, 2026-08-06 14:26, Jin Siang Boo]` |
| 2026-08-07 | S32.3-20260807 | EAINT-11878 [eAuto & Secarang] JPJ Rejected WhatsApp notification; with EAINT-11540, 4459, 12110, 12111 | – | Faizuddin | `[from appraisal proof pack 2026-10-15 §A]` `[from Teams eAuto QAs, 2026-08-10 09:15, Faizuddin huddle agenda]` |
| 2026-08-11 | (Secarang hotfix) | EAINT-12175 REQ-001–005 Lonpac name + SDPA link on Secarang pages | – | not named | `[from SRD EAINT-12175 v1.1 §1.3, v0.2 row]` |
| 2026-08-17 night | S32.7-20260817 | EAINT-12058 [CIBO-Transaction Listing] UCD Full Name & Login ID columns (1 md); the night held 5 items incl. EAINT-11952 `[from Teams eAuto & Secarang Main Group, 2026-08-17 16:33, Yi Link Lim]` | – | Faizuddin; regression folder `20260817 - 17th August 2026 Deployment` (12058, STMS, eSTM) | `[from appraisal proof pack 2026-10-15 §A]` |
| 2026-08-20 morning | S32.8-20260820 | EAINT-11864 [eAuto-Insurance] Quotation reminder email (2.5 md); EAINT-12054 and others. Same day: EAINT-12219 (patched) and EAINT-12215 (no QA) | – | Faizuddin | `[from appraisal proof pack 2026-10-15 §A]` `[from memory eaint-11864-automation-status.md]` `[from Teams eAuto & Secarang Main Group, 2026-08-19 18:23, Yi Link Lim]` |
| 2026-09-08 | (hot patch) | EAINT-12180, after Ops approval | – | – | `[from Teams EAINT-12180, 2026-09-08 09:26, Yi Link Lim]` |
| 2026-09-10 morning | – | EAINT-12155 and EAINT-12171 ("Latest prod + EAINT-12155 + EAINT-12171") | – | – | `[from Teams EAINT-12155, 2026-09-09 17:04, Goh Kai Jiaeh]` |
| 2026-09-10 (planned, pulled) | – | EAINT-9306 was pulled from the 9/10 deployment to ship with the perakuan popup ("Method 2") | staging/uat1 | Faizuddin | `[from handoff 2026-09-17 EAINT-9306, 2026-09-10 §1]` |
| 2026-09-15 morning | S33.6-20260915 | EAINT-9306 eDereg Pre-Check compulsory step incl. SRD V1.2 perakuan declaration (8 md) | staging/uat1 (signed off 2026-09-14 18:20) | Faizuddin; "deployment is done" Goh Kai Jiaeh 08:38; regression posted 09:08; folder `20260915 - 15th September Morning Deployment` | `[from knowledge/flow-edereg.md §44]` `[from appraisal proof pack 2026-10-15 §A]` `[from Teams EAINT-9306]` |
| 2026-09-17 night | – | EAINT-12289 (APT price change and failed-payment reset) | – | – | `[from Teams EAINT-12289, 2026-09-17 11:17, Amirul Azfar]` |
| 2026-09-21 morning | S33.8-20260921 | EAINT-11996, 12095, 12103, 12104 (Biometric Device Purchase QA-Issues under 11880; 0.9 md) | /uat1 per Teams (tickets said staging/sit2 / Production) | Faizuddin; "21st Sept Morning Deployment - Faiz" | `[from Teams, 2026-09-16 16:25, May Chin Mei Theng]` via EAINT-12095-study.md; `[from appraisal proof pack 2026-10-15 §A]` |
| 2026-09-23 morning | (uat1 staging deploy, not prod) | EAINT-12166 build to uat1 after "senior to help deploy one repo and run sql" | staging/uat1 | Faizuddin | `[from Teams, 2026-09-22 17:05, Lim Xiwei]` via `knowledge/flow-device-purchase.md` |
| 2026-09-28 09:00 | S33.11-20260928 | EAINT-12166 DO creation for Device Purchase (4 md); EAINT-12167 Device SN input on Arranged (2 md) | staging/uat1 | Faizuddin; regression folder `20260928 - 28th September Morning Deployment Items/20260928 - 0900AM` (BO + UCD) | `[from appraisal proof pack 2026-10-15 §A]` `[from Teams, 2026-09-24 10:42, Charmain]` via flow-device-purchase.md |
| 2026-09-30 morning | S33.12-20260930 | EAINT-12151 [CIBO-Transaction Mgmt] date fields + Insurance Creation Date filter (1.5 md) | cibo/staging | Faizuddin; regression folder `20260930 - 30th September Morning Deployment Items` (12151 + CIBO Regression) | `[from Teams, 2026-09-24 12:03, Yi Link Lim]` via handoff 2026-09-28 EAINT-12151; `[from appraisal proof pack 2026-10-15 §A]` |
| 2026-10-01 morning | – | EAINT-11759 (Secarang MessageBird / Macrokiosk split) | – | – | `[from Teams EAINT-11759, 2026-09-17 22:53, Charmain Ea Chiang]` |
| 2026-10-01 night | – | EAINT-12403 STMS/APT service charge increase (effective 01.10.2026); regression folder `20261001 - LKM Refund + STMS APT Increase Service Charge` | – | – | `[from Teams eAuto QAs, 2026-09-28 09:31, Charmain Ea Chiang]` `[from SharePoint library listing 2026-10-16]` |
| 2026-10-02 morning | S34.X-20261002 | EAINT-12175 eAuto part (REQ-012–015 Lonpac Insurance Bhd filter/table); deployed 08:36 by KJ (supersedes the earlier `[unconfirmed]` on whether it shipped that date) | unassigned at 2026-09-25 | not named | `[from NOTES.md EAINT-12175]` `[from Teams EAINT-12175]` |
| 2026-10-05 night (ezAuto 23:30) | S34.4-20261005 | EAINT-12339 JomCheck Gateway API v1.9 → v2.0 (3 md); KJ hotfix 2026-10-06 for invalid JomCheck API result | Staging / uat1 (TS27 reports uat1 2026-10-01) | Faizuddin; "all the other passed" except TS34 (2026-10-05 17:12); Azila reviewed TS | `[from study EAINT-12339-study.html]` `[from handoff 2026-10-05 EAINT-12339]` `[from Teams via memory digest, 2026-10-14]` |
| 2026-10-07 AM | – | EAINT-12341 approved-application emails to UCD + RHB Support (Ops confirmed emails received) | – | – | `[from Teams via memory digest, 2026-10-14]` |
| 2026-10-07 | – | /obs released | – | – | `[from Teams via memory digest]` |
| 2026-10-08 AM | – | EAINT-12430 LKM Refund Amount column | staging/uat1 | May Chin | `[from Teams via memory digest, 2026-10-14]` `[from Teams EAINT-12431, 2026-10-08 09:23, May Chin]` |
| 2026-10-09 | – | EAINT-12414 Pre-Application reload / failed-card fix + EAINT-12461 | staging/obs (scoped) | dev-tested, no QA | `[from Teams via memory digest, 2026-10-14]` `[from EAINT-12414-teams-thread-2026-09-30.md]` |
| 2026-10-12 night | – | EAINT-12119 logistics interstate price tier (Wholesale) + EAINT-12462 + serbasentral cert renewal; Google routing API swapped on prod key 2026-10-13 | – | – | `[from Teams via memory digest, 2026-10-14]` `[from Teams EAINT-12119, 2026-10-09 14:34, Mei Jia Chee]` |
| 2026-10-14 night | – | EAINT-12022 Insurance Cancellation (319/319 before deploy); prod issue 2026-10-15 02:26 patched | staging/preprod1 | Azfar (night), Azila (morning) | `[from Teams via memory digest, 2026-10-14/15]` |
| 2026-10-15 AM | TBC | (unnamed) | – | – | `[from Teams via memory digest, 2026-10-14]` |
| 2026-10-20 AM | (Jira version 13828) | Not named in the plan post | – | – | `[from Teams eAuto Secarang Main Group, 2026-10-22 11:47, Mei Jia Chee]` "Completed ... 20.10.2026 (Tues) - Morning Session [13828]" |
| 2026-10-20 night (moved from 19 Oct night) | S34.X-20261019 (Jira version 13980) | EAINT-8622 Old BRN → New BRN for JPJ Enquiry (2 md) | staging/uat3 (JPJ Staging from 2026-10-15) | Charmain | `[from Teams via memory digest, 2026-10-14]` `[from appraisal proof pack 2026-10-15 §A]`; move: `[from Teams eAuto Secarang Main Group, 2026-10-19 20:24, Yi Link Lim]` "we will reschedule this deployment tentatively by tomorrow ya."; done: `[same chat, 2026-10-22 11:47, Mei Jia Chee]` "Completed 19.10.2026 (Mon) 20.10.2026 (Tues) - Night Session [13980]" |
| 2026-10-21 AM | (Jira version 14111) | EAINT-12107 Secarang ShopeePay/GrabPay (1+1 md); EAINT-12327 CIBO Payment Mode column (with 12107); EAINT-12412 JomCheck invoice split (1+1 md) | 12107 staging up 2026-09-07/09 | Faizuddin; morning slot agreed (Kasheng Liew 2026-10-07 12:55; Sia Zhong Tai 2026-10-12 16:37) | `[from Teams via memory digest, 2026-10-15]` `[from NOTES.md EAINT-12107, EAINT-12327, EAINT-12412]`; session done: `[from Teams eAuto Secarang Main Group, 2026-10-22 11:47, Mei Jia Chee]` "Completed 21.10.2026 (Wed) - Morning Session [14111]"; tickets deployed and closed 2026-10-21 `[from memory current-active-tickets-2026-09-15.md, updated 2026-10-21]` |
| 2026-10-21 ~14:15 (accidental) | – | EAINT-12525 LKM Refund video, deployed to prod by accident; closed as is | – | – | `[from Teams EAINT-12525, 2026-10-22 15:44, Mei Jia Chee]` "this ticket has been accidentally deployed to prod on 21.10.2026 around 2.15pm yaaa. closed case for this ticket as of now" |
| 2026-10-21 night (cancelled) | – | EAINT-12578 | – | – | `[from Teams eAuto Secarang Main Group, 2026-10-21 20:04, Mei Jia Chee]` "tonight deployment cancelled ya" (ticket key from `_teams-sweep-2026-10-26.md` §B item 8) |
| 2026-10-23 AM (new session) | (Jira version 14124) | EAINT-12549; EAINT-12579; EAINT-12586 STMS Listing "Ins Cancellation Balance %" column | – | Azila ("QA has completed testing with no issues ya", 09:36) | `[from Teams eAuto Secarang Main Group, 2026-10-22 17:34, Yi Link Lim]` "Prod Deployment Session dd: 23.10.2026 (Friday) ... Deployment Item (Total 3 items)"; `[same chat, 2026-10-23 08:35, Jin Siang Boo]` "deployment done ya" |
| 2026-10-26 AM | S34.15-20261026 🌞 (Jira version 14110) | EAINT-12431 LKM Refund WhatsApp to car owner, Part 1 (WhatsApp only; email waits for bizsupport@eauto.my); EAINT-12589 Ins Cancellation Balance % on listings/export (bug, no QA). Jira on 2026-10-26: 12431 "Ready for Prod Deployment", 12589 "Done" | staging/uat4 | Charmain (12431, prod regression done); none for 12589 | `[from Teams eAuto Secarang Main Group, 2026-10-23 18:18, Yi Link Lim]` "Dev 1. KJ QA 1. Charmain Deployment Item (Total 1 item) 1. EAINT-12431"; `[from Teams DM Charmain Ea Chiang, 2026-10-26 09:37]` "no QA needed for 12589 ya"; `[from study EAINT-12431-study.md §1]` `[from study EAINT-12589-study.md §1]` Miro column "26TH OCT DEPLOYMENT" |
| 2026-10-27 AM (moved from 28 Oct) | S34.16-20261027🌞 (Jira version 14033) | EAINT-10108 STMS Perakuan Step 1 & 3 wording. Jira "Ready for Prod Deployment" (2026-10-23) | staging/uat3 | Charmain (5/5 done 2026-10-23) | `[from Teams eAuto Secarang Main Group, 2026-10-22 11:47, Mei Jia Chee]` "Rescheduled 28.10.2026 (Wed) 27.10.2026 (Tues) - Morning Session [14033]"; `[from Teams eAuto Secarang Main Group, 2026-10-26 10:20, Charmain Ea Chiang]` "We are ready for 27 Oct (Tuesday) morning deployment."; `[from study EAINT-10108-study.md §1]` Miro "27TH OCT DEPLOYMENT" |
| 2026-10-28 AM (new session, planned) | S34.17-20261028🌞 (Jira version 14029, mapping `[unconfirmed]`) | EAINT-12253 Firefox→Chrome browser reminder at last step. Jira "Testing In 1st Env" (2026-10-21) | staging/uat1 | Azfar (36/36 PASS 2026-10-23); Miro card says "QA: May" | `[from Teams EAINT-12180, 2026-10-20 14:25, Mei Jia Chee]` "we planning to deploy on 28.10.2026 (Wed)"; `[from Teams eAuto QAs, 2026-10-26 09:35, Faizuddin]` "Ready for prod deployment"; `[from study EAINT-12253-study.md §1]` Miro "28TH OCT DEPLOYMENT" |
| 2026-10-29 AM (new session, planned) | S34.1X-20261029🌞 (Jira version 14032) | EAINT-12153 B2B payment channel; EAINT-12257 DuitNow QR. Jira both "Testing In 1st Env" (2026-10-26). Test-complete deadline EOD 28 Oct | staging/obs (12257 QA-Issues say "staging/eauto") | Faizuddin; 12153 6/12, 12257 3/13 on 2026-10-26 | `[from Teams eAuto QAs, 2026-10-22 10:29, Charmain Ea Chiang]` "we are targeting 29 Oct for the deployment of both EAINT-12153 and EAINT-12257 ya."; `[from Teams eAuto Secarang Main Group, 2026-10-22 11:47, Mei Jia Chee]` "NEW!!! 29.10.2026 (Thurs) - Morning Session [14032]"; `[from study EAINT-12153-study.md §1]` `[from study EAINT-12257-study.md §1]` |
| 2026-11-02 (fix version only) | S35.X-20261102 🌞/🌚 | EAINT-12121 SSM remove 7-day validation; EAINT-12230 SSM duplicate purchase validation (tested together, 7+2 md). Jira both "Code Review". Miro "READY FOR TESTING TICKETS", no date; QA said 28 Oct not possible | not stated | Azfar (Jira QA); Miro "QA:" blank | `[from study EAINT-12121-study.md Header]` `[from study EAINT-12230-study.md Header]` `[from Teams eAuto QAs, 2026-10-20 14:14, Amirul Azfar]` "I dont think can deploy on 28th Oct Morning" |
| 2026-11-03 (Miro only) | Jira "[QA]Ready for Testing Tickets" (was S34.X-20261026🌞 until 2026-10-19) | EAINT-12088 Public holidays via Google Calendar. Jira "Code Review" | not stated | Charmain (Jira QA, set 2026-10-19); Miro "QA:" blank | `[from study EAINT-12088-study.md §1]` Miro "3RD NOV DEPLOYMENT"; `[from EAINT-12088-jira-comments.md changelog item 9]` |
| 2026-11-05 AM (planned) | S35.X-20261105 🌞 ("Main item(s): 1. Inventory Control Phase 1") | EAINT-12099 Shopping Cart Inventory Control, split 2026-10-26; leftovers → EAINT-12635 (Phase 2). Jira "REQ REVIEW IN PROGRESS - EAUTO" | not stated | Charmain drafting scope (Teams); Jira QA empty | `[from study EAINT-12099-study.md §1]` Miro "5TH NOV DEPLOYMENT"; fix version set 2026-10-26 10:34 `[from EAINT-12099-jira-comments.md changelog item 8]`; `[from Teams EAINT-12099 group, 2026-10-26 10:16, Mei Jia Chee]` |
| 2026-11-26 AM (planned; Miro: SIT, UAT and target all "TBC") | S35.X-20261126 🌞 (12028 only) | EAINT-12028 Association Payment Listing (Jira "In Development"); EAINT-11868 reminder emails + reactivation (Jira "Code Review", fix version "[QA]Ready for Testing Tickets"); EAINT-12348 PBT as eDereg users (Jira "REQ REVIEW IN PROGRESS - EAUTO", no fix version; Jira ETA for Testing 2026-10-27); EAINT-12019 eMOVE (Jira "REQ REFINEMENT IN PROGRESS -EAUTO", no fix version) | 11868: staging/uat1 (Miro); others not stated | 12028 Faizuddin; 11868 Azila (Jira); 12348, 12019 none | Miro column "26TH NOV DEPLOYMENT (SIT Testing: TBC, UAT Testing: TBC, Target Deployment: TBC)" `[from _miro-board-capture-2026-10-26.md]`; `[from study EAINT-12028-study.md §1]` (Exp. Deploy Date 26/Nov/26 set 2026-10-19) `[from study EAINT-11868-study.md §1]` `[from study EAINT-12348-study.md §1]` `[from study EAINT-12019-study.md §1]` |
| Not scheduled (Miro "READY FOR TESTING TICKETS") | Jira "[QA]Ready for Testing Tickets" (bucket, release date 2026-11-02) | EAINT-8767 Insurance Quotation Expired cron (In Development); EAINT-12087 SI slot auto-expire (Code Review); EAINT-12123 SR reference suffix (Code Review); EAINT-12124 BDP email CC Support (Code Review) | not stated | 8767, 12123, 12124: Jira QA empty; 12087: Charmain (Jira) | `[from study EAINT-8767-study.md §1]` `[from study EAINT-12087-study.md Header]` `[from study EAINT-12123-study.md Header]` `[from study EAINT-12124-study.md Header]` |
| Not scheduled (Miro "PACKAGE - ENFORCE 12-CHAR PASSWORD") | Jira "[QA]Ready for Testing Tickets" | EAINT-12125 12-char password, existing users (In Development); EAINT-12228 Forgot Password link (In Development); EAINT-12299 Chinese-character filenames (Code Review); EAINT-12333 Invoice for Proforma Invoice (Code Review) | not stated | Jira QA empty on all four | `[from study EAINT-12125-study.md §1]` `[from study EAINT-12228-study.md §1]` `[from study EAINT-12299-study.md §1]` `[from study EAINT-12333-study.md §1]` |
| Not scheduled (Miro "TBC") | none | EAINT-11179 LKM/IC add-on Step 5→4 (To Do; Miro "TBC (pending requirement)"); EAINT-12580 IC split watermark bug (Ready in 1st Env; Miro "TBC"); LKM Refund Phase 2 (no Jira key found; Miro "TBC (update by 8/10/2026)") | 12580: /preprod1 (Miro) | 11179 Charmain (Jira); 12580 Azfar (Jira) / Azila (Miro); Phase 2 "Charmain / Azila" (Miro) | `[from study EAINT-11179-study.md §1]` `[from study EAINT-12580-study.md §1]` `[from study LKM-Refund-Phase-2-study.md §1]` |
| Not scheduled | – | EAINT-12442 CIBO Referred Risk Log (deploy without QA agreed, night slot); EAINT-12329 LKM refund notifications Part 2 (no update in the 16–26 Oct sweep) | – | – | `[from Teams via memory digest, 2026-10-14]` |

## Notes

1. Deployment windows are "morning" (AM) or "night"; a change that touches
   serbasentral needs the night slot (EAINT-12442 case). `[from Teams via memory digest, 2026-10-14]`
2. Count check: 15 production releases with Faizuddin's tickets from May to
   October 2026 (05-06, 05-13, 06-03, 06-30, 07-08, 07-27, 08-03, 08-07, 08-17,
   08-20, 09-15, 09-21, 09-28, 09-30, 10-05). `[from appraisal proof pack 2026-10-15 §A]`
3. Environment map at 2026-10-15: staging/uat1 → Wei Ting (wholesale, swapped with
   sit2); uat2 inactive; staging/uat3 → EAINT-8622 (JPJ Staging); staging/preprod1 →
   Insurance Cancellation; staging/obs → onboarding; cibo/staging → CIBO tickets.
   `[from Teams via memory digest, 2026-10-14/15]` `[from handoff 2026-09-28 EAINT-12151]` `[from EAINT-12414-teams-thread-2026-09-30.md]`
4. **Full production deployment history** is the folder list in SharePoint
   `eAuto - Test Evidence/3. Production Regression/`: 96 dated folders (960
   files), one per production deployment or patch, from "20250519 - 19th May 2025
   Deployment (Pre e-Invoice)" to "20261014 - 14th October Night Deployment
   Items". Older folders are named `YYYYMMDD - <date> Deployment (<scope>)`;
   from mid-2026 they switch to "<date> Morning/Night Deployment Items". Scope
   labels seen include "(eDereg Prechecking)", "(BMK e-Invoice)", "(Bypass SSM)",
   "(e-Invoice)", "(Database and Tomcat …)", "(XStar)", "(Applet New Cert)",
   "(JPJ Official …)", "(JomCheck API Update)", "(Add RM5 STMS & UTU)", "(SSM LLP +
   XML Log + SST)", "(MacroKiosk + Recon + Adhoc)", "(Wholesale 2.0 …)", "LKM Refund
   + STMS APT Increase Service Charge". The table above covers only dates some
   other source names; the folder list is the place to look for any date before
   2026-03-31. List source: `_reference/sharepoint/library-listing-2026-10-16.json`,
   folder `prodReg`; summary in `business-rules-from-test-scenarios.md` §17.
   `[from SharePoint library listing 2026-10-16]`

## Jira release naming and the dashboard calendar

1. Session marker in the fix-version name: 🌞 = morning, 🌚 = night. A release
   can carry both, e.g. `S35.X-20261102 🌞/🌚` (2026-11-02). Spacing before the
   marker varies (`S34.15-20261026 🌞` vs `S34.16-20261027🌞`).
   `[verified: Jira EAINT versions API via /api/jira/deploy-calendar, 2026-10-26]`
2. Holding versions also carry release dates but are not deployments: "Old
   Pending Listing", "Latest Pending Listing", "Wholesale - Pending Listing",
   "[QA]Ready for Testing Tickets", "To Pick Up", "Minor Tickets 1.0", "To deploy
   during Aug 2026". The dashboard calendar keeps only names starting `S<digits>`
   or carrying a session marker. `[verified: same call, 2026-10-26]`
3. `/calendar` shows one entry per ticket per release (layer "Jira deployments"),
   read from `/api/jira/deploy-calendar`; code in `lib/jiraDeployCalendar.ts`.
   `[from session 2026-10-26, Faizuddin request]`
