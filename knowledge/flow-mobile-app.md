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

## 5. Interruption rules already tested (Phase 2)

Source: `[gsheet EAINT-6014, Functional & Interruption Test R78; P2 - Compatibility Test]`.

1. Non-thumbprint pages (login, home, listing, details, steps): call / message / notification → stay on page; rotate → stays portrait; Home or Overview then reopen → stay on page; Back = in-app Back ("Back in login page / homepage will kill the app"); no network → toast "No internet connection"; lock / unlock → stay on page; kill and reopen → "Launch from Homepage (Login page will remain)".
2. Thumbprint steps (STMS / eSTM Step 1 and Step 3): Home, Overview + switch app, lock / unlock → "Remain on the same page - Auto refresh the page, need to rescan MyKad & redo thumbprint".
3. Idle 1 hour in background → "Your session has expired Please log in again to continue." above Username.
4. Phase 6 adds tablets: portrait and landscape, and "Rotate the tablet in the middle of a flow and check that the data is still there". Phone rule stays portrait. `[sharepoint: EAINT-9805, R49–R50]`

## 6. Phase 6 test depth (EAINT-9805 plan)

1. Full E2E: Android 15 and iOS 27 (⭐ rows). Short checks on the others. "Can use" check on tablet and iPad. `[sharepoint: EAINT-9805, Device & Test Scope]`
2. Manual full testing = "Iris and Dermalog full testing, including negative testing", face / fingerprint login, interruption testing. `[same, R19–R22]`
3. Edge-to-edge check, Android 16 and 17 only: buttons and text not hidden under the status bar or navigation bar. `[same, R27]`
4. Iris TS: lead asked for a new tab in the EAINT-9805 workbook, modelled on the EAINT-7229 Dermalog WebSocket TS. `[lead message to Faizuddin, 2026-10-28]`
5. The eAuto mobile app is a **native installed app** (Android / iOS), not a Chrome browser or web view of the portal. Web-only TS (browsers, installer, HMAC via F12, one-tab rule) do not apply. `[Faizuddin, 2026-10-29]`
6. Faizuddin's role on EAINT-9805: **manual** — write the Iris manual TS tab and do manual testing. Automation stays with Hui Xin. `[Faizuddin, 2026-10-29, per lead message 2026-10-28: "Please add the manual TS in EAINT-9805 excel by creating a new tab ya."]`

## Open questions

1. Phase 6 staging instance for the UAT app. 2. iOS install route (TestFlight?) and iOS devices ("TBC"). 3. Exact app error texts for reader unplug / Bluetooth off / unpair. 4. Whether the Iris unit due back 2026-11-03 (inventory testing) is the same unit used for app testing. 5. Who holds the Dermalog runtime licence for test phones.
