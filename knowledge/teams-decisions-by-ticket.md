# Teams decisions by ticket

Decisions and rules from the Microsoft Teams CR groups, up to 2026-10-26. The file holds only what `knowledge/cr-ledger.md` lacks:
1. Part A covers tickets that have no section in cr-ledger.
2. Part B adds Teams-only facts to tickets that do.
3. Part C holds the deployment-schedule changes of 16–26 Oct 2026, which span several tickets.

Raw chats are in `_reference/teams/EAINT-<key>-*.md` (to 2026-10-15). Messages from 2026-10-16 to 2026-10-26 10:50 MYT are in `_reference/tickets/Studying/<KEY>/<KEY>-teams-since-2026-10-16.md` and `_reference/tickets/Studying/_teams-sweep-2026-10-26.md`. Items dated 16–26 Oct below come from those files.

Tag format: `[from Teams <chat>, <YYYY-MM-DD HH:MM>, <person>]`. Every chat is the CR group named after the key unless the tag says otherwise. Quotes are verbatim. Rules that name a staging branch record what was used for that ticket only; they are not general rules.

## Part A: tickets with no cr-ledger section

### EAINT-8622: New BRN for JPJ (12-digit BRN)
1. Dev Lim Xiwei (Tracey). Assigned by Tan Yi Fung on 2026-08-06.
2. Dev must wait for QA's go-ahead before deploying to any staging.
   `[from Teams EAINT-8622, 2026-08-12 08:32, Charmain Ea Chiang]` "Please wait for our green light before deploying the changes to any staging environment"
3. Testing runs directly against JPJ staging; UAT with JPJ is 13–16 Oct 2026.
   `[from Teams EAINT-8622, 2026-08-19, Charmain Ea Chiang]` (estimate 2 days = 1 base + 1 buffer)
   `[from Teams EAINT-8622, 2026-09-10, Yi Link Lim]`
4. The test script was shared with JPJ on request. `[from Teams EAINT-8622, 2026-08-06, Mei Jia Chee]`
5. JPJ (HTP) let testing go on despite blockers.
   `[from Teams EAINT-8622, 2026-10-14 13:51, Mei Jia Chee]` HTP replied "Just proceed with the testing first. We'll review what has been submitted later."
6. JPJ error codes seen in SIT:
   1. VEL000001E: invalid vehicle no.
   2. VEL000008E: owner does not match.
   3. VEL000045E: contact helpdesk.
   `[from Teams EAINT-8622, 2026-10-15, Faizuddin]`
7. SIT test companies (old BRN / new BRN):
   1. UCD TEST SDN BHD 1100676: 002606822-A / 201703006321.
   2. AATF SDN BHD 4020001: 002606833-A / 201703006331.
   `[from Teams EAINT-8622, 2026-10-15 15:08–15:15, Faizuddin]`

### EAINT-11540: IC number validation
1. eAuto had no IC validation before this ticket. It now follows Secarang and validates the month and day only.
   `[from Teams EAINT-11540, 2026-08-05 10:49, Batrisyia]` "We'll follow Secarang's behavior, validate month and day only. Error wording: Invalid IC Number"
2. QA Maisarah. Deployed on 2026-08-07, with prod regression the same morning. `[from Teams EAINT-11540, 2026-08-07 09:06, Maisarah]`

### EAINT-11978: Showroom address and ownership edit
1. When a user switches from "own/shared showroom" to "no showroom":
   1. Showroom Address, Postcode, State and City are hidden.
   2. The 4 showroom pictures and the 20-second video are disabled.
   3. Switching back shows all five fields again, and they can be edited.
   The BO view follows the existing Application v1.0 UCD behaviour. `[from Teams EAINT-11978, 2026-07-31 11:51, Yi Link Lim]`
2. Dev keeps the build local until QA names a staging branch. `[from Teams EAINT-11978, 2026-08-03 12:08, Yi Link Lim]`
3. QA Faizuddin signed off on 2026-08-12 for the 13 Aug morning deploy. `[from Teams EAINT-11978, 2026-08-12 16:55, Faizuddin]`

### EAINT-12341 / EAINT-12461: application approval emails
1. Prod checks:
   `[from Teams EAINT-12341, 2026-10-06 16:28, Azila]` "(1) RHB Support email To = BIS.Support@rhbgroup.com (2) CC apply@eauto.my on both emails (3) Application Link uses the prod site"
2. Approving an application sends 3 emails: 2 from EAINT-12341 and 1 from EAINT-12461.
   EAINT-12461 shipped on 2026-10-09 without QA. `[from Teams EAINT-12341, 2026-10-09 15:03, Yi Link Lim]` "QA side not required to do testing for this ticket."

### EAINT-11759: Secarang MessageBird / Macrokiosk split
1. Recipients in Secarang. Ket Ming's number receives none of the three.
   `[from Teams EAINT-11759, 2026-09-14 10:05, Batrisyia]` "1. Payment success - Confirmed: Only send to User / 2. Cover note failed - Confirmed: Only send to Shamini / 3. JPJ rejected - Confirmed: Only send to Shamini"
2. The ticket covers the Secarang flow only. The same change for eAuto Insurance WhatsApp messages needs a separate ticket. `[from Teams EAINT-11759, 2026-09-14 11:34, Batrisyia]` "I will create another ticket for this fix ya"
3. The email part of the Macrokiosk Payment Successful message is removed. `[from Teams EAINT-11759, 2026-09-14 11:51, Batrisyia]` "yup"
4. Do not ask for a Macrokiosk staging-access extension until the deploy date is fixed; check for extra fees first. `[from Teams EAINT-11759, 2026-08-14 11:07, Charmain Ea Chiang]`
5. Tested on the Secarang/CIBO staging. Signed off 2026-09-17 22:53 for the 1 Oct morning deploy. `[from Teams EAINT-11759, 2026-09-17 22:53, Charmain Ea Chiang]`

### EAINT-11878: JPJ Rejected WhatsApp when Lonpac returns cover note and JPJ status together
1. Dev Mong Guo Hao. QA estimate: 0.5 + 0.5 = 1 day. `[from Teams EAINT-11878, 2026-08-04 12:31, Faizuddin]`
2. Dev and BA had misunderstood the ticket name; the SRD was corrected. `[from Teams EAINT-11878, 2026-08-04 14:34, Yi Link Lim]`
3. The test covers both eAuto and Secarang, each on its own staging. `[from Teams EAINT-11878, 2026-08-04 17:34, Faizuddin]` Signed off 2026-08-06 for the 7 Aug deploy.

### EAINT-12019: eMOVE standalone logistics
1. Not related to the Wholesale flow. It reuses the existing Wholesale QR and Delivery Order flow and template.
   `[from Teams EAINT-12019, 2026-09-15 14:21, Mei Jia Chee]` "there are no changes on QR and delivery order in this ticket"
2. Dev moved from Nur Izfarwiza to Wei Ting Lim (around 2026-10-11).
3. QA must regress Wholesale DO generation and QR scanning, because the code is shared.
   `[from Teams EAINT-12019, 2026-10-14 16:10, Wei Ting Lim]` "for wholesale part will need to regress, maybe on DO generation + qr scanning"
4. eMOVE payment goes to eAuto Sdn Bhd. Wholesale payment goes to eAuto Digits (EAINT-11884). `[from Teams EAINT-12019, 2026-10-14 18:27, Mei Jia Chee]`
5. SRD v0.7 and v0.8 released. `[from Teams EAINT-12019, 2026-10-20 08:09, Mei Jia Chee]` "srd v0.7 is available yaa." `[same chat, 2026-10-21 10:54, Mei Jia Chee]` "srd v0.8 is available ya"
6. Requirement meeting with Ops set for Friday 23 Oct, 11am. The outcome was not posted in Teams by 2026-10-26.
   `[from Teams EAINT-12019, 2026-10-21 10:54, Mei Jia Chee]` "Wei Ting Lim Tan Yi Fung, will have discussion with Nurul on this coming Friday 11am at Meeting Room 1 ya"
   (The sweep file dates this Friday as 2026-10-24; 2026-10-26 is a Monday, so the Friday is 2026-10-23.)
7. No QA, staging or deploy message in the CR group from 16 to 26 Oct. `[from Teams sweep 2026-10-26, EAINT-12019]`

### EAINT-12054: STMS bulk payment SSM checking
1. Dev Jin Siang Boo; BA Mei Jia. SRD v1.2 accepted on 2026-08-05.
2. Estimate grew from 3 days (2 + 1) to 6 days (5 + 1). `[from Teams eAuto QAs, 2026-08-06 10:16 and 2026-08-07 15:42, Charmain Ea Chiang]`
3. Signed off 2026-08-19 for the 20 Aug morning deploy. `[from Teams EAINT-12054, 2026-08-19 17:50, Charmain Ea Chiang]`

### EAINT-12055: Reconciliation listing excludes resubmission records
1. The deploy does not affect eAuto, so QA can test on any staging at any time. `[from Teams EAINT-12055, 2026-08-05 10:53, Yi Link Lim]`
2. Ops dropped the new Nota (JPJ summary note) requests. QA tests against the current eautocron.
   `[from Teams EAINT-12055, 2026-08-14 17:37, Yi Link Lim]` `[same chat, 2026-08-14 17:58, Azila]` "So meaning QA will proceed to test using current eautocron version ya"
3. Rules:
   1. The summary report syncs only the latest version (v3 of v1/v2/v3).
   2. A hidden mismatch stays hidden permanently.
   `[from Teams EAINT-12055, 2026-08-14 15:01, Azila]`
4. Follow-up backend fix EAINT-12215 shipped without QA. Ops confirmed it works for existing and new records.
   `[from Teams EAINT-12055, 2026-08-19 12:57, Yi Link Lim]` "QA is not required for testing for this fixes" `[same chat, 2026-08-20 16:24, Yi Link Lim]`

### EAINT-12078: Secarang NDDPs for STM
1. Only the group was opened on 2026-08-17; the Figma was still in progress. No QA activity. `[from Teams EAINT-12078, 2026-08-17 14:32, Batrisyia]`
2. The reporter: "STM shared some information here ya" (as an image, not captured) and "need advise that this ticket who will be the dev pick up ya?" — no developer named yet. `[from Teams EAINT-12078, 2026-10-26 15:06, reporter]`

### EAINT-12119: Logistics interstate price tiers (Wholesale)
1. Dev Wei Ting Lim. QA moved from Hui Xin to Lee An Qi on 2026-09-21.
2. To force a failed wholesale payment, use the eAuto simulator's RHB transfer without disturbing other QAs' records.
   `[from Teams EAINT-12119, 2026-09-21 11:14, Wei Ting Lim]` "pls use eauto sim rhb transfer / and be careful not mess up with other QA"
3. Address rules:
   1. Sabah, Sarawak and Labuan are blocked by the state, and also by a coordinate check that runs for every address type except Hub to Hub.
   2. Company addresses use the saved company state.
   `[from Teams EAINT-12119, 2026-09-21 16:32 and 2026-10-05 16:25, Wei Ting Lim]`
4. Maximum rate message: `[from Teams EAINT-12119, 2026-10-01 09:58, Wei Ting Lim]` "'Maximum rate is RM 10,000.00.'"
5. Deployed in a Monday-night session with a maintenance page, because it adds new tables. QA was not needed at the deploy. `[from Teams EAINT-12119, 2026-10-09 14:34, Mei Jia Chee]`
6. **No test script exists** for EAINT-12119. "nope. so assume no test script. i think this was before the automation initiative" `[Faizuddin, dashboard chat to Scribe, 2026-10-27]`
7. **Tier distance ranges (KM)**, SRD v1.3 §2.2.5 REQ-003: "Tier 1 (Base): distance range 0 to 250, suggested base rate 300.00"; "Tier 2 (Standard): distance range 250.001 to 400, suggested base rate 450.00"; "Tier 3 (Extended): distance range 400.001 to 600, suggested base rate 650.00"; "Tier 4 (Premium): distance range 600.001 and above, suggested base rate 1,000.00". Fixed: "Tier names and distance ranges are fixed values and are not configurable by BackOffice users." (§2.1 assumption 2). `[from ticket EAINT-12119, SRD v1.3 text copy in _reference/tickets/Studying/EAINT-12119/, via pipeline EAINT-12019 Scout, 2026-10-27]`

### EAINT-12121 / EAINT-12230: SSM repurchase (7-day validation removed)
1. Rafftech excludes eAuto's account from the 3-hour "008" repeat-purchase check. `[from Teams EAINT-12121, 2026-08-10 10:24, Goh Kai Jiaeh]`
2. A 10-minute cooling period replaces the 7 days.
   `[from Teams EAINT-12121, 2026-08-11 18:01, Yi Link Lim]` "confirmed with Nurul to have 10 min cooling down period. Within this 10 min period, UCD is unable to repurchase this SSM Document."
3. SSM bought in STMS can be bought again in eSTM. `[from Teams EAINT-12121, 2026-08-14 17:07, Yi Link Lim]`
4. Jira status flow for dev: "Code Review", then "Ready in 1st env" once on staging. `[from Teams EAINT-12121, 2026-08-24 09:11, Yi Link Lim]`
5. QA Amirul Azfar estimated 7 + 2 days for both tickets, tested together, and said the 28 Oct morning slot is not possible.
   `[from Teams eAuto QAs, 2026-10-20 14:14, Amirul Azfar]` "the testing estimation for both ticket is ( 7 + 2) days. I dont think can deploy on 28th Oct Morning"
   `[same chat, 2026-10-20 14:14, Amirul Azfar]` "Yup can be test together and i think better to be test together"
6. The CR group was renamed to cover both keys: "EAINT-12121 & EAINT-12230 | 🔴[eAuto-UCD] SSM - Remove 7 Days Validation After First Purchase to Allow SSM Repurchase". `[from Teams EAINT-12121, undated event, Mei Jia Chee]`
7. Status on 2026-10-26 for both: "To continue draft test scenario To continue draft automation script ... Not Ready For Testing". No new deploy date in Teams. `[from Teams eAuto QAs, 2026-10-26 09:24, Amirul Azfar]`

### EAINT-12123: Different reference numbers for multiple records under one Service Request
1. Dev Wong Zhan Choon. SRD v1.1 accepted by Ops on 2026-09-11. `[from Teams EAINT-12123, 2026-09-11 15:58, Batrisyia]`

### EAINT-12124: Service Hub BDP email with CC to Support
1. The Paid Amount row shows the total amount paid; a free installation shows "-".
   `[from Teams EAINT-12124, 2026-09-28 09:34, Kasheng Liew]` "we will show total amount for Paid Amount and just '-' for free installation"
2. Dev complete on 2026-10-05. `[from Teams EAINT-12124, 2026-10-05 10:57, Kasheng Liew]`
3. QA high-level scope and estimate drafted; the figure was not posted in Teams.
   `[from Teams eAuto QAs, 2026-10-22 20:10, Charmain Ea Chiang]` "Drafted high level scope and provide QA testing estimation - Done Overall CR Testing Progress : Not Ready for Testing"

### EAINT-12130 (group first opened as EAINT-12022)
1. Patched to prod on 2026-08-06 after Ops approved; prod check by Aliah. `[from Teams EAINT-12130, 2026-08-06 14:26, Jin Siang Boo]`
2. No other Teams chat exists for EAINT-12022 (STMS Insurance Cancellation).
   The 12022 estimate is in eAuto QAs: 10 + 3 days for 1 QA, or 6 + 2 days for 2 QAs. `[from Teams eAuto QAs]`

### EAINT-12155 / EAINT-12125: 12-character password policy
1. Rules:
   1. 12 to 30 characters, with at least one uppercase letter, one lowercase letter, one number and one special character from the listed set (! @ # $ % ^ & * ( ) _ + - =).
   2. No spaces.
   3. Only the listed special characters count. Reuse is allowed.
   `[from Teams EAINT-12155, 2026-08-11 09:37 and 2026-08-18 14:30, Yi Link Lim]`
2. Scope: all portals (BO, UCD, JPJ, AATF, Bank/Credit, Insurance). `[from Teams EAINT-12155, 2026-08-14 18:33, Yi Link Lim]` "Yes, confirmed with Ops all portals included ya"
3. Split on 2026-08-20: EAINT-12155 covers new users, EAINT-12125 existing users.
   `[from Teams EAINT-12155, 2026-08-21 09:23, Yi Link Lim]` "Existing user - can update password with new password rules, but no forcing them to update before login New user - must create account with new password rules"
4. Copy and paste follow prod behaviour. `[from Teams EAINT-12155, 2026-09-03 17:25, Yi Link Lim]` "If prod allows user to copy paste then we shud allow user to do so with visible & hidden ya"
5. The rule wording follows the mockup. `[same message]` "Follow message in mockup ya"
6. When an admin changes a user's password, the old format is still allowed. The user then sees "Please change your password." on next login. `[from Teams EAINT-12155, 2026-09-07 11:14, Charmain Ea Chiang]`
7. Sub-UCD first login needs "Current Password" and "Confirm Password". The temp password is not pre-filled (security). `[from Teams EAINT-12155, 2026-09-09 09:34, Yi Link Lim]`
8. The eAuto App shares the web DB, so QA does not test the app separately. `[from Teams EAINT-12155, 2026-09-02 11:53, Charmain Ea Chiang]`
9. EAINT-12275 (server does not check that Password and Confirm match) is an existing prod issue. It was parked under EAINT-148. `[from Teams EAINT-12155, 2026-09-04 16:40, Charmain Ea Chiang]`
10. Status:
    1. EAINT-12155 was deployed on 2026-09-10 and checked in prod.
    2. EAINT-12125 moved from Mong to Tracey to Kuik Rui Luan and back to Lim Xiwei. On 2026-10-01 only code review was left, with no deploy date. `[from Teams EAINT-12155, 2026-10-01 16:01, Kuik Rui Luan]`
11. EAINT-12125 was listed On Hold from 16 to 21 Oct, then dropped from the QA's daily status post from 2026-10-22. No reason was stated.
    `[from Teams eAuto QAs, 2026-10-16 08:27 to 2026-10-21 20:30, Siti Nur Azila]` "On Hold EAINT-12125 ... Status :To draft test scenarios and test script once have capacity CR Testing Progress : Not Ready for Testing"

### EAINT-12171: Insurance cron intervals
1. Daily, 8am to 11pm:
   1. Secarang JPJ Status Enquiry and Cover Note: 1 min.
   2. eAuto Cover Note: 5 min.
   3. eAuto JPJ Status Enquiry: 1 min.
   `[from Teams EAINT-12171, 2026-09-02 13:11, Charmain Ea Chiang]`
2. Verified from dev's BE/DB screenshots, not through the UI. `[from Teams EAINT-12171, 2026-09-01 14:24, Charmain Ea Chiang]`

### EAINT-12180 / EAINT-12253: Firefox to Chrome migration notices
1. Split on 2026-09-01: EAINT-12180 is the homepage announcement, EAINT-12253 the browser reminder at the last step of a transaction. `[from Teams EAINT-12180, 2026-09-01 18:09, Yi Link Lim]`
2. The new popup replaces the old Firefox popup. No end date is set. `[from Teams EAINT-12180, 2026-08-28 12:26, Mei Jia Chee]`
3. Reminder scope:
   1. All transaction types listed by dev, plus UCD to UCD (Standard / Interstate) and Derege-Dereg.
   2. Not shown on Update Company Profile (Pre e-Invoice).
   3. The AATF homepage gets the same announcement.
   `[from Teams EAINT-12180, 2026-09-03 09:51 and 16:34, Yi Link Lim]`
4. The footer "Best Compatible With Mozilla Firefox V36.0.4" stays unchanged for now. `[from Teams EAINT-12180, 2026-09-03 16:19, Yi Link Lim]`
5. EAINT-12180 was hot-patched to prod after Ops approved (2026-09-08). EAINT-12253 needs a normal deploy. `[from Teams EAINT-12180, 2026-09-04 15:56, Wong Kar Kin]`
6. EAINT-12253 deploy date set to 28 Oct 2026, morning slot.
   `[from Teams EAINT-12180, 2026-10-20 14:25, Mei Jia Chee]` "we planning to deploy on 28.10.2026 (Wed), wanted to know if this ticket can be morning or must be night deployment?"
   `[same chat, 2026-10-20 17:18, Tan Yi Fung]` "Can be morning"
7. Dev handed to Wong Zhan Choon. `[from Teams EAINT-12180, 2026-10-20 17:11, Tan Yi Fung]` "Wong Zhan Choon, i merging prod/master into dev/feat/EAINT-12253, help to take over this"
8. QA Amirul Azfar estimated 3 + 2 days and confirmed the 28 Oct date. `[from Teams eAuto QAs, 2026-10-20 16:32, Amirul Azfar]` "the testing estimation for this ticket is (3 +2) days. Can be deploy on 28th Oct ya"
9. Test branch staging/uat1. The QA first proposed uat3; the QA lead pointed to uat1 and asked for a prod merge-down before testing.
   `[from Teams eAuto QAs, 2026-10-21 10:15, May Chin Mei Theng]` "by right /uat1 should be the latest code base" / "but i think regardless, all staging branch need to merge down the latest codebase first"
   `[from Teams EAINT-12180, 2026-10-21 10:21, Amirul Azfar]` "Can use /uat1 for this ticket ya" `[same chat, 2026-10-21 10:33, Wong Zhan Choon]` "Already done ya merged to staging/uat1"
10. The uat1 prod sync kept the ticket. `[from Teams eAuto Deployment Notification, 2026-10-22 07:47, Workflows card]` "conflicts in the JPJ new-BRN handlers resolved to prod's version; EAINT-12253 kept"
11. QA complete: 36/36. The TS count went from 38 to 36 between 21 and 22 Oct.
    `[from Teams eAuto QAs, 2026-10-23 19:30, Amirul Azfar]` "Completed testing on staging/uat1 To review all the test evidence Overall CR Testing Progress : (36/36) 100% PASS only"
12. Open at 2026-10-26: "To follow up with SA on existing issue on APT" `[from Teams eAuto QAs, 2026-10-22 18:40, Amirul Azfar]`. No outcome posted.
13. Related Jira outcome (not Teams): QA-Issue EAINT-12574 (popup shows again after F5) was closed by the BA.
    `[from Jira EAINT-12574 comment 57942, 2026-10-21 12:23, Lim Yi Link]` "This ticket can be closed as we can remain existing behaviour in staging."

### EAINT-12219: RHB Offer Letter sample replaced
1. Same-day high-priority ticket: QA verified it through Mailtrap on any staging, and it was deployed with no downtime on 2026-08-20. `[from Teams EAINT-12219, 2026-08-20 15:13 and 17:13, Goh Kai Jiaeh]`

### EAINT-12228: Forgot Password link
1. Scope includes AATF (same flow as Main UCD) and sub AATF (same flow as sub UCD). `[from Teams EAINT-12228, 2026-09-15 15:35, Yi Link Lim]`
2. The confirmation email is sent only after the new password is saved successfully. `[from Teams EAINT-12228, 2026-09-15 15:51, Yi Link Lim]`
3. Dev moved from Izfarwiza to Kuik Rui Luan to Lim Xiwei. On 2026-10-01 only code review was left, with no deploy date. `[from Teams EAINT-12228, 2026-10-01 16:04, Kuik Rui Luan]`
4. Listed On Hold from 16 to 21 Oct, then dropped from the QA's daily status post from 2026-10-22. No reason was stated.
   `[from Teams eAuto QAs, 2026-10-16 08:27 to 2026-10-21 20:30, Siti Nur Azila]` "On Hold EAINT-12228 ... Status :To draft test scenarios and test script once have capacity CR Testing Progress : Not Ready for Testing"

### EAINT-12333: Proforma invoice module
1. Dev Jin Siang Boo. Dev and code review were done by 2026-10-01; not urgent, with no deploy date. `[from Teams EAINT-12333, 2026-09-29 11:45 and 2026-10-01 16:28, Jin Siang Boo]`
2. QA high-level scope and estimate drafted; the figure was not posted in Teams.
   `[from Teams eAuto QAs, 2026-10-22 20:10, Charmain Ea Chiang]` "Drafted high level scope and provide QA testing estimation - Done Overall CR Testing Progress : Not Ready for Testing"

### EAINT-12289: APT price change and failed-payment reset
1. The new price affects every staging branch once it is applied. `[from Teams EAINT-12289, 2026-09-08 12:15, Jin Siang Boo]`
2. The reset covers only records where both Payment and Transaction Status are Failed; failed JPJ submissions are not reset.
   `[from Teams EAINT-12289, 2026-09-10 14:16, Jin Siang Boo]` "Transaction Status and Payment both Failed"
3. The reset calls the API with a logged-in user, so the prod deploy uses Izni's account. It runs during the deploy and takes about 15 minutes. `[from Teams EAINT-12289, 2026-09-10 14:21 and 15:35, Jin Siang Boo]`
4. Every staging branch runs the APT payment cron. On the test branch it was set to every 30 min, 8am–11pm. `[from Teams EAINT-12289, 2026-09-11 17:51, Jin Siang Boo]`
5. QA estimate 3.5 days (2.5 + 1). Signed off for the 17 Sep night deploy. `[from Teams EAINT-12289, 2026-09-07 18:00 and 2026-09-17 11:17, Amirul Azfar]`

### EAINT-12403: STMS and APT service charge increase (effective 01.10.2026)
1. Same pattern as EAINT-12289. STMS includes UCD to UCD (Standard & Interstate) and all categories. `[from Teams EAINT-12403, 2026-09-24 12:11–12:24, Jin Siang Boo / Mei Jia Chee]`
2. Failed payments are reset manually through BackOffice with Izni's account, not by the system.
   `[from Teams EAINT-12403, 2026-09-24 12:25, Mei Jia Chee]` "manual way as what we doing previously and ok to use Izni account yaa"
3. SRD v1.1: the STMS payment summary shows RM25 and the homepage shows RM35. `[from Teams EAINT-12403, 2026-09-25 10:52, Mei Jia Chee]`
4. Released together with LKM Refund on the 1 Oct night deploy. QA estimate 2 + 1 days. Signed off by Azfar on 2026-10-01 15:09. `[from Teams EAINT-12403, 2026-09-24 12:09, Mei Jia Chee]`

### EAINT-12299: Chinese-character file names
1. Chinese file names are converted to Hanyu Pinyin.
   `[from Teams EAINT-12299, 2026-09-11 10:57, Yi Link Lim]` "we will translate Chinese to hanyupinyin which is "sao miao quan neng wang.pdf""
2. Dev Jin Siang Boo added handling for other languages too. Code review was done on 2026-09-17; no deploy date in the chat.
3. No dated message in the CR group from 16 to 26 Oct. `[from Teams sweep 2026-10-26, EAINT-12299]`

### EAINT-12342: WhatsApp alert recipients
1. Keep only the failure alerts (failed transaction, cover note failed, JPJ failed); success messages still go to the customer.
   `[from Teams EAINT-12342, 2026-09-28 12:36, Mei Jia Chee]`
2. Removing a phone number from the config counts as "inactive". `[from Teams EAINT-12342, 2026-09-28 15:19, Goh Kai Jiaeh]`
3. SRD v1.2 removes eAuto Support and adds Wani's number. `[from Teams EAINT-12342, 2026-09-29 10:22, Mei Jia Chee]`
4. Cover note sending was changed to support several recipients, and MessageBird was enabled on staging for the test. `[from Teams EAINT-12342, 2026-09-29 16:54, Goh Kai Jiaeh]`

### EAINT-12344: BackOffice permission page
1. Dev Kasheng Liew. Tan Yi Fung asked for a schema design, migration steps and phases before build. `[from Teams EAINT-12344, 2026-10-05 17:20, Tan Yi Fung]`

### EAINT-12348: PBT organisations as eDereg users
1. Dev Sia Zhong Tai. Estimate 5–6 days without the new AATF UI. `[from Teams EAINT-12348, 2026-09-28 10:20, Jin Siang Boo]`
2. PBT has a TIN, so e-invoice applies. Validation uses the BRN + TIN pair. `[from Teams EAINT-12348, 2026-10-08 16:37, Mei Jia Chee]` `[same chat, 2026-10-12 09:42, Sia Zhong Tai]`
3. RHB payment ID allows 30 characters. `[from Teams EAINT-12348, 2026-10-12 17:44, Goh Kai Jiaeh]` "Ya 30 chars but this doc is quite old one."
4. Proposed PBT pre-check number format is PBTPC + Y + M + 6 digits; existing is PC69001611. `[from Teams EAINT-12348, 2026-10-07 14:32, Mei Jia Chee]`
5. The PBT version uses code "0810" (Insurance Cancellation uses "0809").
   `[from Teams EAINT-12348, 2026-10-19 08:19, Mei Jia Chee]` "okkkies, if that the case i believe for the PBT version we will use "0810" ya."
6. The "search 5 vehicle numbers only" handling is not in scope.
   `[from Teams EAINT-12348, 2026-10-19 09:45, Mei Jia Chee]` "as liaised just now - this handling has been removed last year ya"
7. Flow confirmed; only the Perakuan wording from Ops is pending.
   `[from Teams EAINT-12348, 2026-10-19 10:48, Mei Jia Chee]` "the flow is confirmed, now just pending the perakuan part from ops team"
8. Dev ETA for testing, excluding the Perakuan part: "next Monday" from 19 Oct, which is 2026-10-26.
   `[from Teams EAINT-12348, 2026-10-19 11:07, Sia Zhong Tai]` "i think next Monday EOD including code review"
9. SRD trail: v0.9 and v1.0 in Jira on 2026-10-19; v1.1 uploaded 2026-10-22 and sent to the requestor on 2026-10-23.
   `[from Teams EAINT-12348, 2026-10-19 10:48, Mei Jia Chee]` "v0.9 & v1.0 are ready in the jira ticket ya."
   `[same chat, 2026-10-23 15:26, Mei Jia Chee]` "sent out srd v1.1 for requestor to review ya"
10. No deploy date or staging branch named in the CR group by 2026-10-26. `[from Teams sweep 2026-10-26, EAINT-12348]`

### EAINT-12386, EAINT-12406, EAINT-12424 (SRD stage only)
1. EAINT-12386 (JomCheck chassis special characters): KJ took it on 2026-10-13. `[from Teams EAINT-12386, 2026-10-13 09:35, Goh Kai Jiaeh]`
2. EAINT-12406 (Secarang Allianz): SRD v1.0 on 2026-10-15; briefing 2026-10-16 3PM. `[from Teams EAINT-12406, 2026-10-15 18:16, Yi Link Lim]`
3. EAINT-12424 (Chubb "NO." prefix): Yi Link took over from 2026-10-12; Chubb had not yet been asked the open questions. `[from Teams EAINT-12424, 2026-10-05 10:53, Goh Kai Jiaeh]`
4. EAINT-12386 (JomCheck chassis special characters) — **before the EAINT-12339 hotfix**, an invalid chassis could still be paid for.
   `[from Teams EAINT-12386, 2026-10-23 10:45, the developer]` "Previously if system received Invalid Chassis No. response from Jomcheck enquiry API, system still allow UCD to make payment and purchase report. However, jomcheck get report API will also returned Invalid Chassis No. response."
5. EAINT-12386 — **after the hotfix**, UCD is blocked at enquiry.
   `[from Teams EAINT-12386, 2026-10-23 10:46, the developer]` "After hotfix, if system detects Invalid Chassis No. response from Jomcheck enquiry API, system will block UCD directly."
6. EAINT-12386 — chassis has **no real precheck**, but the invalid format is still checked.
   `[from Teams EAINT-12386, 2026-10-26 14:12, the developer]` "not exactly. For chassis number their API still doesn't have precheck but somehow they will check this Invalid format."
7. EAINT-12386 — **cron part still open**: SRD v0.4 sent to the developer; no reply in the export to 2026-10-26 15:22.
   `[from Teams EAINT-12386, 2026-10-26 15:22, the BA]` "regarding the cronjob part, need advise yaa." `[source: pipeline EAINT-12386, Scout study, 2026-10-27]`

### EAINT-12430 / EAINT-12431 / EAINT-12329: LKM refund
1. EAINT-12430 (refund amount column) was signed off on staging by May Chin on 2026-10-07 and checked in prod on 2026-10-08. `[from Teams EAINT-12431, 2026-10-08 09:23, May Chin Mei Theng]`
2. EAINT-12431 uses MessageBird. `[from Teams EAINT-12431, 2026-10-07 16:41, Tan Yi Fung]`
3. EAINT-12431 was split. Part 1 covers the Step 1 email and WhatsApp. Part 2 (Step 4 and the rest) moves to EAINT-12329. `[from Teams EAINT-12431, 2026-10-14 16:25, Yi Link Lim]`
4. Trigger: email and WhatsApp go out together when the user finishes Step 2 and moves to Step 3.
   `[from Teams EAINT-12431, 2026-10-16 15:06, Lim Xiwei]` "we will send the email + WhatsApp together when user finish Step 2 and moves to Step 3, eta 21/10"
5. Test branch staging/uat4. `[from Teams EAINT-12431, 2026-10-20 17:14, Charmain Ea Chiang]` "can use staging/uat4 for this ticket ya"
6. QA scope is one E2E happy flow, Individual only.
   `[from Teams EAINT-12431, 2026-10-21 12:12, Charmain Ea Chiang]` "according to our discussion yesterday, i will test with one E2E Happy Flow for Individual only"
7. Deploy target set to Monday 26 Oct, morning.
   `[from Teams EAINT-12431, 2026-10-21 15:03, Mei Jia Chee]` "this ticket tentatively target to deploy on next Monday 26.10.2026 morning"
8. Ops approved the MessageBird WhatsApp template in the SRD.
   `[from Teams EAINT-12431, 2026-10-22 13:08, Yi Link Lim]` "Yes Ops has confirmed that we can proceed with the template"
9. **Johor suppression dropped.** On 2026-10-21 the BA raised a rule not to send when the UCD state is Johor or when BO unticks Johor in "Manage LKM Refund Amount (below RM30)" `[from Teams EAINT-12431, 2026-10-21 11:21, Yi Link Lim]`. It was dropped two days later.
   `[from Teams EAINT-12431, 2026-10-23 12:26, Yi Link Lim]` "This handling to send out notification based on Manage LKM Refund Amount listing is NOT required ya."
10. **WhatsApp only at go-live; email waits for the new mailbox.**
    `[from Teams EAINT-12431, 2026-10-23 12:26, Yi Link Lim]` "According to Fakrul, new email "bizsupport@eauto.my" is not ready just yet. Need a few working days to get this ready. b. Confirmed with Ops that: we can proceed deployment with whatsapp message first Enable email feature once new email is ready"
    No date for the email go-live was given by 2026-10-26.
11. SRD v0.1 uploaded 2026-10-20; v0.2 and v1.0 uploaded 2026-10-23. `[from Teams EAINT-12431, 2026-10-20 16:52 and 2026-10-23 12:51, Yi Link Lim]`
12. Staging WhatsApp sends to the phone number keyed in at Step 2. `[from Teams EAINT-12431, 2026-10-23 14:25, Jin Siang Boo]` "now lkm refund whatsapp message is connected to MessageBird d ya. It will send to the phone number that you keyed in at Step 2 ya"
    Later the same day: `[same chat, 2026-10-23 18:14, Jin Siang Boo]` "I had connected the MessageBird to esim ya on the LKM Refund whatsapp message"
13. Bug **EAINT-12600** raised: an STMS Company transaction sent the LKM Refund messages. Fix deployed to staging/uat4 the same day; retest passed 2026-10-26 08:21 (Jira comment).
    `[from Teams EAINT-12431, 2026-10-23 15:30, Charmain Ea Chiang]` "i have raised an issue ticket ya ... EAINT-12600" `[same chat, 2026-10-23 16:48, Lim Xiwei]` "done thanks"
14. QA sign-off. `[from Teams EAINT-12431, 2026-10-23 21:21, Charmain Ea Chiang]` "QA has completed testing for EAINT-12431 on staging/uat4 (eAuto) with no outstanding issues. It's ready for morning deployment on 26 Oct (Monday)."
15. **Deployed 26 Oct 2026 morning** (dev KJ, QA Charmain). `[from Teams eAuto Secarang Main Group, 2026-10-23 18:18, Yi Link Lim]` "Prod Deployment Session dd: 26.10.2026 (Monday) ... Dev 1. KJ QA 1. Charmain Deployment Item (Total 1 item) 1. EAINT-12431"
    `[from Teams eAuto QAs, 2026-10-26 09:35, Faizuddin]` "QA has completed the prod regression testing and will continue to monitor prod from time to time"

### EAINT-11868 / EAINT-11982: Application expiry extension and reactivation
Raw chat: `_reference/teams/EAINT-11868-11982-Application-Expiry-Extension-Reactivation.md`. QA was Azila; it was on the 2 Sept deployment list. `[from Teams eAuto QAs, 2026-08-20 09:40, May Chin Mei Theng]`

1. QA Azila is studying the SRD and drafting TS "once have capacity"; progress "Not Ready for Testing" from 20 to 22 Oct (the 19 Oct EOD alone said "Ready for Testing").
   `[from Teams eAuto QAs, 2026-10-20 08:52, Siti Nur Azila]` "To continue study SRD To continue draft test scenarios and test script once have capacity CR Testing Progress : Not Ready for Testing"
2. Dev Mong Guo Hao was added to the CR group. `[from Teams EAINT-11868, undated event]` "Lim Xiwei added Mong Guo Hao to the chat and shared all chat history."
3. No deploy date, staging branch or estimate posted in Teams by 2026-10-26. `[from Teams sweep 2026-10-26, EAINT-11868]`

### EAINT-10108: STMS Perakuan Step 1 & Step 3 wording (customer email)
1. CR group opened 2026-10-19. QA estimate 1 day (0.5 + 0.5).
   `[from Teams EAINT-10108, 2026-10-19 15:01, Charmain Ea Chiang]` "Est. Testing Mandays: 1 day (1 QA) Base Testing Time: 0.5 day Buffer (Req Change + Bug Fix + Retest Bug): 0.5 day"
2. Dev lead Tan Yi Fung took the ticket himself. `[from Teams EAINT-10108, 2026-10-20 09:56, Tan Yi Fung]` "i taking it up , will update if further assign"
3. Scope: only the word "pemohon" must be added; other differences can be ignored.
   `[from Teams EAINT-10108, 2026-10-21 14:19, Yi Link Lim]` "can ignore them, just ensure to add the "pemohon" word will do"
   Dev asked "cover the consent pdf , right?" `[same chat, 2026-10-22 11:58, Tan Yi Fung]`. No reply captured.
4. Deploy date: the BA proposed 28 Oct; QA set 27 Oct (Tuesday) morning.
   `[from Teams EAINT-10108, 2026-10-21 10:32, Yi Link Lim]` "can we slot this ticket into 28 Oct 2026?"
   `[same chat, 2026-10-21 14:49, Charmain Ea Chiang]` "we are targeting to deploy this ticket on 27 Oct (Tuesday) ya"
5. Test branch staging/uat3; ready 2026-10-22 11:26. `[from Teams EAINT-10108, 2026-10-22 09:46, Charmain Ea Chiang]` "can use staging/uat3 for this ticket ya" `[same chat, 2026-10-22 11:26, Goh Kai Jiaeh]` "Fyi, the changes is ready on staging/uat3."
6. QA complete 5/5 (TS1–TS3 E2E, TS4–TS5 existing transactions), signed off for 27 Oct morning.
   `[from Teams EAINT-10108, 2026-10-23 09:20, Charmain Ea Chiang]` "QA has completed testing for EAINT-10108 on staging/uat3 (eAuto) with no outstanding issues. It's ready for morning deployment on 27 Oct (Tuesday)."
   `[from Teams eAuto Secarang Main Group, 2026-10-26 10:20, Charmain Ea Chiang]` "We are ready for 27 Oct (Tuesday) morning deployment."

### EAINT-11179: Move LKM Refund & Insurance Cancellation add-on from Step 5 to Step 4
1. CR group opened 2026-10-19. `[from Teams EAINT-11179, 2026-10-19 15:42, Yi Link Lim]` "we will use this CR group for EAINT-11179"
2. QA Charmain: not ready for testing; requirements and deploy date still being checked with the SA through 2026-10-26.
   `[from Teams eAuto QAs, 2026-10-20 08:25, Charmain Ea Chiang]` "To follow up and sync up with SA on the expected deployment date To check with SA on the latest requirements and updates Overall CR Testing Progress : Not Ready for Testing"

### EAINT-12580: Copy of IC split saves watermark pieces (bug)
1. No CR group found. QA Amirul Azfar is preparing test data; no staging, dev message or deploy date in Teams.
   `[from Teams eAuto QAs, 2026-10-26 09:24, Amirul Azfar]` "EAINT-12580 ... Status : To prepare test data and start testing Overall CR Testing Progress : TBC"
2. The fix has no staging branch; it affects every branch.
   `[from Teams eAuto QAs, 2026-10-26 12:25, Amirul Azfar]` "Alright, currently 12626 is on /uat1 and 12580 got no branch, it affects all branch ya"
3. No production regression for this fix; the Senior QA accepted and updated the scope.
   `[from Teams eAuto QAs, 2026-10-26 16:38, Amirul Azfar]` "I think for this one cannot do any prod regression as the changes is only on step-5 ai checking for ic"
   `[same chat, 2026-10-26 16:39, Charmain Ea Chiang]` "oh i see, okie i will update the scope, thanks ya"

### EAINT-12589: Ins Cancellation Balance % on listings and export (bug)
1. No QA needed; deployed to prod 26 Oct 2026.
   `[from Teams DM Charmain Ea Chiang, 2026-10-26 09:37, Charmain Ea Chiang]` "no QA needed for 12589 ya"
   `[same DM, 2026-10-26 09:41, Charmain Ea Chiang]` "ya just mention that it has been deployed to prod"
2. The 23 Oct deploy notice lists **EAINT-12586** with the title "STMS Listing: To Add "Ins Cancellation Balance %" Column Before Ins Cancellation Payment" `[from Teams eAuto Secarang Main Group, 2026-10-22 17:34, Yi Link Lim]`. The 26 Oct huddle agenda lists that title under EAINT-12589 for 23 Oct `[from Teams eAuto QAs, 2026-10-26 09:35, Faizuddin]`. Whether 12589 is a follow-up fix to 12586 is `[unconfirmed]`.

### EAINT-12087, EAINT-12088, EAINT-12123, EAINT-8767, LKM Refund Phase 2: no Teams messages 16–26 Oct
1. Searches for "12087", "12088", "8767" and "LKM Refund Phase 2" returned no hit in range; the 12123 CR group held only undated events. No Jira key was found for LKM Refund Phase 2. `[from Teams sweep 2026-10-26, §A rows 5, 8, 15, 17, 21]`

## Part B: additions to tickets already in cr-ledger

### EAINT-9306
1. When JPJ Enquiry fails after a successful payment, the retry calls the earlier pre-check transaction. The remark shown is: "Your eDereg Pre-Checking is unsuccessful. Kindly contact our Customer Service at 03-27798899". `[from Teams EAINT-9306, 2026-09-01 09:36, Batrisyia]` (SRD v1.1)
2. KJ rebuilt the test branch from the latest prod code instead of reverting the 9306 changes. `[from Teams eAuto QAs, 2026-09-09 15:59, Charmain Ea Chiang]`

### EAINT-11864
1. Send window:
   `[from Teams EAINT-11864, 2026-07-29 12:41, Yi Link Lim]` "system will run cronjob to send email from 7AM to 11PM. If there r emails need to be send between 11:01PM to 6:59AM, cronjob should send by 7AM ya."
2. Quotations with status Draft also get the email. `[from Teams EAINT-11864, 2026-07-21 17:37, Yi Link Lim]`
3. The wording "commission" became "discount". `[from Teams EAINT-11864, 2026-07-31 15:22, Yi Link Lim]`
4. If UCD B opens UCD A's quotation link, they are blocked and sent to their own homepage. `[from Teams EAINT-11864, 2026-08-05 16:13, Leong Jin Chuen]`
5. Tech notes: separate RabbitMQ queue (the DLQ max-length is 1000); SMTP replaced by Microsoft Graph. `[from Teams EAINT-11864, 2026-07-27 15:11, Leong Jin Chuen]`

### EAINT-12028
1. The deploy needs downtime, because login/logout in core changed. `[from Teams EAINT-12028, 2026-08-26 12:12, Tan Yi Fung]`
2. Car count is private + company. `[from Teams EAINT-12028, 2026-09-04 10:32, Mei Jia Chee]` "as long as is car then total up the amount will do, same goes to motorcycle"
3. Bug found by the new dev: once the drafter clicks KIV, nobody can approve that month. `[from Teams EAINT-12028, 2026-09-29 16:04, Kasheng Liew]`
4. No dated message in the CR group from 16 to 26 Oct; only the event "Jin Siang Boo added Kasheng Liew to the chat and shared all chat history." `[from Teams sweep 2026-10-26, §A row 23]`
5. The association rates (FMC RM1, MMSDA RM2) may change later. The dev asked "For this rate, will it change in the future?"; the BA answered "yes, there is a possibility". `[from Teams EAINT-12028, 2026-08-04 14:12, Mei Jia Chee]` Do not hard-code the rate in a check without a note. `[unconfirmed]`
6. One person may approve as more than one role (REQ-003 lets a user hold several roles). The dev asked "Can the same person approve as different roles?"; the BA answered "yes, there is a possibility on this ya". `[from Teams EAINT-12028, 2026-08-04 16:19, Mei Jia Chee]`
7. Pay-To details and Attn (REQ-018, REQ-019) on the FMC/MMSDA PDF stay fixed values. `[from Teams EAINT-12028, 2026-08-05 14:26, Mei Jia Chee]` "as of now just make it as fixed info will do ya"
8. Option for an urgent deploy: "can deploy and hide the link in backoffice first". `[from Teams EAINT-12028, 2026-08-26 12:12, Tan Yi Fung]`
9. The per-state split uses the UCD company state, because Ops export from the BO transaction listing. `[from Teams EAINT-12028, 2026-09-04 10:45, Jin Siang Boo]` "think we use UCD company state ya" — `[2026-09-04 11:17, Mei Jia Chee]` "yes ... they export file from backoffice trx listing ya"

### EAINT-12107
1. Secarang and eAuto use different Fiuu merchant accounts. `[from Teams EAINT-12107, 2026-08-27 09:26, Goh Kai Jiaeh]` "Fiuu account for secarang is different with eauto one."
2. SPayLater and PayLater by Grab are options inside the ShopeePay and GrabPay apps, not separate channels. `[from Teams EAINT-12107, 2026-09-03 19:06, Kasheng Liew]`
3. BNPL went to prod without a staging test. `[from Teams EAINT-12107, 2026-09-07 14:45, Yi Link Lim]` "We can proceed to deploy BNPL for both ShopeePay & GrabPay to prod without testing in staging"
4. CIBO Payment Channels filter names: "Fiuu - eWallet", "GrabPay", "GrabPay - PayLater by Grab", "ShopeePay", "ShopeePay - SPayLater". `[from Teams EAINT-12107, 2026-09-07 18:10, Yi Link Lim]`
5. ShopeePay fails in the Fiuu sandbox. GrabPay can only be set to pass or fail, with no PayLater option. `[from Teams EAINT-12107, 2026-09-09 18:03, Kasheng Liew]`

### EAINT-12153 / EAINT-12257 / EAINT-12259
1. Fiuu had not enabled B2B or DuitNow QR in prod. `[from Teams EAINT-12153, 2026-08-19 12:48, Yi Link Lim]`
2. Regression for the card patch is one E2E happy-flow Pre-Application. `[from Teams EAINT-12153, 2026-09-02 11:39, Charmain Ea Chiang]` "QA only needs to create 1 Pre-Application with the E2E happy flow for regression testing ya"
3. No B2B/C2B labels. The Approval Deadline Date is the Submitted Payment Date + 7 days, at 12 PM. `[from Teams EAINT-12153, 2026-09-07 18:36, Yi Link Lim]`
4. QA estimate 2 + 1 days each, 4 + 2 combined; earliest deploy 29 Oct morning. (The post's "EAINT-12237" is a typo for 12257.)
   `[from Teams eAuto QAs, 2026-10-21 12:56, Faizuddin]` "each of these tickets will require 2+1 days testing time ... the effort estimation for both combined is 4+2 days ... So I believe the earliest deployment date for these 2 tickets is 29th October Morning"
5. **Deploy target 29 Oct 2026 (Thursday) morning, both tickets together.**
   `[from Teams EAINT-12153, 2026-10-22 10:26, Mei Jia Chee]` "we target next Thursday 29.10.2026" `[same chat, 2026-10-22 10:27, Mong Guo Hao]` "yea both can be done on morning deployment"
   `[from Teams eAuto QAs, 2026-10-22 10:29, Charmain Ea Chiang]` "Faiz, we are targeting 29 Oct for the deployment of both EAINT-12153 and EAINT-12257 ya."
6. Test branch staging/obs. 12257 deployed 2026-10-22 11:20; 12153 deployed 2026-10-22 14:41.
   `[from Teams EAINT-12153, 2026-10-22 11:20, Mong Guo Hao]` "EAINT-12257 have been deployed to staging/obs" `[same chat, 2026-10-22 14:41, Mong Guo Hao]` "i have deployed EAINT-12153 to staging/obs"
7. Fiuu simulators: `[from Teams EAINT-12153, 2026-10-22 11:21, Mong Guo Hao]` "note to use this to scan the qr https://bank-simulator.fiuu.com/duitnow/viewqr" `[same chat, 2026-10-22 14:41, Mong Guo Hao]` "to approve the payment can go to https://bank-simulator.fiuu.com/fpx-b2b/pending"
8. **AffinMax on staging (12153, B2B list).** The dev replaced the outdated "Affin Bank" entry with Affin Max on 2026-10-22. No BA confirmation seen in Teams.
   `[from Teams DM Mong Guo Hao, 2026-10-22 14:13, Mong Guo Hao]` "i think the affin bank is outdated but got affin max" / "not sure ba want orr not"
   `[same DM, 2026-10-22 16:39, Mong Guo Hao]` "i changed the affin bank to affin max yea"
9. Bugs: EAINT-12588 (12153, raised and resolved); EAINT-12625 and EAINT-12627 (12257, raised 2026-10-23).
   `[from Teams eAuto QAs, 2026-10-23 19:30, Faizuddin]` "EAINT-12257 ... Raised Today : EAINT-12625, EAINT-12627 ... EAINT-12153 ... Raised & Resolved Bugs: EAINT-12588"
10. **EAINT-12625** (cancelled QR / FPX B2C shows no Unsuccessful Payment message): dev view, then closed as existing behaviour.
    `[from Teams DM Mong Guo Hao, 2026-10-24 13:44, Mong Guo Hao]` "if cancel means haven't do payment so shouldn't have unsuccessful payment right."
    Outcome in Jira, not Teams: `[from Jira EAINT-12625 comment 57993, 2026-10-26 10:39, Faizuddin]` "Follow existing behaviour where it will not show error message if close the payment gateway page". EAINT-12627 (QR timer expiry) was still To Do on 2026-10-26.
11. Test-complete deadline EOD 28 Oct; QA said on track.
    `[from Teams eAuto QAs, 2026-10-26 09:22, Charmain Ea Chiang]` "are EAINT-12257 and EAINT-12153 on track to complete testing by EOD 28 Oct (Wednesday) ?" `[same chat, 09:30, Faizuddin]` "Yup, its on track to complete"
12. Progress 2026-10-26: 12153 6/12 (50%); 12257 3/13 (23.07%). `[from Teams eAuto QAs, 2026-10-26 08:46, Faizuddin]`
13. Open at 2026-10-26: walkthrough-session readiness, reply due 4PM that day. `[from Teams EAINT-12153, 2026-10-26 10:36, Yi Link Lim]` "can help to confirm whether when 12153 & 12257 is ready for walkthrough session? Do lemme know latest by 4PM today ya."

### EAINT-12166
1. **Branch conflict:**
   1. Dev wrote "EAINT-12166 is ready in staging/uat2" `[from Teams EAINT-12166, 2026-09-23 09:32, Lim Xiwei]`.
   2. QA signed off "on staging/uat1" `[same chat, 2026-09-25 17:50, Faizuddin]`.
   3. uat2 had been removed on 2026-07-06 (see `environments-history.md`), so "uat2" is most likely a typo.

### EAINT-12167
1. Each parcel holds at most 10 devices, while an order can hold more. `[from Teams EAINT-12167, 2026-08-14 10:08, Yi Link Lim]`
2. The serial-number popup has no "type serial number" placeholder and shows two columns (1–20 / 21–40). `[from Teams EAINT-12167, 2026-09-25 12:40, Yi Link Lim]`

### EAINT-12175
1. The `InsurancePlanCode.Lonpac` value `LonpacInsuranceBerhad` is an integration token, not display text. The name shown is looked up at display time, so reprinted old policies also show "Bhd". `[from Teams EAINT-12175, 2026-09-28 17:19, Kasheng Liew]`

### EAINT-12339
1. Plan B (one-shot, about 4 days) was chosen over Plan A (backend only, 2 days). `[from Teams EAINT-12339, 2026-09-18 16:48, Mei Jia Chee]` "follow plan B ya"
2. API limit under v2.0: `[from Teams EAINT-12339, 2026-09-30 11:03, Faizuddin]` "the JomCheck API only allows up to 20 Reports per day ya"
3. KJ is JomCheck PIC from 2026-10-02. `[from Teams EAINT-12339, 2026-10-02 18:12, Goh Kai Jiaeh]`

### Shopping cart (EAINT-10960 / 11880 / 11881 / 11882 / 12099)
1. RHB returns "ED" when Ref 2 is longer than 30 characters. `[from Teams EAINT-12099 group, 2026-07-17 10:23, Goh Kai Jiaeh]` The agreed Ref 2 values are "SOFTINSTALL/ BIODEV/ SOFTINSTALL_BIODEV/". `[same chat, 2026-07-17 18:22, Yi Link Lim]`
2. Text fields accept letters, numbers, special characters and spaces, and block Chinese and other non-English characters. `[same chat, 2026-07-20 12:01, Chin Teck Yung]`
3. Stock In and Stock Out scans save automatically, with no Save button. `[same chat, 2026-09-29 08:49, Lim Xiwei]` The Iris test device must be returned by 2026-11-03. `[same chat, 2026-10-13 16:55, Mei Jia Chee]`
4. EAINT-12099 dev changes were ready on 2026-10-12; no deploy date was set as of 2026-10-21.
   `[from Teams EAINT-12099 group, 2026-10-21 10:23, Lim Xiwei, quoting own 12/10/2026 16:09]` "EAINT-12099 changes are ready. Do let me know which env and when to deploy ya"
   `[same chat, 2026-10-21 10:34, Mei Jia Chee]` "we yet to target when to deploy this ticket."
5. **EAINT-12099 split; leftovers go to EAINT-12635.**
   `[from Teams EAINT-12099 group, 2026-10-26 10:16, Mei Jia Chee]` "for this Inventory Control we will break into 2 tickets, Ticket 1: EAINT-12099 arrangement: To proceed arrange deployment, push to prod first. let Ops team to use whatever already discussed before Ticket 2: EAINT-12635 for those items that did not cover in EAINT-12099 will be in this new EAINT tickets."
6. QA Charmain is drafting the high-level scope and estimate for 12099. `[from Teams eAuto QAs, 2026-10-26 08:19, Charmain Ea Chiang]` "Status : To draft high level scope and provide testing estimation Overall CR Testing Progress : Not Ready for Testing"

## Part C: deployment-schedule changes, 16–26 Oct 2026

Chat is "eAuto Secarang Main Group" unless the tag says otherwise. The release-version ids are Jira version ids from the plan post.

1. **19 Oct night moved to 20 Oct night** (EAINT-8622).
   `[from Teams eAuto Secarang Main Group, 2026-10-19 20:24, Yi Link Lim]` "Just to update, we will reschedule this deployment tentatively by tomorrow ya."
2. **21 Oct night deploy (EAINT-12578) cancelled.**
   `[from Teams eAuto Secarang Main Group, 2026-10-21 20:04, Mei Jia Chee]` "Everyone, just to inform that tonight deployment cancelled ya"
3. **EAINT-12525 (LKM Refund video) went to prod by accident on 21 Oct.**
   `[from Teams EAINT-12525, 2026-10-22 15:44, Mei Jia Chee]` "this ticket has been accidentally deployed to prod on 21.10.2026 around 2.15pm yaaa. closed case for this ticket as of now"
4. **October plan as of 22 Oct: 28 Oct slot moved to 27 Oct; new sessions 23, 28 and 29 Oct.**
   `[from Teams eAuto Secarang Main Group, 2026-10-22 11:47, Mei Jia Chee]` "Completed ... 20.10.2026 (Tues) - Morning Session [13828] / Completed 19.10.2026 (Mon) 20.10.2026 (Tues) - Night Session [13980] / Completed 21.10.2026 (Wed) - Morning Session [14111] / NEW!!! 23.10.2026 (Fri) - Morning Session [14124] / 26.10.2026 (Mon) - Morning Session [14110] / Rescheduled 28.10.2026 (Wed) 27.10.2026 (Tues) - Morning Session [14033] / NEW!!! 28.10.2026 (Wed) - Morning Session [14029] / NEW!!! 29.10.2026 (Thurs) - Morning Session [14032]"
5. 23 Oct morning items: EAINT-12549, EAINT-12579, EAINT-12586. `[from Teams eAuto Secarang Main Group, 2026-10-22 17:34, Yi Link Lim]` "Prod Deployment Session dd: 23.10.2026 (Friday) ... Deployment Item (Total 3 items)". Done and QA-checked: `[same chat, 2026-10-23 08:35, Jin Siang Boo]` "deployment done ya" `[same chat, 2026-10-23 09:36, Siti Nur Azila]` "QA has completed testing with no issues ya."
6. 26 Oct morning: EAINT-12431 only (EAINT-12589 also went out, no QA). See Part A § EAINT-12431 item 15 and § EAINT-12589.
7. 27 Oct morning: EAINT-10108. 28 Oct morning: EAINT-12253. 29 Oct morning: EAINT-12153 and EAINT-12257.
   `[from Teams eAuto QAs, 2026-10-26 09:35, Faizuddin]` "[27 October 2026] EAINT-10108 ... Ready for prod deployment [28 October 2026] EAINT-12253 ... Ready for prod deployment [29 October 2026] EAINT-12153 ... QA in the midst of testing - about 50% complete EAINT-12257 ... QA in the midst of testing - about 30% complete"
8. After the 26 Oct deploy, QA asked dev to merge the latest prod code to "/eauto/preprod1/sit2/sit3/sit4/uat1/uat3/uat4". `[from Teams eAuto Secarang Main Group, 2026-10-26 10:47, Charmain Ea Chiang]`
9. Prod-to-staging sync 2026-10-22: all eAuto staging branches and Secarang /preprod on prod/master 37c4c6577d. `[from Teams eAuto Deployment Notification, 2026-10-22 07:14 and 07:47]`
10. No Teams message in range for the 3 Nov, 5 Nov or 26 Nov slots. `[from Teams sweep 2026-10-26, §B item 17]`
11. New CR groups announced 2026-10-26 09:47 for EAINT-12615 (LKM Refund user guide / FAQ), EAINT-12628 and EAINT-12631. `[from Teams eAuto Secarang Main Group, 2026-10-26 09:47, Mei Jia Chee]`
