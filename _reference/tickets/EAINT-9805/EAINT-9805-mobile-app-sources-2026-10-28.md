# EAINT-9805 mobile app — raw sources captured 2026-10-28

Captured by Claude for Faizuddin's mobile app deep dive. Cell text only.

## 1. EAINT-9805 workbook (= the "eAuto App High-Level Test Scope" link from the lead)

- URL given by lead: https://modefair.sharepoint.com/:x:/r/sites/QATeam/_layouts/15/doc.aspx?sourcedoc=%7B99f03c9f-d2fc-4dfe-90ad-120a74328866%7D
- File: /sites/QATeam/Shared Documents/1. eAuto Project/eAuto - CR Test Scenarios/EAINT-9805 - eAuto Mobile App - Phase 6 STMS - To update STMS module same as Production Web Portal (as of 29.01.2026).xlsx
- Modified 2026-10-28T03:09:22Z, 19214 bytes. Read via SharePoint REST, unzipped in the browser.
- Trimmed: the Play Store password cell (A59) is redacted. Nothing else trimmed.

### Sheet "Device & Test Scope"
```
A1=OS | B1=Automation device (Hui Xin) | C1=Automation testing | D1=Manual device (??) | E1=Manual testing
A2=Android 13 | B2=ZTE Blade V50 | C2=Automation short check | D2=ZTE Blade V50 | E2=Manual short check: Iris and Dermalog
A3=Android 15 | B3=Samsung Galaxy Tab Active4 Pro 5G (tablet) | C3=“Can use” check | D3=Samsung Galaxy Tab Active4 Pro 5G (tablet) | E3=1 Iris transaction, 1 Dermalog transaction, 1 biometric login (fingerprint, and face recognition if offered)
B4=Infinix Note 40 Pro | C4=Full E2E testing | D4=Samsung Galaxy A54 5G (No. 2) | E4=Full manual testing
A5=Android 16 | B5=REALME 13+ 5G | C5=Automation short check + edge-to-edge display check | D5=REALME 13+ 5G | E5=Manual short check: Iris and Dermalog (see Dermalog note)
A6=Android 17 | B6=Xiaomi 14T (when Android 17 is available) | C6=Same as Android 16 | D6=Xiaomi 14T (when Android 17 is available) | E6=Same as Android 16
A7=iOS 18 | B7=TBC | C7=Automation short check | D7=TBC | E7=Manual short check: Iris + 1 biometric login (Face ID or Touch ID, depending on the iPhone)
A8=iOS 26 | B8=colleague's phone (TBC)? | C8=Automation short check | D8=colleague's phone (TBC)? | E8=Manual short check: Iris + 1 biometric login (Face ID or Touch ID, depending on the iPhone)
A9=iOS 27 | B9=iPhone 17e (TBC) | C9=Full E2E testing | D9=iPhone 17e (TBC) | E9=Full manual testing, except no Dermalog (not supported on iOS) and no fingerprint login (iPhone only has Face ID)
A10=iPadOS ? | B10=iPad (A16) - iPad 11 | C10=“Can use” check | D10=iPad (A16) - iPad 11 | E10=Manual short check: Iris + 1 biometric login (Touch ID)
A12=Dermalog note for Android 16 and 17: Dermalog does not officially support Android 16 and above.
A13=If the Dermalog transaction passes, there is no concern.
A14=If it fails, the app should show a clear message and must not crash or freeze. Raise it to SA, because the expected result is not confirmed.
A16=Full E2E testing (automation)
A17=All E2E flows in all modules, including negative and edge cases.
A19=Full manual testing
A20=1. Iris and Dermalog full testing, including negative testing.
A21=2. Face login and fingerprint login.
A22=3. Interruption testing (check the TS with Charmain).
A24=Automation short check
A25=1. One E2E happy path for each key module.
A26=2. File upload.
A27=3. Edge-to-edge display check (Android 16 and 17 only): check that buttons and text are not hidden under the top status bar or the bottom navigation bar.
A29=Manual short check
A30=Dermalog (USB):
A32=1. Connect the scanner and allow the USB permission.
A33=2. Capture a thumbprint and complete one transaction.
A34=3. Unplug and plug in again, then scan again.
A35=4. Lock the phone or leave it idle, then scan again.
A36=5. Unplug the scanner and check the message the app shows.
A38=Iris (Bluetooth):
A40=1. Pair the scanner and allow the Bluetooth permission.
A41=2. Capture a thumbprint and complete one transaction.
A42=3. Turn Bluetooth off and on, then scan again.
A43=4. Move out of range and come back, then scan again.
A44=5. Unpair the scanner and check the message the app shows.
A46=“Can use” check (tablet and iPad)
A47=Automation:
A48=1. One E2E happy path for each key module.
A49=2. Check every visited screen in both portrait and landscape.
A50=3. Rotate the tablet in the middle of a flow and check that the data is still there.
A52=Manual:
A53=4. One Iris transaction + one Dermalog transaction (no Dermalog on iPad).
A54=5. One biometric login.
A57=Playstore ID
A58=teamqa99eauto@gmail.com
A59=[REDACTED password]
```

### Sheet "Iris & Dermalog Support" (renamed from "Sheet1"; 1 = supported, 0 = not)
```
Android 8-12: IRIS 0, DERMALOG 1
Android 13, 14: IRIS 1, DERMALOG 1
⭐ Android 15: IRIS 1, DERMALOG 1
Android 16, 17: IRIS 1, DERMALOG 0
iOS 14, 15, 16, 17, 18, 26: IRIS 1, DERMALOG 0
⭐ iOS 27: IRIS 1, DERMALOG 0
```

## 2. Interruption Testing reference (Google Sheet, EAINT-6014 Phase 2)

- URL: https://docs.google.com/spreadsheets/d/1hNoODZFq2uCTbB6bG4jfJnoewUk2jiskOh649CTeBXM (title "EAINT-6014: eAuto Mobile App (Phase 2) - Test Scenarios")
- Tabs: UCD List; [QA] Daily Report Roster Table; PROGRESS TRACKING; P2 - Production Regression; 0Production Regression; 0UCD - LOGIN & HOMEPAGE; 0UCD - STMS; 0UCD - eSTM; 0[SnF] UCD - STMS; 0[SnF] UCD - eSTM; Functional & Interruption Test; 0Redirect to Listing; P2 - LOGIN & HOMEPAGE; P2 - STMS + SSM; P2 - eSTM + eLKM; P2 - eSTM + SSM; P2 [SnF] - STMS; P2 [SnF] - eSTM; P2 - Functional Test; P2 - Compatibility Test; 0Jomcheck.
- "Functional & Interruption Test" tab saved in full: `EAINT-6014-app-phase2-TS--Functional-and-Interruption-Test.csv` (same folder).
- Not saved: "P2 - Functional Test" (field rules, read in session), other tabs, "UCD List" (logins, not opened).

### Tab "P2 - Compatibility Test" (verbatim key cells)
- APP_COMPATIBILITY_TS1, Any Page: "App idle for 1 hour in background > When reopen, auto logout and redirect to login page" — "Ensure show message above "Username" field: "Your session has expired Please log in again to continue.""
- STMSAPP_COMPATIBILITY_TS1 / eSTMAPP_COMPATIBILITY_TS1 checks: "1. Ensure UI is showing following correctly & compatible with different screen size - button placements - dialogs - system notifications 2. Step 1 & 3, Dermalog (thumbprint) 3. Company Step 2, Upload File - upload from phone local storage - upload from drive - upload file larger than 5MB, Show message: "File exceeded the file size limit of 5MB. Please try again." 4. Step 6 and Details Page, Download File - Download to phone local storage"
- STMSAPP_COMPATIBILITY_TS2/TS3 and eSTMAPP_COMPATIBILITY_TS3/TS4 (Step 1 and Step 3, the thumbprint steps): "1. Navigate with Home button & reopen app - Remain on the same page - Auto refresh the page, need to rescan MyKad & redo thumbprint 2. Navigate with Overview button, switch to other app & reopen app - Remain on the same page - Auto refresh the page, need to rescan MyKad & redo thumbprint 3. No connection (disconnect network) - Remain on the same page - Will show toast message, "No internet connection" 4. Lock screen then proceed to unlock - Remain on the same page - Auto refresh the page, need to rescan MyKad & redo thumbprint 5. Kill and reopen the app - Launch from Homepage"
- Testers without the Dermalog licence marked rows N/A with remark "*without runtime license".

### Tab "PROGRESS TRACKING" (verbatim key cells)
- Phase 1: "Environment: https://staging.eauto.my/sit3/public/login/", "Test Date: 2nd Jan - 16th Jan".
- Phase 2: "Environment: https://staging.eauto.my/sit1/public/login/", "e-Simulator: https://172.30.202.114:9089/esim/login", "Test Date: 26th Feb - 1st Apr".
- "*Each QA/BQAs need to complete at least 16 TS per day"
- "0. Preparation: - Provide your Google Play Store email address to Desmond to be added to the tester list. (you can use either your company email or personal email). - Download the UAT App from Google Play Store using this link: eAuto UAT APP (we need to manually update the app with this link whenever the latest version is released) - The UAT App is linked to the staging environment, please use staging/sit1 on the web for testing."
- "1. Testing Method: - Previously, we tested the app by screen mirroring our Android phone to laptop and screen recording as test evidence. Can use either Dr. Fone Air, or Phone Link."
- "2. What to Check During Testing: eAuto Mobile APP: - Figma Design for UI/UX - UCD Transaction Listing Page - UCD Transaction Details Page - SRD for flow & behavior. eAuto WEBSITE: - UCD Transaction Listing Page - UCD Transaction Details Page - BO Transaction Listing Page - BO Transaction Details Page - BO JPJ XML Log (STMS)"
- "3. Issue Reporting: - If you find any issues during testing, please raise them under respective APP version and build number in EAINT-6014. - Include your Android device model and APP version & build number in your ticket so that we can track the issue. (can assign the ticket to ZhiKiat first) - When retesting a fixed bug, please include the APP version and build number as well."
- "P1 - must test / P2 - should test but can be tested in later phase / P3 - good to test"

## 3. Jira (read 2026-10-28)

- EAINT-9805 status "REQ REFINEMENT IN PROGRESS -EAUTO", assignee Zhen, QA field Hui Xin Lee, parent epic EAINT-7554 "eAuto Mobile App". Description: "Planning: To complete STMS module same as Production Web Portal" / "Note: Can roll out this with STMS module only, can hide other modules if haven’t ready." SRD v0.1 06.02.2026 attached.
- Sub-tasks: 12425 Done (Phase 6 bug fixes); 12550 Done (tile RM25→RM35); 12551 Done (Perakuan + JPJ Official Receipt in eSTM); 12552 Done (S00044 popup); 12553 Done (usage code AH); 12558 Done (Android merge Phase 3-6); 12567 Code Review (STMS LKM Refund); 12568 Done; 12570 Done (Android rooted device handling); 12575 Done; 12591 To Do (review PR#19 LKM Refund); 12592 In Development ([iOS] Biometric login Face ID / Touch ID with saved accounts); 12637 In Development (Insurance Cancellation Module).
- Earlier phases under EAINT-7554: 5566 Phase 1, 6014 Phase 2 (both Ready for Prod Deployment); 6015 Phase 3 (Insurance into eSTM, JomCheck); 7109 Phase 4 (UCD to UCD); 6016 Phase 5 (Transfer History, BMK, Insurance standalone).

## 4. Teams — what "Iris" is

- [eAuto-Secarang Main Group, 2026-10-16 16:55, Kasheng Liew] "ios left connecting estm to insurance, can say 95% porting completed, then testing.. had included iris card reader also but still some negative scenarios need to test more.. after my porting done.. next week ill start to cover ipad"
- [same chat, 2026-10-16 16:56, Wen Ching Chua] "is iris biometric straightforward? they used bluetooth?"
- [same chat, 2026-10-16 16:55, Zhen Hao Choo] "done matching web behaviour to mobile (new module not included) currently testing Iris reader on mobile app, and also start develop LKM refund module"
- [EAINT-12099 group, 2026-10-13 16:55, Mei Jia Chee] "by 03.11 the device will pulang back ad yaa" (inventory-control unit; may not be the same unit as the app test unit)
