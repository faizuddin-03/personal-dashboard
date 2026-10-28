# Addenda from the Teams sweep (2026-10-16)

Facts for existing knowledge files, grouped by target file. Nothing here has been applied. The raw sources are in `_reference/teams/`.

## knowledge/releases.md

1. 2026-07-08 night: 8 items, among them EAINT-5972, 10164, 11731, 11763, 11835, 11857, 11877, 11887. `[from Teams eAuto & Secarang Main Group, 2026-07-08 15:51, Yi Link Lim]`
2. 2026-08-03 morning: EAINT-11855 (APT auto reset on RHB RE), 11977, and 2 more. `[from Teams eAuto & Secarang Main Group, 2026-07-31 17:56, Yi Link Lim]`
3. 2026-08-06 patch: EAINT-12130. `[from Teams EAINT-12130, 2026-08-06 14:26, Jin Siang Boo]`
4. 2026-08-07: EAINT-11540, 11878, 4459, 12110, 12111. `[from Teams eAuto QAs, 2026-08-10 09:15, Faizuddin huddle agenda]`
5. 2026-08-17 night: 5 items incl. EAINT-11952. `[from Teams eAuto & Secarang Main Group, 2026-08-17 16:33, Yi Link Lim]`
6. 2026-08-20 morning: EAINT-11864, 12054, and others. `[from Teams eAuto & Secarang Main Group, 2026-08-19 18:23, Yi Link Lim]` Same day: EAINT-12219 (patched) and EAINT-12215 (no QA).
7. 2026-09-08: EAINT-12180 hot patch, after Ops approval. `[from Teams EAINT-12180, 2026-09-08 09:26, Yi Link Lim]`
8. 2026-09-10 morning: EAINT-12155 and 12171. `[from Teams EAINT-12155, 2026-09-09 17:04, Goh Kai Jiaeh]` "Latest prod + EAINT-12155 + EAINT-12171"
9. 2026-09-15 morning: EAINT-9306 (08:38). `[from Teams EAINT-9306]`
10. 2026-09-17 night: EAINT-12289. `[from Teams EAINT-12289, 2026-09-17 11:17, Amirul Azfar]`
11. 2026-10-01 morning: EAINT-11759. `[from Teams EAINT-11759, 2026-09-17 22:53, Charmain Ea Chiang]`
12. 2026-10-01 night: EAINT-12403 (STMS/APT price change). `[from Teams eAuto QAs, 2026-09-28 09:31, Charmain Ea Chiang]`
13. 2026-10-02 morning: EAINT-12175 (08:36, KJ). `[from Teams EAINT-12175]`
14. 2026-10-08 morning: EAINT-12430. `[from Teams EAINT-12431, 2026-10-08 09:23, May Chin]`
15. 2026-10-12 night: EAINT-12119 (Wholesale logistics price tiers). `[from Teams EAINT-12119, 2026-10-09 14:34, Mei Jia Chee]`

## knowledge/cr-ledger.md

1. EAINT-12166: dev's "ready in staging/uat2" (2026-09-23 09:32, Lim Xiwei) contradicts QA's sign-off "on staging/uat1" (2026-09-25 17:50, Faizuddin). uat2 had been removed on 2026-07-06. Add a note to §12166.
2. EAINT-12339: the API limit is 20 reports/day under v2.0. `[from Teams EAINT-12339, 2026-09-30 11:03, Faizuddin]` Any older "10/day" note is stale.
3. EAINT-12028: dev moved to Kasheng Liew on 2026-09-24. KIV bug found on 2026-09-29. The deploy needs downtime. See `teams-decisions-by-ticket.md` Part B.
4. Add "Tickets seen only in Teams" rows pointing to `teams-decisions-by-ticket.md` Part A: 8622, 11759, 11878, 12019, 12054, 12055, 12119, 12121/12230, 12123, 12124, 12130, 12155/12125, 12171, 12180/12253, 12219, 12289, 12299, 12342, 12344, 12348, 12386, 12406, 12424, 12430/12431/12329.

## knowledge/qa-process-from-notion-export.md

1. Leave notice for 3 or more days: the Notion export says 2 weeks. Teams says 1 month.
   `[from Teams ModeFair QA Automation Engineer Team, 2026-04-15 12:46, Kasturi]` "at least 1 month in advance"
   Mark the Notion line as superseded.

## .claude skills: qa-timesheet-update, and memory capacitytrack-setup.md

1. `[from Teams ModeFair QA Automation Engineer Team, 2026-10-05 17:59, May Chin Mei Theng]` "starting from today no need to fill in the CapacityTracker timesheet ady ya."
   The skill and the memory note still assume weekly CapacityTrack submission. Faizuddin must decide whether to retire or keep them.

## knowledge/eauto-portals.md

1. Bank portal login path: `/eauto/bank/login/`. Insurance (motor) portal login path: `/eauto/motorInsurance/login/`. Insurance company user admin is hidden from the BO menu and reachable only by URL (`/eauto/view/insurance/company-account/user/`); there are about 6 insurance users.
   `[from Teams EAINT-12155, 2026-08-13 15:04, Leong Jin Chuen]` `[same chat, 2026-08-13 15:55, Jin Siang Boo]`
2. The eAuto mobile app shares the web DB. `[from Teams EAINT-12155, 2026-09-02 11:53, Charmain Ea Chiang]`
3. The UCD and AATF footer still reads "Best Compatible With Mozilla Firefox V36.0.4". Firefox access ends on 1 Jan 2027 (EAINT-12180/12253).

## knowledge/eauto-payments.md

1. RHB Ref 2 longer than 30 characters returns "ED". `[from Teams EAINT-12099 group, 2026-07-17 10:23, Goh Kai Jiaeh]`
2. Failed-payment reset in staging and prod is done by calling the API as a logged-in user. Only certain admin users can do it; in prod it uses Izni's account. `[from Teams EAINT-12289, 2026-09-10 14:21, Jin Siang Boo]`
3. For APT patch requests, Ops use the BO "Reset" button. `[from Teams eAuto & Secarang Main Group, 2026-06-25 10:57, Mei Jia Chee]`
4. Fiuu: Secarang and eAuto use different merchant accounts. BNPL is an option inside the GrabPay and ShopeePay apps. ShopeePay fails in the sandbox. `[from Teams EAINT-12107]`
5. Fiuu bank simulator list: https://bank-simulator.fiuu.com/faq `[from Teams EAINT-12153 group]`
6. All insurers use the same payment gateway, so payment can be tested with one insurer. `[from Teams eAuto QAs, 2026-09-11, Goh Kai Jiaeh via QA post]`

## knowledge/eauto-insurance.md

1. Cron intervals, daily 8am–11pm: Secarang JPJ Status and Cover Note 1 min; eAuto Cover Note 5 min; eAuto JPJ Status 1 min. `[from Teams EAINT-12171, 2026-09-02 13:11, Charmain Ea Chiang]`
2. Insurance JPJ enquiry, resubmit cover note and resubmit refer-case cron jobs are off in staging; ask dev to turn them on per branch. `[from Teams eAuto & Secarang Main Group, 2026-08-01, Goh Kai Jiaeh]`
3. To simulate an insurer API that is down, use eSIM insurance quotation Lonpac/TMIM = false. `[from Teams DM Charmain Ea Chiang, 2026-06-03]`
4. Secarang WhatsApp recipients after EAINT-11759: Payment success goes to the user only; Cover note failed and JPJ rejected go to Shamini only. `[from Teams EAINT-11759, 2026-09-14 10:05, Batrisyia]`
5. The quotation reminder email is sent 7AM–11PM; emails due overnight go out at 7AM. `[from Teams EAINT-11864, 2026-07-29 12:41, Yi Link Lim]`

## knowledge/flow-edereg.md

1. eDereg pre-check statuses: Active, Approved, Failed - Vehicle Not Exist, Failed - JPJ Error Code, Expired (after 6 months). Dereg statuses: Active, Expired (after 6 months). `[from Teams DM Charmain Ea Chiang]`
2. The pre-check company email comes from the backend field `deregPrecheckCompanyEmail`. It is blank for new AATF accounts. `[from Teams eAuto QAs, 2026-09-09 15:57, May Chin Mei Theng]`
3. AATF payment refs:
   1. Dereg: TransType DRG, Ref 1 `DRG<yymmdd><6>-<VN>`, Ref 2 `DRG`.
   2. Pre-check: TransType DPC, Ref 1 `DPC<yymmdd><6>-<VN>`, Ref 2 `DPC<yymmdd><6>`.
   `[from Teams EAINT-12348, 2026-10-12 09:27, Sia Zhong Tai]` ("i think its like this oh", so the format is uncertain)
4. The AATF company email is set in BackOffice > Manage AATF/PBT Account. `[from Teams EAINT-12348, 2026-10-14 15:43, Sia Zhong Tai]`

## knowledge/flow-device-purchase.md / eauto-service-hub.md

1. Reference formats: SRI{Year}{Month}{6} and SRB{Year}{Month}{6}. The month is 1–9, then O, N, D. `[from Teams EAINT-12099 group, 2026-07-14 09:50, Charmain Ea Chiang]`
2. The free software installation appointment is valid for 2 months from purchase. `[from Teams EAINT-12099 group, 2026-07-20 16:34, Kin Hang Aw]`
3. A parcel holds at most 10 devices, an order at most 40. `[from Teams EAINT-12167, 2026-08-14 10:08, Yi Link Lim]`
4. The BDP email Paid Amount is the total paid; a free installation shows "-". `[from Teams EAINT-12124, 2026-09-28 09:34, Kasheng Liew]`

## knowledge/quirks.md

1. Every staging branch runs the APT payment cron at the same time, which can mark an already-paid transaction Failed. Dev changed it to every 30 min on the test branch. `[from Teams EAINT-12289, 2026-09-11 17:45, Jin Siang Boo]`
2. EAINT-12275 (server does not check that Password and Confirm Password match) exists in prod. It is parked under EAINT-148. `[from Teams EAINT-12155, 2026-09-04 16:40, Charmain Ea Chiang]`
3. The JPJ receipt email goes to systemtest@eauto.my while a branch is connected to JPJ staging; Mailtrap will not show it. `[from Teams eAuto & Secarang Main Group, 2026-09-17]`
4. The Teams sidebar shows "Unknown User" for some former or external members (Nur Izfarwiza, Leong Jin Chuen, Batrisyia, Wong Kar Kin). Match them by context.

## knowledge/automation-testing.md

1. Team repo for CR and regression scripts: `github.com/modefair/eauto-qa-automation`, using the `consolidate` branch flow. `[from Teams eAuto QAs, 2026-09-15 18:46 and 2026-09-30 10:31, Hui Xin Lee]`
2. Older team repo: `github.com/modefair/eautoAutomation-Playwright`. `[from Teams eAuto QAs, 2026-09-14 09:50, Hui Xin Lee]`
