# Staging environment history (from Teams, June–October 2026)

What each eAuto staging branch was used for, when, and by whom; every external
connection (JPJ, RHB, JomCheck, BoldPay, real email); every prod-to-staging
merge-down; and the team's working rules for claiming and sharing environments.

## How to read this

1. **Source.** Teams chats read on 2026-10-16. Tags are
   `[from Teams <chat>, <YYYY-MM-DD HH:MM>, <person>]`. Raw text sits in
   `_reference/teams/<chat>.md`. "Main" = *eAuto Secarang Main Group*,
   "QAs" = *eAuto QAs*, "DN" = *eAuto Deployment Notification*, "DM-Charmain" =
   Faizuddin's 1:1 with Charmain.
2. **Environments are per ticket, never per rule.** An env named below is a
   dated observation of one assignment, not "the env to use" for anything.
   See [eauto-portals.md](eauto-portals.md) "Never tie an environment to a general rule".
3. **Coverage.** eAuto QAs: 2026-08-03 onwards. Main group: 2026-06-03 onwards.
   Deployment Notification: whole history (starts 2026-07-09). 6–15 Oct is in
   `memory/teams-catchup-2026-10-06-to-15.md` and is only summarised here.
4. Branch URL pattern is `https://staging.eauto.my/<branch>`; Secarang staging is
   `https://staging.secarang.com/<site>` (e.g. `/ia`, `/preprod`).

## 1. Branch inventory over time

| Date | Branches in use | Source |
|---|---|---|
| 2026-06-11 | Merge-down list: eauto, preprod1, preprod2, preprod3, sit3, uat1, uat2, uat3 (sit2 also exists — Wholesale) | `[from Teams Main, 2026-06-11 14:27, Charmain Ea Chiang]` |
| 2026-06-24 | Also staging/elasticsearch, staging/asset-manager, staging simulator | `[from Teams Main, 2026-06-24 15:27, Jin Siang Boo]` |
| 2026-07-06 | preprod2 and uat2 removed; preprod3 removed the same day | `[from Teams Main, 2026-07-06 14:00, Wei Ting Lim]` "FYI, i have remove proproed2 and uat2 ya"; `[from Teams Main, 2026-07-06 16:46, Wei Ting Lim]` "later i will remove preprod3 also" |
| 2026-07-06 | sit1 "is currently connecting to eauto UAT app" | `[from Teams Main, 2026-07-06 10:57, Way Hou Wong]` |
| 2026-07-09 → | CI deploy cards show eauto, preprod1, sit2, sit3, sit4, uat1, uat3, uat4; sit1 from 2026-09-30 | `[from Teams DN, 2026-07-09 … 2026-10-16, Workflows]` |
| 2026-08-30 | Night CI deploys to branches named staging/chubb, staging/lonpac, staging/tokiomarine (Project eAuto) | `[from Teams DN, 2026-08-30 22:18–23:30, Workflows]` |
| 2026-10-07 | "All 8 staging environments are now up to date" = eauto, preprod1, sit2, sit3, sit4, uat1, uat3, uat4 | `[from Teams DN, 2026-10-07 18:57, Workflows (Goh Kai Jiaeh template)]` |
| 2026-10-14 | uat2 inactive; uat1 given to Wei Ting for wholesale (swap with sit2) | `[from Teams via memory digest, 2026-10-14]` |

Other staging services named in deploy announcements: eauto-cron, eauto-notification,
einvoice API, eauto-onboarding (also "onboarding API"), serbasentral API,
secarang-backend (`staging/ins`), secarang frontend, cibo-frontend (`staging/cibo`),
esim / simulator, ssm-api, obs, JomCheck API, wholesale geo service.
`[from Teams Main, 2026-06-03 … 2026-10-05, various devs]` `[from Teams EAINT-11934 & 12058, 2026-07-23 09:55, Leong Jin Chuen]`

## 2. Assignment log (ticket → environment)

| Date claimed | Env | Ticket / purpose | Who | Source |
|---|---|---|---|---|
| 2026-06-09 | uat1 → merged into sit2 | Credit Note EAINT-8700 (uat1) + Wholesale (sit2), 10 Jun night deploy | Nicholas Lim / Wei Ting | `[from Teams Main, 2026-06-09 09:55, Wei Ting Lim]` "i merge uat1 to sit2, so sit2 now contain uat1 changes ya. uat1 still only uat" |
| 2026-06-09 | uat2 + Secarang /ia | Macrokiosk walkthrough | Batrisyia | `[from Teams Main, 2026-06-09 14:17, Batrisyia Hasanah]` |
| 2026-06-18 | sit3 | switched to eSIM insurance | KJ on QA request | `[from Teams DM-Charmain, 2026-06-18 14:44, Muhammad Faizuddin Bin Bidi]` |
| 2026-06-18 | preprod3 | 19 Jun morning deployment items | Charmain | `[from Teams Main, 2026-06-18 18:45, Charmain Ea Chiang]` |
| 2026-06-19 | eauto | Ops session with JPJ; do not change eSIM response codes for prefixes VA, VB (Pre-Checking) and VC, VD, VE (Dereg) | Yi Link | `[from Teams Main, 2026-06-18 18:47, Yi Link Lim]` |
| 2026-06-19 | preprod2 | EAINT-10168 walkthrough | Yi Link | `[from Teams Main, 2026-06-19 16:00, Yi Link Lim]` |
| 2026-06-23 | preprod2 | redeployed with EAINT-10435 only, 24 Jun morning | KJ | `[from Teams Main, 2026-06-23 16:56, Goh Kai Jiaeh]` |
| 2026-07-10 | uat1 | Shopping Cart (EAINT-10960/11880) | Charmain | `[from Teams EAINT-12099 group, 2026-07-10 12:59, Charmain Ea Chiang]` |
| 2026-07-16 | sit2 (+ uat1 kept in sync) | Shopping Cart Phase 1 test env; wholesale + shopping cart go to prod from sit2 | Charmain / Wei Ting | `[from Teams EAINT-12099 group, 2026-07-16 10:48, Charmain Ea Chiang]` |
| 2026-07-29 | uat4 | EAINT-12102 fix (31 Jul morning) | Charmain | `[from Teams EAINT-12099 group, 2026-07-29 15:16, Charmain Ea Chiang]` |
| 2026-08-03 | uat4 | EAINT-12106 | Aliah | `[from Teams QAs, 2026-08-03 10:13, Aliah Maisarah]` |
| 2026-08-05 | uat4 (+ Secarang /ia) | 7 Aug deployment items (11540, 11878, 4459, 12110, 12111) | Azila / Faizuddin | `[from Teams EAINT-12099 group, 2026-08-05 08:44, Siti Nur Azila]` `[from Teams DM-Charmain, 2026-08-04 17:33, Charmain Ea Chiang]` |
| 2026-08-05 | uat3 | JomCheck enhancement CRs (10089, 10937, 11175, 11757, 12113) | Charmain / Azila / Azfar | `[from Teams QAs, 2026-08-05 08:55, Huddle Agenda]` |
| 2026-08-06 | sit2 | Wholesale JomCheck transactions for regression | Azfar | `[from Teams QAs, 2026-08-06 10:10, Charmain Ea Chiang]` |
| 2026-08-10 | uat1 | 13 Aug deployment (11978, 11979) | Faizuddin | `[from Teams QAs, 2026-08-10 09:18, Muhammad Faizuddin Bin Bidi]` |
| 2026-08-12 | uat4 | EAINT-12058 eAuto side | Charmain | `[from Teams EAINT-11934 & 12058, 2026-08-12 12:07, Charmain Ea Chiang]` |
| 2026-08-12 | sit2 | Wholesale 2.0 (11998–12000), 12 Aug night | Charmain | `[from Teams Main, 2026-08-12 20:53, Charmain Ea Chiang]` |
| 2026-08-17 | uat4 | 17 Aug night items (11952, 12031, 12055, 12058, 12113) | Azila | `[from Teams Main, 2026-08-17 17:29, Siti Nur Azila]` |
| 2026-08-17 | uat1 (+ eauto-cron/notification/serbasentral on staging/preprod) | EAINT-11864 | Faizuddin / Leong Jin Chuen | `[from Teams EAINT-11864, 2026-08-17 12:15, Leong Jin Chuen]` |
| 2026-08-20 | uat4 | EAINT-11982 (onboarding code is outside eAuto core, applies to all branches) | Azila | `[from Teams EAINT-11868 & 11982, 2026-08-20 11:10, Siti Nur Azila]` `[same, 2026-08-20 12:20, Lim Xiwei]` |
| 2026-08-20 | uat1 (sit2 refused) | EAINT-9306 | Faizuddin | `[from Teams QAs, 2026-08-20 17:39, Charmain Ea Chiang]` "Hi Faiz, sit2 we usually reserve for wholesale related cr ya" |
| 2026-09-01 | uat4 + obs | EAINT-11982 / 12232, 2 Sep morning | Charmain | `[from Teams Main, 2026-09-01 14:08, Charmain Ea Chiang]` |
| 2026-09-02 | obs | EAINT-12259 card channel patch | Charmain | `[from Teams EAINT-12153 group, 2026-09-02 12:49, Charmain Ea Chiang]` |
| 2026-09-02 | sit2 | Wholesale v2 night deployment | Charmain | `[from Teams Main, 2026-09-02 17:57, Charmain Ea Chiang]` |
| 2026-09-07 | uat3 | EAINT-12042 (14 Sep) | Azfar | `[from Teams QAs, 2026-09-07 11:05, Amirul Azfar]` |
| 2026-09-08 | uat4 | EAINT-12289 APT fee | Azfar | `[from Teams QAs, 2026-09-08 12:41, Amirul Azfar]` |
| 2026-09-10 | uat1 | EAINT-9306 perakuan changes | Faizuddin | `[from Teams EAINT-9306, 2026-09-10 15:21, Muhammad Faizuddin Bin Bidi]` |
| 2026-09-15 | uat1 | 21 Sep Service Hub bug tickets | Faizuddin | `[from Teams QAs, 2026-09-15 15:23, Muhammad Faizuddin Bin Bidi]` |
| 2026-09-17 → 21 | preprod1 → JPJ Staging | LKM Refund SIT (no other changes/transactions until done) | Charmain / Brandon | `[from Teams Main, 2026-09-17 09:45, Charmain Ea Chiang]` |
| 2026-09-21 | uat1 | 28 Sep Service Hub (12166, 12167) | Faizuddin | `[from Teams QAs, 2026-09-21 15:10, Muhammad Faizuddin Bin Bidi]` |
| 2026-09-21/22 | uat3 → JPJ Staging | LKM Refund UAT with JPJ | Yi Link / Brandon | `[from Teams Main, 2026-09-21 17:55, Yi Link Lim]` `[same, 21:32, Jin Siang Boo]` |
| 2026-09-23 | uat4 | 29 Sep items | Azfar | `[from Teams QAs, 2026-09-23 16:35, Amirul Azfar]` |
| 2026-09-28 | cibo (no eAuto env) | EAINT-12151, 30 Sep | Faizuddin | `[from Teams QAs, 2026-09-28 09:26, Muhammad Faizuddin Bin Bidi]` |
| 2026-09-28 | uat4 | 2 Oct window (12175, 12342) | Charmain | `[from Teams QAs, 2026-09-28 10:52, Charmain Ea Chiang]` |
| 2026-09-28 | preprod1 | 1 Oct night (LKM Refund + EAINT-12403) | Charmain / Azfar | `[from Teams QAs, 2026-09-28 08:43, Charmain Ea Chiang]` |
| 2026-09-28 | Secarang /ia + cibo | 1 Oct morning Macrokiosk (11759, 12217, 12218) | Charmain | `[same]` |
| 2026-09-28 | sit2 | EAINT-12119 wholesale logistics, 12 Oct night | Lee An Qi | `[same]` |
| 2026-09-29 | uat1 | EAINT-12339 (5 Oct night) | Faizuddin | `[from Teams EAINT-12339, 2026-09-29 10:02, Muhammad Faizuddin Bin Bidi]` |
| 2026-10-02 | preprod1 | EAINT-12022 (14 Oct night) | Azfar | `[from Teams QAs, 2026-10-02 16:09, Amirul Azfar]` |
| 2026-10-06 | sit4 + wholesale UAT | EAINT-12119 merged changes | Wei Ting | `[from Teams EAINT-12119, 2026-10-06 11:05, Wei Ting Lim]` |
| 2026-10-07 | uat1 | EAINT-12430 | May / Brandon | `[from Teams EAINT-12431 group, 2026-10-07 10:55, Jin Siang Boo]` |
| 2026-10-13 | uat3 → JPJ Staging 2026-10-15 09:42 | EAINT-8622 | Charmain / Lim Xiwei | `[from Teams EAINT-8622, 2026-10-13 15:15, Charmain Ea Chiang]` `[same, 2026-10-15 09:42, Lim Xiwei]` |
| 2026-10-07 | /obs | Released (onboarding app) | — | `[from Teams via memory digest teams-catchup-2026-10-06-to-15, 2026-10-15]` |
| 2026-10-14 | uat1 → Wei Ting (wholesale), swapped with sit2; uat2 inactive | Wholesale | Wei Ting | `[from Teams via memory digest teams-catchup-2026-10-06-to-15, 2026-10-15]` |
| 2026-10-15 | preprod1 | Insurance Cancellation (EAINT-12022): Ops CS briefing 15 Oct; Runnerku UAT 14 Oct | — | `[from Teams via memory digest teams-catchup-2026-10-06-to-15, 2026-10-15]` |

Contradiction kept as found: Lim Xiwei announced EAINT-12166 "ready in staging/uat2"
(`[from Teams EAINT-12166, 2026-09-23 09:32, Lim Xiwei]`) while uat2 had been removed on
2026-07-06 and Faizuddin's sign-off names staging/uat1
(`[from Teams EAINT-12166, 2026-09-25 17:50, Muhammad Faizuddin Bin Bidi]`). The sign-off
is the stronger source; "uat2" is most likely a typo.

## 3. External connections and special states

| Date | Env | State | Source |
|---|---|---|---|
| 2026-05-20 | Secarang /ia | connected to **prod BoldPay** — "please dont do any payment for macrokiosk insurance trx for now" | `[from Teams DM-Charmain, 2026-05-20 16:11, Charmain Ea Chiang]` |
| 2026-06-08 | all | eSim brought down ~30 min for MacroKiosk tests ("will affect ALL staging env") | `[from Teams Main, 2026-06-08 08:33, Charmain Ea Chiang]` |
| 2026-06-10 | eauto | connected to insurer API | `[from Teams Main, 2026-06-10 11:28, Goh Kai Jiaeh]` |
| 2026-07-17 / 07-20 / 07-21 | uat1 | connected to RHB Staging for Shopping Cart E2E; switched back to eSim after Charmain's E2E 2026-07-21 10:02 | `[from Teams EAINT-12099 group, 2026-07-17 08:37, Goh Kai Jiaeh]` `[same, 2026-07-21 10:12]` |
| 2026-07-24 09:30–10:27 | Service Hub + PA/A on all branches | connected to the real email service, then reverted to Mailtrap | `[from Teams Main, 2026-07-24 09:26, Charmain Ea Chiang]` |
| 2026-07-28 night | all | hardware migration to new rack (EAINT-11988); staging down from ~20:30–21:00 | `[from Teams Main, 2026-07-28 18:35, Goh Kai Jiaeh]` |
| 2026-08-01 | uat1, then all branches after the 3 Aug merge | insurance JPJ enquiry, resubmit cover note and resubmit refer case cron jobs turned **off**; "If you need it for any testing then can ask Dev to turn on for that specific branch." | `[from Teams Main, 2026-08-01 08:47, Goh Kai Jiaeh]` |
| 2026-08-02 | staging | APT payment cron job (8pm daily) reverted | `[from Teams Main, 2026-08-02 12:04, Goh Kai Jiaeh]` |
| 2026-08-06 | eauto | connected to RHB staging for KJ's testing | `[from Teams Main, 2026-08-06 18:07, Goh Kai Jiaeh]` |
| 2026-08-07 | uat3 | connected to JomCheck staging | `[from Teams Main, 2026-08-07 08:52, Jin Siang Boo]` |
| 2026-08-11 | eauto | back to eSim for payment mode | `[from Teams Main, 2026-08-11 12:23, Goh Kai Jiaeh]` |
| 2026-08-19 | all | "no staging env is connecting to rafftech" (JomCheck third party) | `[from Teams QAs, 2026-08-19 15:27, Charmain Ea Chiang]` |
| 2026-08-14 | Secarang /ia only | mock payment enabled (Fiuu sandbox IP issue); /preprod needs Mong to enable | `[from Teams DM-Charmain, 2026-08-14 12:07, Muhammad Faizuddin Bin Bidi]` |
| 2026-09-01 | all | staging server ran out of storage; cleared | `[from Teams Main, 2026-09-01 16:22, Jin Siang Boo]` |
| 2026-09-01 | onboarding | "the application fee on staging is now same amount as production" | `[from Teams EAINT-11868 & 11982, 2026-09-01 14:31, Goh Kai Jiaeh]` |
| 2026-09-09 | uat1 | recreated from latest prod codebase instead of reverting 9306 changes | `[from Teams Main, 2026-09-09 15:50, Goh Kai Jiaeh]` `[from Teams QAs, 2026-09-09 15:59, Charmain Ea Chiang]` |
| 2026-09-17 | preprod1 | JPJ Staging; JPJ receipt goes to systemtest@eauto.my, Mailtrap does not receive it; eSim RHB-transfer prefixes TT/WZ/AA/SA/MC/QS/WT/PC left untouched | `[from Teams Main, 2026-09-17 12:11–12:15, Jin Siang Boo]` |
| 2026-09-18 | preprod1 | "no longer connected to jpj staging, now connected to esim" | `[from Teams Main, 2026-09-18 17:37, Wong Kar Kin]` |
| 2026-10-01 | uat3 | connected to RHB Staging | `[from Teams Main, 2026-10-01 12:57, Jin Siang Boo]` |
| 2026-10-12/15 | uat1 / uat3 | RHB Staging (12 Oct); uat3 JPJ Staging (15 Oct) | `[from Teams via memory digest]` |
| 2026-10-26 | uat3 / sit4 | Wholesale UAT moved to uat3 (was sit2); sit4 stays Wholesale dev/SIT. Both reserved for Wholesale CRs — "please try NOT to use the following environments for non-Wholesale CRs". Dashboard blocks automation runs on both (`lib/reservedEnvironments.ts`, `proxy.ts`) | `[from Teams notice pasted by Faizuddin, 2026-10-26; dev named: WeiTing]` |

## 4. Prod-to-staging merge-downs ("deploy latest prod code")

Request lists and dates, as posted in Main (QA asks, a dev answers; Wong Kar Kin's
replies are posted by Claude Code). Mass CI deploys of every branch within an hour on
the same day in the Deployment Notification log confirm the merge.

| Date | Requested by | Branches listed | Notes | Source |
|---|---|---|---|---|
| 2026-06-11 | Charmain | eauto, preprod1–3, sit3, uat1–3 | uat3 → Brandon, preprod1 → Tracey | `[from Teams Main, 2026-06-11 15:42, Goh Kai Jiaeh]` |
| 2026-06-16 | Azila | same | preprod1 conflict; preprod3 "recreate from prod" | `[from Teams Main, 2026-06-16 12:35, Jin Siang Boo]` |
| 2026-06-19, 06-24, 06-29 | Charmain | eauto, preprod1–3, sit2, sit3, uat1–3 | sit3 conflict 06-24 (KJ); sit2/uat3 skipped 06-29 as already latest | `[from Teams Main, those dates]` |
| 2026-07-07, 07-09, 07-16 | Charmain | /eauto/preprod1/(sit2)/sit3/sit4/uat1/uat3 | preprod1 + uat1 conflicts 07-16 | `[from Teams Main, those dates]` |
| 2026-07-21 | Charmain | + uat4 "as yesterday have prod jsp patching" | Brandon | `[from Teams Main, 2026-07-21 15:01, Jin Siang Boo]` |
| 2026-07-22, 07-28, 07-29, 07-30, 07-31 | Charmain / Azila | /eauto/preprod1/sit2/sit3/sit4/uat1/uat3/uat4 | sit3 conflict 07-30; preprod1 + uat3 conflicts 07-31 | `[from Teams Main, those dates]` |
| 2026-08-04 | Faizuddin | /eauto/preprod1/sit2/sit3/sit4/uat1/uat3/uat4 | — | `[from Teams Main, 2026-08-04 14:35, Muhammad Faizuddin Bin Bidi]` |
| 2026-08-07 | Charmain | + Secarang staging/preprod | Secarang conflict resolved by KJ 08-10 | `[from Teams Main, 2026-08-10 18:17, Goh Kai Jiaeh]` |
| 2026-08-13, 08-18, 08-20 | Charmain | eAuto branches | announced "at 2.00pm/2.30pm" in QAs first | `[from Teams QAs, 2026-08-18 10:18 / 2026-08-20 10:46 / 2026-08-13 14:14, Charmain Ea Chiang]` |
| 2026-09-02 | Charmain | — | "for morning deployment? if yes, then no need to back merge ya" | `[from Teams Main, 2026-09-02 14:03, Jin Siang Boo]` |
| 2026-09-03 | Charmain | — | wholesale-only deploy: "no changes on eAuto ya. Then, all staging branch is latest prod code base d ya" | `[from Teams Main, 2026-09-03 15:01, Jin Siang Boo]` |
| 2026-09-08, 09-10, 09-15, 09-18, 09-21, 09-28, 10-02 | May / Charmain / Faizuddin / Azila | eAuto/eauto/preprod1/sit2/sit3/sit4/uat1/uat3(/uat4) | 09-28: /eauto blocked by merge conflict | `[from Teams Main, those dates]` |
| 2026-10-01 | Charmain | Secarang/preprod | — | `[from Teams Main, 2026-10-01 14:32, Charmain Ea Chiang]` |
| 2026-10-06, 10-07, 10-08 | (automated) | "Prod sync to staging" cards: eauto, preprod1, sit2, sit3, sit4, uat1, uat3, uat4 | 10-07 sit3 Tomcat undeploy timeout, fixed 18:57 | `[from Teams DN, 2026-10-06 17:25 / 2026-10-07 18:26 / 2026-10-08 15:54, Workflows]` |

The 2026-10-15 QA Portal could not release uat3 because it looked for a deployment
window of 15 April 2025 for EAINT-8638; fixed 2026-10-13.
`[from Teams QA-Portal-Feedback, 2026-10-13 09:10, Charmain Ea Chiang]`

## 5. Working rules for claiming and sharing environments

1. **Claim in the QA group first, then tell dev, then record it in the QA Portal.**
   Template used by every QA: "Hi Everyone. I plan to use /uat1 for 28th Sept deployment
   items. Does anyone have any concerns on this? If no, i will proceed to inform dev and
   update the QA Portal ya" `[from Teams QAs, 2026-09-21 15:10, Muhammad Faizuddin Bin Bidi]`
   "ok please assign the branch to your deployment window in qa portal ya"
   `[from Teams QAs, 2026-09-15 15:26, Charmain Ea Chiang]`
2. **Pick from the resource board.** "you can check here in the QA resource planning miro
   ya … check whether there is any available staging env … please double confirm in QA
   group before you proceed to inform dev ya" `[from Teams DM-Charmain, 2026-08-04 12:32–12:34, Charmain Ea Chiang]`
   From 2026-09 the QA Portal Branches tab shows branch status: "Azfar, you can actually
   check the branch status in qa portal" `[from Teams QAs, 2026-09-08 12:29, Charmain Ea Chiang]`
3. **One environment per deployment window.** "yup all items under the same deployment
   window should use the same staging env ya" `[from Teams DM-Charmain, 2026-08-04 17:32, Charmain Ea Chiang]`
4. **Dev waits for QA's green light before deploying to any staging branch.**
   "please wait for QA's greenlight ya, dont deploy to any staging env first"
   `[from Teams EAINT-12028, 2026-08-28 14:36, Charmain Ea Chiang]`; same message to dev
   `[from Teams EAINT-8622, 2026-08-12 08:32, Charmain Ea Chiang]`; BA wording
   "Kindly get greenlight from QA whether to deploy to which staging before u deploy to any
   staging ya" `[from Teams EAINT-11864, 2026-07-27 12:57, Yi Link Lim]`
5. **Do not deploy tickets that are not in an upcoming window.** "okok, don't anyhow
   deploy tickets that are not part of upcoming deployment window" `[from Teams QAs, 2026-09-08 11:53, May Chin Mei Theng]`
6. **Wholesale branch.** In Aug–Sep 2026 one branch was kept for Wholesale CRs:
   "sit2 we usually reserve for wholesale related cr ya" `[from Teams QAs, 2026-08-20 17:39, Charmain Ea Chiang]`
   (dated practice; by 2026-10-14 the wholesale branch had moved — see §1).
7. **Merge down after every production deployment, once prod is stable.** QA monitors
   production until lunch/2pm, then asks dev: "If everything remains stable, i will request
   dev to merge the latest prod code base into the other staging branches ya"
   `[from Teams QAs, 2026-10-01 08:59, Charmain Ea Chiang]`; announced with a time in
   the QA group: "i will request dev to merge down the latest prod codebase at 2.00pm ya,
   let me know if anyone has any concerns" `[from Teams QAs, 2026-08-18 10:18, Charmain Ea Chiang]`
   Exceptions stated by dev: none needed after a morning patch-style deployment
   `[from Teams Main, 2026-09-02 14:03, Jin Siang Boo]`, and none after a wholesale-only deployment
   `[from Teams Main, 2026-09-03 15:01, Jin Siang Boo]`. After merge-down the QA clicks
   **Release** for that branch and **Merge down all** in the QA Portal
   `[from Teams DM-Charmain, 2026-09-21 15:35, Charmain Ea Chiang]`.
8. **Shared test data.** Resetting shared staging data needs everyone's agreement:
   "please check with all the QAs here ya as it will affect everyone's test data in Staging
   Env, if no concern then u can proceed. Or else u provide & ask Brandon to reset your
   transactions only" `[from Teams QAs, 2026-09-10 14:40, May Chin Mei Theng]`
   Fee changes on one branch "will impact all the staging branch"
   `[from Teams QAs, 2026-09-10 10:02, Amirul Azfar]`.
9. **Announce anything that affects others.** Turning on MessageBird: "remember to
   inform in QA group and Main Group before you connect to messagebird ya"
   `[from Teams DM-Charmain, 2026-08-06 11:00, Charmain Ea Chiang]`, with a window
   ("Messagebird will be enabled from 2.30pm to 3.30pm today. Kindly avoid from making any
   insurance transaction ya") `[from Teams Main, 2026-08-05 14:11, Muhammad Faizuddin Bin Bidi]`.
   Walkthroughs: "Please ensure the staging is stable during the session"
   `[from Teams Main, 2026-09-25 10:28, Yi Link Lim]`. Whole-day freezes are announced
   too (reconciliation testing: "avoid creating any transactions in the staging environment
   throughout the entire day") `[from Teams Main, 2026-06-19 17:00, Siti Nur Azila]`.
10. **SIT/UAT on a JPJ-connected branch freezes it.** "Please do not make any changes or
    create any transactions in staging/preprod1 until the SIT is completed"
    `[from Teams Main, 2026-09-17 09:45, Charmain Ea Chiang]`; UAT "normally will last whole
    day, until 5pm then continue tmr" `[from Teams DM-Charmain, 2026-09-22 12:03, Charmain Ea Chiang]`.
11. **Transactions made on one branch are not visible on another.** Data created on
    /eauto must be migrated by dev to the test branch to be checked there
    `[from Teams QAs, 2026-08-12 10:52, Charmain Ea Chiang]`.
    **Conflict:** Charmain's EAINT-12155 evidence notes (written 2026-09-07) say
    "`/eauto` and `/uat1` are two builds over ONE database" — a change on one
    instance is visible on the other, and she used it to mint pre-CR accounts for
    the post-CR build. The two statements were made about a month apart and may
    describe different periods or different data (accounts vs transactions).
    Treat cross-branch visibility as `[unconfirmed]` per pair of branches and per
    date; ask dev before relying on it.
    `[charmain-repo: .claude/skills/test-evidence-recording/references/eaint-12155.md:3-4, 111-113]`
12. **CI notifications.** Since 2026-07-09 every staging build posts a "Staging deploy
    started / succeeded / failed" card to *eAuto Deployment Notification*
    `[from Teams Main, 2026-07-09 17:12, Wei Ting Lim]`; QA uses it to confirm a branch was
    redeployed ("The eauto deployment notification said got uat1 deploy this morning at
    7.40am ish") `[from Teams DM-Charmain, 2026-09-15 14:49, Muhammad Faizuddin Bin Bidi]`.
    From 2026-10-06 prod-sync cards close with "Please pull the latest before pushing to
    these branches." `[from Teams DN, 2026-10-06 17:25, Workflows]`
13. **Script on the CR build early; test only after the branch has the latest prod code.**
    When a deployment has just gone out, the chosen branch must be merged down first:
    "all staging branch need to merge down the latest codebase first ... because yesterday
    night + this morning we had deployment" and "can ask dev to push the CR changes first
    for you to start scripting, but i would suggest you to start testing after merge down
    prod latest codebase" `[from Teams eAuto QAs, 2026-10-21 10:15–10:19, May Chin Mei Theng]`.
    The prod-sync card for a branch that holds a CR says the CR was kept: "eAuto staging/uat1
    Synced with prod/master 37c4c6577d via !4955 ... EAINT-12253 kept."
    `[from Teams DN, 2026-10-22 07:47, Workflows]`
