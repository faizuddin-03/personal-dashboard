# eAuto mobile app (Android / iOS / iPadOS) — testing flow

What QA needs to test the UCD mobile app. Web portal behaviour stays in the
module files (`flow-stms.md`, `flow-estm.md`); this file holds what is
app-only. Overview and twin tickets: `flow-platform.md` § "eAuto mobile app".
Raw captures: `_reference/tickets/EAINT-9805/EAINT-9805-mobile-app-sources-2026-10-28.md`.

## 1. Release phases (epic EAINT-7554 "eAuto Mobile App")

1. Phase 1 EAINT-5566 and Phase 2 EAINT-6014 (eLKM, SSM): "Ready for Prod Deployment". `[jira: 2026-10-28]`
2. Phase 3 EAINT-6015, Phase 4 EAINT-7109, Phase 5 EAINT-6016: requirement stage or To Do. `[jira: 2026-10-28]`
3. Phase 6 EAINT-9805: "To complete STMS module same as Production Web Portal" / "Can roll out this with STMS module only, can hide other modules if haven’t ready." QA field = Hui Xin Lee. `[jira: EAINT-9805 description]`
4. Open Phase 6 sub-tasks on 2026-10-28: EAINT-12567 STMS LKM Refund (Code Review), EAINT-12592 [iOS] biometric login Face ID / Touch ID with saved accounts (In Development), EAINT-12637 Insurance Cancellation (In Development). `[jira: 2026-10-28]`
5. **Phase 6 SRD scope** (SRD v0.1, 06.02.2026, "Initial Draft"): Portal "UCD Mobile App"; Module "STMS Module"; Area "1. Whole STMS flow include Transfer History, e-invoice & JPJ Official Receipt." `[from ticket EAINT-9805, SRD v0.1 §2.2.1 rows 2–4]` [source: pipeline EAINT-9805, Scout study, 2026-10-29]
6. **Phase 6 screens** (Figma items, SRD §1.5 rows 1–9): "Figma Design – STMS Transaction Listing", "Figma Design – STMS Transaction Details Page", "Figma Design – STMS Individual Category (MyKad)", "Figma Design – STMS Individual Category (MyPR)", "Figma Design – STMS Company Category", "Figma Design – STMS + Transfer History Individual Category", "Figma Design – STMS + Transfer History Company Category", "Figma Design – UCD to UCD (Standard)", "Figma Design – UCD to UCD (Interstate)". `[from ticket EAINT-9805, SRD v0.1 §1.5]`
7. **SRD v0.1 has no numbered requirements** (glossary rows, §2.1.3 "Additional Note(s)" and §2.2.1 "Additional Criteria" blank). The reference is production web STMS as of 29.01.2026 (`flow-stms.md`); later web changes reach the app as Phase 6 sub-tasks. `[from ticket EAINT-9805, SRD v0.1 §1.4, §2.1.3, §2.2.1]` [source: pipeline EAINT-9805, Scout study, 2026-10-29]
8. **Phase 6 sub-tasks on 2026-10-29: 18.** New since 2026-10-28: EAINT-12663 "[Android] Test Coverage Audit V1"; EAINT-12666 "[iOS] Bottom tab bar with Help and Account pages (settings page)"; EAINT-12667 "[Android] E-invoice implementation"; EAINT-12668 "[Android] LLP Business Type"; EAINT-12683 "[iOS] STMS LKM Refund Module". Statuses not captured. `[jira: EAINT-9805 sub-tasks, 2026-10-29]`
9. **iOS is in active development in Phase 6**: EAINT-12592 "[iOS] Biometric login (Face ID / Touch ID) with saved accounts", EAINT-12666 (bottom tab bar, Help and Account pages), EAINT-12683 "[iOS] STMS LKM Refund Module". `[jira: EAINT-9805 sub-tasks, 2026-10-29]`
10. **App-only rule:** Android has rooted device handling — EAINT-12570 "[Android] Implement Rooted Device Handling". Expected app behaviour on a rooted phone not read. [unconfirmed] `[jira: EAINT-9805 sub-tasks, 2026-10-29]`

## 2. Getting the app (from Phase 2)

1. "Provide your Google Play Store email address to Desmond to be added to the tester list." `[gsheet EAINT-6014, PROGRESS TRACKING]`
2. "The UAT App is linked to the staging environment" — check web results on the same staging instance. Phase 1 used sit3, Phase 2 sit1. `[same]` Phase 6 instance not stated. [unconfirmed]
3. Updates are manual: "we need to manually update the app with this link whenever the latest version is released". `[same]`
4. A shared Play Store test account is listed in the EAINT-9805 workbook, sheet "Device & Test Scope", R57–R59. Do not copy the password. `[sharepoint: EAINT-9805]`

## 3. Evidence and bug reports

1. Evidence: "screen mirroring our Android phone to laptop and screen recording". Tools: "Dr. Fone Air, or Phone Link". `[gsheet EAINT-6014, PROGRESS TRACKING]`
2. Every bug and retest states the **device model, OS, app version and build number**. "raise them under respective APP version and build number". `[same]`
3. Compare app results on web: UCD and BO Transaction Listing / Details, BO JPJ XML Log (STMS). `[same]`

## 4. Biometric readers on the app

1. **Dermalog = USB** (OTG). **Iris = Bluetooth.** `[sharepoint: EAINT-9805, Device & Test Scope R30, R38]`
2. "Iris" is a **card reader** brand, not an eye scanner: "had included iris card reader also" `[teams: eAuto-Secarang Main Group, 2026-10-16 16:55, Kasheng Liew]`. [unconfirmed] It reads MyKad + thumbprint like Dermalog, so "Capture a thumbprint" under Iris (R41) is likely correct.
3. Support matrix `[sharepoint: EAINT-9805, sheet "Iris & Dermalog Support"]`:
   1. Android 8–12: Dermalog only.
   2. Android 13–15: both.
   3. Android 16–17: Iris only — "Dermalog does not officially support Android 16 and above." If it fails, "the app should show a clear message and must not crash or freeze. Raise it to SA".
   4. iOS 14–27 and iPad: Iris only.
4. Dermalog on Android needs a **runtime licence** on the phone. Phase 2 testers without it marked thumbprint rows N/A: "*without runtime license". `[gsheet EAINT-6014, P2 - Compatibility Test]`
5. Web Dermalog uses a local WebSocket (`flow-platform.md`); the app talks to the reader directly over USB / Bluetooth. Web error texts are a starting point only. [unconfirmed which texts the app reuses]
6. **App Dermalog-missing prompt (Phase 1 SRD)**: title "Fingerprint Verification", content "Please plugin the dermalog to continue fingerprint verification". STMS Step 1 buttons "Read MyKad" / "Verify" / "Next" (not the web [Scan IC] / [Reconnect]). `[from ticket EAINT-5566, SRD STMS V1.0, Tables 2.5.2.1 and 2.5.3.1]` [source: pipeline EAINT-9805, Scribe related history, 2026-10-29] Whether Phase 6 keeps these texts: [unconfirmed]
7. **App no-card prompt (seen on the app, 2026-11-03)**: pop-up title "Read MyKad", text "Please insert your MyKad to the dermalog.", button [OK]. Not the web text "No card is detected. Please insert IC and click [Scan IC] to try again." `[Faizuddin, app screenshot 2026-11-03: _reference/tickets/EAINT-9805/EAINT-9805-app-MK_TS02-no-card-popup-2026-11-03.png]` Which reader was connected for the screenshot (Iris or Dermalog): [unconfirmed].

## 5. Interruption rules already tested (Phase 2)

Source: `[gsheet EAINT-6014, Functional & Interruption Test R78; P2 - Compatibility Test]`.

1. Non-thumbprint pages (login, home, listing, details, steps): call / message / notification → stay on page; rotate → stays portrait; Home or Overview then reopen → stay on page; Back = in-app Back ("Back in login page / homepage will kill the app"); no network → toast "No internet connection"; lock / unlock → stay on page; kill and reopen → "Launch from Homepage (Login page will remain)".
2. Thumbprint steps (STMS / eSTM Step 1 and Step 3): Home, Overview + switch app, lock / unlock → "Remain on the same page - Auto refresh the page, need to rescan MyKad & redo thumbprint".
3. Idle 1 hour in background → "Your session has expired Please log in again to continue." above Username.
4. Phase 6 plan lists tablets in portrait and landscape: "Rotate the tablet in the middle of a flow and check that the data is still there". `[sharepoint: EAINT-9805, R49–R50]` **Superseded for now:** "tablet and phone will disable autorotate screen (for now - the screen roate will be a later phase)" `[Faizuddin, f2f discussion notes, 2026-10-29]`. No rotation TS until that later phase.
5. **Phase 2 TS size**: tab "Functional & Interruption Test" holds 101 TS ids, all "PASS": 3 login, 34 STMS functional, 35 eSTM functional, 30 eSTM interruption. STMS interruption is in "P2 - Compatibility Test", not this tab. `[_reference/tickets/EAINT-9805/EAINT-6014-app-phase2-TS--Functional-and-Interruption-Test.csv]` [source: pipeline EAINT-9805, Scribe related history, 2026-10-29]

## 6. Phase 6 test depth (EAINT-9805 plan)

1. Full E2E: Android 15 and iOS 27 (⭐ rows). Short checks on the others. "Can use" check on tablet and iPad. `[sharepoint: EAINT-9805, Device & Test Scope]`
2. Manual full testing = "Iris and Dermalog full testing, including negative testing", face / fingerprint login, interruption testing. `[same, R19–R22]`
3. Edge-to-edge check, Android 16 and 17 only: buttons and text not hidden under the status bar or navigation bar. `[same, R27]`
4. Iris TS: lead asked for a new tab in the EAINT-9805 workbook, modelled on the EAINT-7229 Dermalog WebSocket TS. `[lead message to Faizuddin, 2026-10-28]`
5. The eAuto mobile app is a **native installed app** (Android / iOS), not a Chrome browser or web view of the portal. Web-only TS (browsers, installer, HMAC via F12, one-tab rule) do not apply. `[Faizuddin, 2026-10-29]`
6. Faizuddin's role on EAINT-9805: **manual** — write the Iris manual TS tab and do manual testing. Automation stays with Hui Xin. `[Faizuddin, 2026-10-29, per lead message 2026-10-28: "Please add the manual TS in EAINT-9805 excel by creating a new tab ya."]`
7. **Expected results come from web first**: "for expected results, always check with the web first. because for all behaviours, the mobile will always follow web. only the special cases where the mobile app have, but web doesnt have" `[Faizuddin, dashboard chat to Scribe, 2026-10-29, f2f meeting notes]`
8. **Biometric focus**: "Focus on STMS > eSTM"; "Hui Xin bypass, so need to focus on the biometric side. So focus mainly on biometric, but can sometimes create end to end"; "Also need to check any part of the systems that is related to the thumbprint". `[same]`
9. **Thumbprint outputs to check**: "perakuan [check the thumbprint picture]"; "check other documents like, LKM refund also/insurance cancellation". `[same]`
10. **Workbook tabs**: "put interruption testing as one seperate tab in the excel"; "biometric also one seperate tab"; "for short check, also need seperate tab in the workbook". `[same]`
11. **Every scenario has a priority**: "Put priority for every scenario". `[same]`
12. **Iris scenarios to cover**: "UI for IRIS in step 1 and 3 (need to check and confirm if UI same or different, and how it would show in the app)"; "For IRIS, need to include scenario for bluetooths (think of all the possible scenarios that may happen from the UCD side)". `[same]`
13. **Other checks**: "Performance testing (can check the excel file)"; "edge to edge display - got any ui break when change screen (like fold phones)". `[same]`
14. **Setup and scope notes**: "dont forget to install mykad simulator"; "Mobile app does not have AATF". `[same]`
15. **Model TS for the manual tabs**: "what need to focus on - 6014/7229" — EAINT-6014 (app Phase 2 TS) and EAINT-7229 (web Dermalog WebSocket TS). `[same]`
16. **Earlier app phases have no QA TS**: Phase 3 EAINT-6015, Phase 4 EAINT-7109 and Phase 5 EAINT-6016 have QA field blank and no QA Team TS workbook; Phase 1 EAINT-5566 has no TS workbook either. UCD to UCD and Transfer History have no past app TS; the only references are web TS (EAINT-11057 usage code AH, EAINT-12403 RM35 tile, EAINT-9058 Invoice / e-Invoice). [source: pipeline EAINT-9805, Scribe related history, 2026-10-29]
17. **"Focus on STMS > eSTM" (item 8) is weight, not test order**: more scenarios on STMS, fewer on eSTM. "its not actually order. its the things that we need to focus on. means focus more on STMS, and then eSTM" `[Faizuddin, dashboard chat to Scribe, 2026-10-29]`
18. **TS ids for the EAINT-9805 workbook**: "use 9805_XX_TS01 (the xx is short form of what part or sub-section it is)". Numbering restarts at TS01 for each sub-section prefix (e.g. **9805_IP_TS01** — Iris pairing and permission). `[Faizuddin, dashboard chat to Elf, 2026-10-29]`
19. **No scenario cap; three tabs**: "it doesnt have a cap. can make more if needed. and like i said before, split to biometric, interruption, others". Short check, performance and screen display sit in the **Others** tab. `[same]`
20. **Detail level**: "i want the biometric to be detailed, as well as the layout for the flip phones". `[Faizuddin, dashboard chat to Elf, 2026-10-29]`
21. **Fold phones only, no flip phone**: "my bad, it should be fold only" (reply to Elf asking which device runs the flip phone cover-screen / half-fold TS). The only fold device listed is the Galaxy Z Fold 7 (Device & Test Scope R6). `[Faizuddin, dashboard chat to Elf, 2026-10-29]`
22. **Extra TS reference (read only)**: a QA Team SharePoint workbook, https://modefair.sharepoint.com/:x:/s/QATeam/IQATazEqqQyWTqGjUxhQ-65oAdN4QrDTynGfSazAg5i58XM?e=PHLVW6 — "access this sharepoint to READ ONLY ... use this as reference for the test scenarios also". File name and content not read yet. [unconfirmed] `[Faizuddin, dashboard chat to Elf, 2026-10-29]`
23. **That reference is the EAINT-7229 workbook (web Dermalog TS)**: "check my personal onedrive for csv file EAINT-7229" `[Faizuddin, dashboard chat to Elf, 2026-10-29]`. Full copy (13 sheets) in his OneDrive `eAuto Documents\EAINT-9805\Reference EAINT-7229 - [eAuto] To update frontend to Chrome (including replacing applet with web socket).xlsx`; same TS ids and messages as the synced QA Team copy. [source: pipeline EAINT-9805, Elf scenarios, 2026-10-29]
24. **Iris Bluetooth connectivity cases to cover**: "we will need more scenarios to cover bluetooth connectivity. for example, walk away until device disconnected, multiple device, loss of power" `[Faizuddin, dashboard chat to Elf, 2026-10-29]`
25. **Interruption types to cover (Phase 6)**: "include stuffs like sim call, sim message, whatsapp call, whatsapp message, alarm, device suddenly power off, loss of internet connection, loss of mobile data, lost bluetooth connection, etc." Wider than the Phase 2 list in §5. `[same]`
26. **Finger variants to cover**: "also need to include scenarios such as different fingers, partial press fingers (like half of the fingerprint touches the biomtric)". Past TS cover only right / left thumb and wrong thumb (7229_TP_TS1–TS3). Server check rules behind these cases: `flow-platform.md`, reader flow, "Shared reader panel and server check". `[Faizuddin, dashboard chat to Scribe, 2026-10-30]`
27. **Biometric during an active call**: "add scenario to test using biometric WHILE on call (loudspeaker or something), both sim and whatsapp call". Whether the Iris reader stays connected while call audio runs on Bluetooth earbuds is [unconfirmed] (open with the developer). `[Faizuddin, dashboard chat to Elf, 2026-10-30]`
28. **Iris power source not known**: "not confirmed the device what style, but if use battery, remove battery. if use plug power, unplug the power". Power-loss TS cover both. `[Faizuddin, dashboard chat to Elf, 2026-10-30]`
29. **Other cards to read**: "read other cards (with and without chip in the same place as IC chip)" (e.g. debit card, access card, driving licence). `[same]`
30. **Device / OS columns on every tab**: "for each tab, should have column for what device i tested with and the OS version (include both android and ios)". Workbook columns **Android Device | Android OS | iOS Device | iOS OS**, cells greyed where a TS does not run on that platform (Dermalog and fold phone = Android only; Face ID = iOS only). `[same]` [source: pipeline EAINT-9805, Elf scenarios, 2026-10-30]
31. **Biometric login is in scope**: "phones and tablets have another login function which is using biometric (face/fingerprint). those ones need to test too". Rules in §7. `[Faizuddin, dashboard chat to Scribe, 2026-10-30]`
32. **OS result columns only where used**: "for the operating system rows, if the tab doesnt have at least 1 scenario for it, then remove that column in that tab. i want to avoid too much cluttering". `[Faizuddin, dashboard chat to Elf, 2026-10-30]`
33. **More interruption cases at the thumbprint step**: "fingerprint while clicking power button" / "fingerprint while saying hey google/hey siri". Whether a power-button press acts like a lock (MyKad rescan) and whether a voice assistant forces a rescan are [unconfirmed] (open with the developer). `[Faizuddin, dashboard chat to Elf, 2026-10-30]`
34. **Short-check TS open on every short-check OS**: "for every TS that says something like need to do on every short check device, make sure all cells for each OS have dropdown, since each OS needs to do the shortcheck" `[Faizuddin, dashboard chat to Elf, 2026-10-30]`. Short-check devices per the workbook: Android 13 / 16 / 17 R5–R6 "Manual short check: Iris and Dermalog (see Dermalog note)" / "Same as Android 16"; iPad R10 "Manual short check: Iris + 1 biometric login (Touch ID)"; iOS 18 / 26 R7–R8 add "+ 1 biometric login". `[sharepoint: EAINT-9805, Device & Test Scope R5–R10]` [source: pipeline EAINT-9805, Elf scenarios, 2026-10-30]
35. **More scope from Faizuddin (2026-10-30, 17:01)** `[Faizuddin, dashboard chat to Elf, 2026-10-30]`:
    1. **Back navigation interruption**: "add scenario fingerprint while pressing back button/go back gesture on the phone's navigation function".
    2. **Fold phone, both states in one TS**: "make sure got scenario to try every scenario in both folded and unfolded state ... both states in one same TS".
    3. **UI / display TS devices**: "always include for every fold phone, andoird 15, android 17 and ios 27 (unless that UI is about dermalog, then dont include ios, since dermalog is not supported for IOS".
    4. **Biometric login under interruption, low priority**: "for interruption, can you add scenarios for biometric also. but make those P3".
    5. **Reinstall and log in again**: "for the app login part, put some simple TS for uninstalling, re-installing and logging in again".
36. **Android 13 and Android 16 run the Iris and Dermalog TS too**, not only the short check: "both android 13 and android 16 should be in IRIS and Dermalog TS, as mentioned in the main page of the excel" `[Faizuddin, dashboard chat to Elf, 2026-11-02]`. Dermalog on Android 16 keeps only the not-supported check ("Dermalog does not officially support Android 16 and above.", Device & Test Scope R12). [source: pipeline EAINT-9805, Elf scenarios, 2026-11-02]
37. **iOS 18, iOS 26 and iPadOS also run the full Iris TS**: "same goes for IOS 18, IOS 26 & IpadOS" (follow-up to item 36) `[Faizuddin, dashboard chat to Elf, 2026-11-02]`. Not on Dermalog TS: Device & Test Scope R9 "no Dermalog (not supported on iOS)". [source: pipeline EAINT-9805, Elf scenarios, 2026-11-02]
38. **Rotation confirmed for this phase**: "currently system will not turn, and only stay in vertical layout" `[Faizuddin, 2026-11-03]`. UI TS expect portrait on every device, including tablet and iPad.
39. **UI TS tab (official workbook, 2026-11-03)**: "since its a lot, it should have its own tab, the UI TS" `[Faizuddin, 2026-11-03]`. 39 TS 9805_UI_TS01–39: layout per page, rotation, fold phone fold / unfold mid process (open the screen mid process, listing, pop-ups, submit while loading), tablet and iPad large screen. Result columns Android 15 | Android 17 | Fold (Android 17) | Tablet (Android 15) | iOS 27 | iPadOS. Source `scripts/ts-builders/eaint-9805-ui/ui-rows.json`. Fold layout TS FL_TS01–11 stay on Device & Performance TS.

## 7. Biometric login with saved accounts (EAINT-12592, iOS)

Source: sub-task EAINT-12592 "[iOS] Biometric login (Face ID / Touch ID) with saved accounts", description, captured 2026-10-30 (`_reference/tickets/Studying/EAINT-12592/EAINT-12592-jira.md`). `[from ticket EAINT-12592]` [source: pipeline EAINT-9805, Scribe related history, 2026-10-30]

1. **What it does:** "Dealers can save up to 5 eAuto accounts on their phone and log in to one with Face ID or Touch ID instead of typing the password."
2. **No backend change:** "Face ID only unlocks the saved username + password, then today's login runs as if typed (settings.get then login.do)."
3. **No saved account:** "Phones with no saved account see today's login screen, unchanged."
4. **Turn-on page:** "Log In Faster with Face ID" with "Turn On Face ID / Maybe Later"; "Asked once per account on this phone". An account that tapped Maybe Later on an older build never sees it again; reinstall first. [source: pipeline EAINT-9805, Scribe related history, 2026-10-30]
5. **Dialogs:** "Face ID Is Off (Use Password / Go to Settings), Face ID Is Locked, Saved Login Not Working, Face ID Changed."
6. **When a saved account is removed:** "Only the server's DENIED (wrong password) removes that one account, with \"Saved Login Not Working\"." / "A real Face ID / Touch ID change on the phone removes all saved accounts, with \"Face ID Changed\"." / "A wrong face, cancel, lockout, \"Use Password\", a keychain or storage glitch, network / server error, maintenance or S00018 to S00026 never remove or hide anything."
7. **Account tab:** "Login with Face ID" switch; Turn Off dialog "Turn Off Face ID?" / "You'll need to enter your password to log in to this account."; toasts "Face ID turned off" / "Face ID turned on".
8. **Touch ID:** "Touch ID phones get the same screens with Touch ID wording and a fingerprint icon."
9. **Simulator:** "QA can test most of it on the simulator. Setup per simulator: Simulator menu > Device > Face ID > Enrolled." Use an iPhone SE simulator for Touch ID.
10. **Not yet tested by the developer on a real phone:** "passcode turned off, a real Touch ID iPhone, Face ID changed while logged in."
11. **Staging trap:** "On staging (28 Oct) every login.do while signed in ends the current session, even with a wrong password". Do not log in to the same account on web and app at once during a test.
12. **Android:** "Android: not started; ports from the specs." (12592 status, 28 Oct). Android biometric login in the Phase 6 build: [unconfirmed].
13. **QA plan for biometric login per device** (EAINT-9805 workbook, sheet "Device & Test Scope"): Android tablet R3 "1 biometric login (fingerprint, and face recognition if offered)"; iOS 18 / iOS 26 phones R7–R8 "1 biometric login (Face ID or Touch ID, depending on the iPhone)". `[sharepoint: EAINT-9805, Device & Test Scope R3, R7–R8]` [source: pipeline EAINT-9805, Elf scenarios, 2026-10-30]
14. **Saved accounts list = "rows" on the login page** (12592 "Test scope"): "Logout: list shows company + username; account without a company name shows username only." / "Tap row: one prompt > Home." / "Tap row, cancel or Non-matching Face: stays on the list, no message, all rows kept." `[from ticket EAINT-12592, description "Test scope"]`
15. **Android sub-task:** EAINT-12688 "(eAuto-App) [Android] Biometric and Home Page Revamp", In Development, created 2026-10-30, description empty at capture. Whether it ports the iOS saved-accounts flow is [unconfirmed]. `[jira: EAINT-12688, captured 2026-10-30]`
16. **Android coverage until 12688 is written:** the iOS biometric login TS also run on Android 15, tagged [unconfirmed]; Faizuddin chose this ("1. a)"). `[Faizuddin, dashboard chat to Elf, 2026-10-30]`

## Open questions

1. Phase 6 staging instance for the UAT app. 2. iOS install route (TestFlight?) and iOS devices ("TBC"). 3. Exact app error texts for reader unplug / Bluetooth off / unpair. 4. Whether the Iris unit due back 2026-11-03 (inventory testing) is the same unit used for app testing. 5. Who holds the Dermalog runtime licence for test phones.
