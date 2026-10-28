# EAINT-9944 — QA Team test script study (2026-10-28)

## 1. Header

1. **Ticket:** EAINT-9944 — "🔴[eAuto-UCD] To Enhance Web Socket with MyBioID Service Installer v2" (Overall Progress, R3).
2. **Module / portal:** UCD portal and AATF portal — login page, Download page, User Guide page. The Version Check sheet tests STMS, eSTM, BMK Step 1 and Dereg Step 1. The full thumbprint page list is in §3m.
3. **Workbook:** "EAINT-9944 - [eAuto-UCD] To Enhance Web Socket with MyBioID Service Installer v2.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 16/04/2026, 5:52:41 pm.
4. **Status written in the sheet:** "Status: BA confirmed with Ket Ming that web socket will be on hold (16/04/2026)" (Overall Progress, R5).
5. **Environment:** "Test environment: staging/sit3" (Overall Progress, R7). Scope line: "Java Applet + Web Socket Installer v2.0" (Overall Progress, R10).
6. **Sheets (13):** QA Laptop Specs, Overall Progress, Download Time, Browsers, UCD & AATF, Version Check, Dermalog TS, MyKad TS, Thumbprint TS, 2 MyKads TS, Functional TS, Auto Scan TS, Connectivity & Security TS, Performance TS.
7. **Scenario count and results** (counted from the Test Result column of each sheet):

| Sheet | Rows | Pass | N/A | Not Started |
|---|---|---|---|---|
| Browsers (E2E Happy Flow) | 11 | 0 | 11 | 0 |
| UCD & AATF | 16 | 0 | 0 | 16 |
| Version Check | 23 | 0 | 0 | 23 |
| Dermalog TS | 13 | 11 | 2 | 0 |
| MyKad TS | 8 | 6 | 2 | 0 |
| Thumbprint TS | 9 | 6 | 3 | 0 |
| 2 MyKads TS | 12 | 0 | 12 | 0 |
| Functional TS | 8 | 1 | 7 | 0 |
| Auto Scan TS | 6 | 1 | 5 | 0 |
| Connectivity & Security TS | 21 | 7 | 14 | 0 |
| Performance TS | 17 | 0 | 17 | 0 |

8. **Sheet totals:** Overall Progress R24 records "39" Not Started, "32" Pass, "62" N/A, "133" total, "0.706766917293233" Total Completion. The 133 total and 62 N/A **leave out the 11 Browsers rows** (own count: 144 rows, 73 N/A). No Fail recorded.
9. **Testers written in the sheet:** "Aliah" (laptop "ASUS TUF Dash F15 FX516PM_FX516PM") and "Faiz" (laptop "MSI GF63 Thin") — all 32 Pass rows. Performance timings by "Nick", "Charmain", "Nabila", "Nadhirah".
10. **Dates in the sheet:** April calendar (Overall Progress, R31-R32): "14 ⏎ - Start testing", "15 ⏎ - E2E Happy Flow by EOD", "16 ⏎ - UCD to test asterisk issue", "22 ⏎ Deployment". Status note dated 16/04/2026. Browsers R17 note dated "21/08/2025 9.30AM".
11. **Second workbook in the same folder:** "List of Modules and Pages that requires Thumbprint (UCD & AATF).xlsx", modified 13/04/2026, 9:51:37 am. Text copy dated "28/10/2026, 1:02:44 am".
   1. **Sheets (2):** UCD (R1-R52), AATF (R1-R19).
   2. **Content:** a reference list of thumbprint pages, not test scenarios. No Test Result column, no Pass/Fail, no tester or date written in the cells.
   3. **Page entries:** UCD 24 numbered pages under 9 headings; AATF 7 numbered pages under 4 headings (own count, see §3m).

## Changes since last study (2026-10-28)

1. **What changed:** this run reads the sister workbook "List of Modules and Pages that requires Thumbprint (UCD & AATF).xlsx" from the EAINT-9944 folder. The earlier study skipped it (§8 item 6 of the earlier version).
2. **Not a newer version of the TS:** its modified date, 13/04/2026, is **older** than the main TS workbook (16/04/2026). No change to the main TS workbook was re-checked in this run [unconfirmed — the main text copy was not re-read; all counts in §1-§6 for the main TS are carried over].
3. **New scenarios:** none. The list holds no scenario ids and no results.
4. **Removed scenarios:** none.
5. **Result changes:** none. Totals stay at 32 Pass, 73 N/A (own count), 39 Not Started, 0 Fail.
6. **New facts added:** §3m (full page list), §4 items 21-24, §6 items 10-11, §7 items 5-7, Knowledge candidates 11-13.
7. **Fixes to the earlier study:**
   1. §1 item 2 named only the Version Check pages as "every thumbprint page". The list shows many more (eSerahan and Insurance permission, Pre e-Invoice, Manage Users, first login, COD). Fixed below.
   2. §8 item 6 said the list "was not read". Now read; §8 updated.

## 2. What the ticket changed, as the TS shows it

1. **New Dermalog installer v2 (MyBioID Service Installer v2).** Download buttons should show "Dermalog Biometric Software Upgrade v2" and give the v2 file "(not v1)" (UCD & AATF, R3).
2. **Two installer files.** "2 versions of installer: ⏎ 1. Upgrade version ⏎ 2. New Installation version + Driver File (will be with CS team)" (Download Time, R4 NOTE).
3. **Where each file is downloaded** (Download Time, R6 NOTE):
   1. Login Page > Download: "Dropdown Name: Dermalog Biometric Software", file "Dermalog Biometric Software Installation.msi".
   2. UCD / AATF Download Page: "Buttton Name: Dermalog Biometric Software Upgrade", file "Dermalog Biometric Software Upgrade.msi".
   3. "[Chrome] Step 1 Thumbprint Page: ⏎ - Button Name: Download Installer", file "Dermalog Biometric Software Upgrade.msi".
4. **Version gate on thumbprint pages.** With v1 or no Dermalog installed, Chrome users are blocked with an "Update Required" message (Version Check, R3). Firefox 36.0.4 with v1 still works (Version Check, R8).
5. **Regression of the Chrome WebSocket reader.** Eight sheets (Dermalog, MyKad, Thumbprint, 2 MyKads, Functional, Auto Scan, Connectivity & Security, Performance) compare "Existing Behavior (Firefox 36.0.4 - Java Applet)" with "Actual Result (Chrome - Web Socket)" and "Expected Result (Chrome - Web Socket)". Browsers R2-R8 Remarks: "Included in the installer regression scope".
6. **The v2 change itself was never tested.** All UCD & AATF and Version Check rows are "Not Started"; the ticket went on hold 16/04/2026. Only the reader regression sheets carry results.

## 3. Scenarios

### 3a. UCD & AATF (download and guide) — all "Not Started"

1. **9944_LOGIN_TS1** (P1, Chrome) — login page [Download] → "Button shows “Dermalog Biometric Software Upgrade v2”", "MyBioID Service Installer v2 file is downloaded (not v1)".
2. **9944_LOGIN_TS2** (P2, Chrome) — Teamviewer QS link → "Teamviewer QS downloads successfully", "No regression from the v2 changes".
3. **9944_LOGIN_TS3 / TS4** — same as TS1 / TS2 on Firefox 36.0.4 (TS3 checks the file only, not the label).
4. **9944_UCD_TS1-TS4** — UCD Download page > "Chrome Version section", Firefox 36.0.4 (TS1-2) and Chrome (TS3-4); same expected results.
5. **9944_UCD_TS5 / TS6** — UCD User Guide > "Dermalog Biometric Device User Guide section", 3 links (PDF, Video in English, Video in Chinese) → "Installation guide opens successfully, content is relevant and not broken".
6. **9944_AATF_TS1-TS4** — AATF Download page, Chrome (TS1-2) and Firefox (TS3-4).
7. **9944_AATF_TS5 / TS6** — AATF User Guide > "eAuto Biometric Device User Guide section", same 3 links.

### 3b. Version Check — all "Not Started"

1. **v1 → v2, Chrome, blocked:** VC_TS1 (UCD eSTM + BMK Step 1), VC_TS2 (UCD STMS Step 1), VC_TS4 (AATF Dereg Step 1) → "System detects Dermalog v2 is absent", "User is blocked from proceeding in the thumbprint section", "Update Required" message.
2. **v1 → v2, Chrome, after upgrade:** VC_TS3 (UCD STMS), VC_TS5 (AATF Dereg) → click [Download Installer], install v2, restart, relogin → "User able to proceed until Step 6 with Tx Status = Approved".
3. **Firefox 36.0.4:** VC_TS6-TS7 (UCD, v1), VC_TS10 (AATF, v1) → "System detects Dermalog v1", "Thumbprint section loads normally without error". VC_TS8-TS9 (UCD, v2), VC_TS11 (AATF, v2) → "System detects Dermalog v2".
4. **v2 → v2 reinstall:** VC_TS12 (Chrome UCD eSTM), VC_TS13 (Chrome AATF Dereg), VC_TS14 (Firefox UCD STMS), VC_TS15 (Firefox AATF Dereg) → proceed to Approved.
5. **No Dermalog installed:** VC_TS16 / TS20 (UCD, Chrome / Firefox), VC_TS18 / TS22 (AATF) → blocked with "Update Required".
6. **No Dermalog, then install v2:** VC_TS17 / TS21 (UCD), VC_TS19 / TS23 (AATF) → Expected still says "System detects Dermalog v2 is absent" and blocked (see §6, item 3).

### 3c. Dermalog TS (device plug / unplug) — 11 Pass, 2 N/A

1. **DL_TS1** No device → "Please plug in Dermalog Biometric Device and click [Reconnect]." — PASS (Aliah).
2. **DL_TS2** Unplug before read → same message — PASS (Faiz).
3. **DL_TS3** Unplug during read → popup "Unable to read photo. Please try again." — PASS (Aliah).
4. **DL_TS4** Unplug after read → "Place Thumb on reader", [Scan] disabled — PASS (Faiz).
5. **DL_TS5** Unplug during thumbprint → no error, [Scan IC] disabled — PASS (Aliah).
6. **DL_TS6** Unplug after thumbprint → "User able to proceed with next step" — PASS (Faiz).
7. **DL_TS7** Reconnect before read → reconnect prompt — PASS (Aliah).
8. **DL_TS8** Reconnect during read → "Unable to read photo. Please try again." then "attempt to Auto Scan IC" — PASS (Faiz).
9. **DL_TS9** Reconnect after read → "Only after refreshing page then will allow to restart reading MyKad" — PASS (Aliah).
10. **DL_TS10** Reconnect during thumbprint → "User unable to proceed with thumbprint" — PASS (Faiz).
11. **DL_TS11** Reconnect after thumbprint → proceed — PASS (Aliah).
12. **DL_TS12** Retry read after reconnect (P2) — N/A.
13. **DL_TS13** Rapid plug/unplug (P3) — N/A.

### 3d. MyKad TS — 6 Pass, 2 N/A

1. **IC_TS1** Read valid MyKad → "User able to proceed with thumbprint" — PASS.
2. **IC_TS2** No MyKad → "No card is detected. Please insert IC and click [Scan IC] to try again." — PASS.
3. **IC_TS3** Invalid MyKad (manual scan) → with chip: after 10 s "No card is detected…"; without chip: "Please ensure the IC is placed properly or the chip surface is cleaned" — PASS.
4. **IC_TS4 / TS5** Retry after failed / multiple failed reads — N/A.
5. **IC_TS6** Remove MyKad during read → "Unable to read photo. Please try again." — PASS.
6. **IC_TS7** Remove MyKad after read → proceed — PASS.
7. **IC_TS8** Non-MyKad card (auto scan) → "No card is detected…" after 10 s / timeout — PASS.

### 3e. Thumbprint TS — 6 Pass, 3 N/A

1. **TP_TS1 / TS2** Correct right / left thumb → "Verification Passed", "Verification Completed", [Cancel] & [Next] — PASS.
2. **TP_TS3** Wrong thumb → "Verification failed. Please click on [Scan IC] to try again" — PASS.
3. **TP_TS4 / TS5** Retry after failed / multiple failed thumbprints — N/A.
4. **TP_TS6 / TS7 / TS8** Remove MyKad before / during / after thumbprint → verification still passes — PASS.
5. **TP_TS9** Refresh after thumbprint → "System reset MyKad and Thumbprint" — N/A.

### 3f. 2 MyKads TS — all 12 N/A

1. **2IC_TS1-TS2** Two cards at once → "System read & show only one MyKad details".
2. **2IC_TS3-TS9** Swap card before / during / after read or thumbprint → reading stays tied to the card read first.
3. **2IC_TS10** Thumb of card B after reading card A → "Verification failed. Please click on [Scan IC] to try again."
4. **2IC_TS11** Retry after failed swap → "Unable to retry after swap from MyKad A to B while reading".
5. **2IC_TS12** Rapid swaps (P3) → "Verification Passed".

### 3g. Functional TS — 1 Pass, 7 N/A

1. **FUNC_TS1-TS5** [Cancel] before / during / after read or thumbprint → "Redirect to Create STMS Transaction category page". Only FUNC_TS5 PASS (Faiz).
2. **FUNC_TS6** Rapid [Cancel] → "Each [Cancel] > [No] remains on same page".
3. **FUNC_TS7** Rapid [Reconnect] → Expected column empty.
4. **FUNC_TS8** Rapid [Read MyKad] with no card → "Please ensure the MyKad is placed properly or the chip surface is cleaned".

### 3h. Auto Scan TS — 1 Pass, 5 N/A

1. **AS_TS1** Card inserted before landing → "The card is read within the first 3 second interval" — PASS (Aliah).
2. **AS_TS2 / TS3** Insert at 2nd / 3rd 'READCARD' (watched in F12) — N/A.
3. **AS_TS4** Manual read after auto-scan timeout — N/A.
4. **AS_TS5** Chip card that is not MyKad → "Auto Scan timeout after 10 seconds" — N/A.
5. **AS_TS6** Card without chip → "Auto Scan will run for 3 times" — N/A.

### 3i. Connectivity & Security TS — 7 Pass, 14 N/A

1. **CS_TS1-TS3, TS5-TS6** Network lost before / during / after read or thumbprint → on [Next], popup "Title: Error", "No internet connection. ⏎ Please try again when you have a stable connection." — PASS.
2. **CS_TS4 / TS9** MyKad read timeout — N/A; "No MyKad read timeout as [Scan IC] button will be enabled once it detects invalid MyKad".
3. **CS_TS7 / TS10** Thumbprint timeout → "No timeout for thumbprint" — N/A.
4. **CS_TS8** Retry after connection restored — N/A.
5. **CS_TS11-TS13** HMAC on WebSocket messages (F12 > Network > Socket > Messages) — N/A. Wrong key in DB → "Please read the MyKad again" (CS_TS13).
6. **CS_TS14** Same URL in a second tab → Tab B "Your session was closed because you opened the authentication page in another tab…" — PASS (Faiz).
7. **CS_TS15 / TS16** Same, during auto read / after details load — N/A.
8. **CS_TS17** Applet browser and WebSocket browser at once → "Applet able to read MyKad and do thumbprint the same time as Websocket" — PASS (Aliah).
9. **CS_TS18-TS20** Two WebSocket browsers, another user, old step URLs — N/A.
10. **CS_TS21** MyKad details correct in UCD step page, UCD & BO listing and details, "BO JPJ XML Log" — N/A.

### 3j. Performance TS — 17 rows, all N/A (timings recorded)

1. **Device load time, MyKad read time, thumbprint time, next-step load time**, 5 readings each per laptop, comparing Applet, WebSocket with / without HMAC, real time / batch.
2. Summary block (Performance TS, R3-R6, right-hand columns), Aspire 5 laptop: Applet total "14.49" s, With HMAC "16.79", Without HMAC "14.22". HP ProBook: Applet "16.64", With HMAC "21.58", Without HMAC "18.16".
3. **MyKad read is slower on WebSocket**: one tester's Applet average "5:80" vs WebSocket with HMAC real time "15.9" (Performance TS, R7).
4. **Next step is faster on WebSocket**: Applet average "8.71" vs WebSocket "0.83" (Performance TS, R16).

### 3k. Browsers (E2E Happy Flow) — 11 rows, all N/A

1. Chrome "v147.0.7727.56 ⏎ (Latest)" Web Socket P1 for every regression sheet (R2-R9).
2. Firefox "v36.0.4" Java Applet P1, Firefox "v148.0.2 ⏎ (Latest)" Web Socket P2, Edge "v147.0.3912.60 ⏎ (Latest)" Web Socket P2 — "E2E Happy Flow for any P1 Module" (R9-R12).

### 3l. Download Time — not filled

1. TS1-TS9 (R26-R41): Chrome / Firefox, single and concurrent UCDs (A, B, C across Company A / B), Login page (New Installation) vs Download page (Upgrade). "Download Time" column is empty.
2. R24: "After AWS is up, to retest the table below".

### 3m. Thumbprint page list (second workbook) — reference list, no results

Columns as seen in the text copy: number | page | MyKad note | marker. Markers are "✅", "??" or "x"; their meaning is not written in the sheet [unconfirmed — likely ✅ = checked, ?? = in doubt, x = not needed].

UCD sheet:

1. **STMS** (R3, side note "3 | - IN STEP 3") — Create New Transaction (MyKad, MyPR, Company): "Step 1 - Seller (Owner)" (R5, side note "Step 1 - Company,"); "Step 3 - Buyer (Dealer)" "Please use login user" "✅" (R6).
2. **UCD To UCD (Standard)** (R8) — "Step 1 - Seller (Owner)" (R10); "Step 3 - Buyer (Dealer)" "Please use login user" "✅" (R11).
3. **UCD To UCD (Interstate)** (R13) — same two steps (R15-R16), Step 3 "✅".
4. **eSTM** (R18) — "Step 1 - Buyer (Customer)" (R20); "Step 3 - Seller (Dealer)" "Please use login user" "✅" (R21).
5. **eSerahan Permission** (R22-R28) — 6 pages: Director Verification to Add / Remove / Inactivate eSerahan user (Main User); "e-Serahan User Activation Page (Sub User)"; "(L1 User)"; "(L2 User)".
6. **BMK** (R30, side note "4 | COMPANY STEP 1 & 3") — "Step 1 - Owner" "Please use login user's MyKad" "??" (R32); "Step 3 - Dealer" "Please use login user's MyKad" "✅" (R33).
7. **Insurance > Update Insurance Permission** (R36-R41) — 5 pages: Director Verification to Accept Insurance Commercial Agreement / Add / Remove / Inactivate Insurance User (Main User); "Insurance User Activation Page (Sub User)".
8. **Pre e-Invoice > Update Company/Business Profile** (R43-R45) — "Step 3 - MVD License Agreement & Thumbprint Verification" "Please use main user MyKad" "✅".
9. **Settings > Manage Users** (R47-R49) — "Add New User Account (Main & Sub User)".
10. **Create New UCD Company Account** (R51-R52) — "First Time Login New UCD (Main User)".

AATF sheet:

1. **Deregistration > Create New Transaction (MyKad, MyPR)** (R4, side note "2 | STEP 3 ONLY") — "Step 1 - Owner" "Please use Owner's MyKad." "??" (R5); "Step 3 - AATF" "Please use login user's MyKad" "✅" (R6).
2. **Upload Certificate of Destruction (COD)** (R7, side note "2 | x") — "Step 1 - AATF" "Please use the login user's MyKad" "✅" (R8).
3. **Settings > Manage Users** (R10-R13) — "Add New User Account (Main User)" and "Update User Account (Main User)", both "Please use login user's MyKad" "✅".
4. **Create New AATF Company Account** (R15-R16) — "First Time Login New AATF (Main User)".
5. **Create New AATF User Account** (R18-R19) — "First Time Login New AATF (Sub User)".

## 4. Business rules and system behaviour revealed

1. **Update Required message** (Version Check, R3, Expected Result): "Update Required ⏎ ⏎ Please update the Dermalog Biometric Device to the latest version and ensure it ⏎ is installed correctly. Alternatively, you may restart the computer and run the ⏎ MyBioID Service. ⏎ ⏎ To run MyBioID Service, click the Start button and search for MyBioID Service."
2. **No device / unplugged:** "Please plug in Dermalog Biometric Device and click [Reconnect]." with "[Reconnect] button Is enabled" (Dermalog TS, R3).
3. **Unplug or card removed while reading:** popup "Unable to read photo. Please try again." — "Click [OK] will redirect to verification page and system will attempt to Auto Scan IC" (Dermalog TS, R10; MyKad TS, R8).
4. **Reconnect after a read does not recover:** "screen remains on \"Place thumb on reader\", however it does not detect thumbprint or ask to retry… Only after refreshing page then will allow to restart reading MyKad" (Dermalog TS, R11). Remark: "UCD unable to thumbprint after refreshing the page & MyKad is read."
5. **Flaky reconnect during thumbprint:** "the time between placing the thumb and unplugging the dermalog is small, so sometimes will be able to verify the IC. Will need further testing to confirm" (Dermalog TS, R12, Remarks).
6. **No card:** "No card is detected. Please insert IC and click [Scan IC] to try again." (MyKad TS, R4).
7. **Non-MyKad without chip:** "Please ensure the IC is placed properly or the chip surface is cleaned" (MyKad TS, R5).
8. **Wrong thumb:** "Verification failed. Please click on [Scan IC] to try again"; "Click [Cancel] = Display \" [Yes] / [No] / [x] \" button"; "Click [Yes]= System direct to category page" (Thumbprint TS, R5).
9. **MyKad can be removed after the read** — thumbprint still verifies: "System able to detect thumbprint successfully after MyKad read successful and removed before thumbprint" (Thumbprint TS, R8).
10. **Auto scan:** "The card is read within the first 3 second interval" (Auto Scan TS, R3); chip card that is not MyKad: "Auto Scan timeout after 10 seconds" (R7); no chip: "Auto Scan will run for 3 times" (R8).
11. **Network loss** blocks only the [Next] step: "Title: Error ⏎ - Content: No internet connection. ⏎ Please try again when you have a stable connection." (Connectivity & Security TS, R3).
12. **No thumbprint timeout:** "Tested for over 10 minutes, Web Socket didn’t hit any timeout. No timeout for thumbprint." (Connectivity & Security TS, R9).
13. **One tab at a time:** "Your session was closed because you opened the authentication page in another tab. Please close this tab and refresh the original tab to continue"; "Click [Close] button will redirect to homepage" (Connectivity & Security TS, R16). Old Actual wording: "The connection is closed due to Multiple Connection."
14. **Applet and WebSocket can run at once:** "Applet able to read MyKad and do thumbprint the same time as Websocket" (Connectivity & Security TS, R19).
15. **HMAC:** WebSocket messages carry HMAC, checked in "F12 > Network > Socket > Messages > Data" (Connectivity & Security TS, R13). Wrong key → "Please read the MyKad again" (R15).
16. **Old step URLs stay usable:** "Step 1: Able to do thumbprint for new trx…", "Step 2: Unable access Step 2 directly from Step 4", "Step 3: Able to redo thumbprint for same trx" (Connectivity & Security TS, R22).
17. **Cancel target:** every Cancel → "Redirect to Create STMS Transaction category page" (Functional TS, R3-R7) — the "any page that requires thumbprint" in these rows was STMS [unconfirmed].
18. **Button label differences:** WebSocket Actual shows [Continue]; Expected (new design) shows [Next] and [Scan IC] instead of [Read MyKad] (e.g. Thumbprint TS, R8; Dermalog TS, R5).
19. **Windows 7 out of scope:** "YF feedback not to test Windows 7 as it's too old" (QA Laptop Specs, R4).
20. **Debug tip:** "Suggested to use F12 during testing, to simulate issues and help dev debug" (Browsers, R16).
21. **Whose MyKad at Step 3 / dealer steps:** "Please use login user" (List workbook, sheet UCD, R6, R11, R16, R21); BMK "Please use login user's MyKad" (sheet UCD, R33); AATF Dereg Step 3 "Please use login user's MyKad" (sheet AATF, R6).
22. **Pre e-Invoice profile update needs the main user:** "Step 3 - MVD License Agreement & Thumbprint Verification" — "Please use main user MyKad" (sheet UCD, R45).
23. **Owner MyKad on AATF Dereg Step 1:** "Please use Owner's MyKad." marked "??", with the heading note "STEP 3 ONLY" (sheet AATF, R4-R5). Whether Dereg Step 1 still asks for a thumbprint is left open in the sheet [unconfirmed].
24. **BMK Step 1 note in doubt:** "Step 1 - Owner" "Please use login user's MyKad" marked "??" (sheet UCD, R32), heading note "COMPANY STEP 1 & 3" (R30). Likely means login user's MyKad applies only for a Company owner [unconfirmed].

## 5. Test data, environments, accounts, setup

1. **Environment:** "staging/sit3" (Overall Progress, R7; UCD & AATF, R3).
2. **Browsers:** Chrome v147.0.7727.56, Firefox v36.0.4 (Java applet), Firefox v148.0.2, Edge v147.0.3912.60 (Browsers, R2-R12).
3. **Hardware:** real Dermalog device, valid MyKads A and B, invalid MyKad, non-MyKad cards with and without chip (e.g. "Debit Card", Auto Scan TS, R7). "2 Dermalog connected" for 2IC_TS1-TS2.
4. **Laptops:** QA Laptop Specs lists 13 machines with Windows version, CPU, RAM and priority (P1-P3). Both "Firefox ⏎ Java Applet" and "Chrome ⏎ Web Socket" columns are "false" on every row.
5. **Dev help needed:** "Ask dev help to amend the key in DB (to wrong key)" (Connectivity & Security TS, R14-R15).
6. **Accounts:** UCD users A and B "under the same company" (Connectivity & Security TS, R21); Company A / Company B for concurrent downloads (Download Time). No logins or passwords in the sheet.
7. **Blocker noted:** "Installer not ready, need dev to provide the file to download and patch (as of 21/08/2025 9.30AM)" (Browsers, R17).

## 6. Gaps and risks for regression

1. **v2 installer never tested.** All 16 UCD & AATF and 23 Version Check rows are "Not Started". If the ticket is revived, these are the core scope.
2. **Download time never measured** (Download Time sheet empty; "After AWS is up, to retest").
3. **Copy error in Version Check** [unconfirmed]: VC_TS17, TS19, TS21, TS23 install v2 then expect "System detects Dermalog v2 is absent" and blocking. VC_TS3 / TS5 expect the opposite after the same install.
4. **Other wording slips** [unconfirmed]: UCD_TS1 runs on Firefox 36.0.4 but opens the "Chrome Version section"; AATF_TS1 / TS3 expect "UCD able to do thumbprint"; VC_TS6 / TS7 install v1 but expect thumbprint "with the new installer".
5. **2 MyKads, Performance, Browsers E2E** — all N/A. No pass on swap behaviour or on Edge / Firefox 148.
6. **HMAC wrong-key cases** (CS_TS11-TS13) and **cross-browser WebSocket** (CS_TS18) not run.
7. **Reconnect after read** (DL_TS9) passed against an Expected that already accepts a refresh; real users stay stuck until refresh.
8. **Data trail** (CS_TS21: UCD and BO listing, details, "BO JPJ XML Log") not checked.
9. **Expected column = "new design"** in several sheets (button names [Next], [Scan IC]) differs from WebSocket Actual ([Continue], [Read MyKad]). Rows marked PASS should be read against the Expected column; which design is live now is not recorded here [unconfirmed].
10. **Thumbprint pages outside the Version Check sheet** — eSerahan Permission (6 pages), Insurance Permission (5), Pre e-Invoice Step 3, Manage Users (UCD and AATF), first logins, UCD to UCD Standard / Interstate, AATF COD — appear in the list (§3m) but have **no row** in the Version Check sheet. A version gate, if revived, would need a check on each.
11. **"??" markers unresolved** (List workbook, UCD R32, AATF R5): whose MyKad BMK Step 1 and Dereg Step 1 take is not settled in the sheet.

## 7. Context vs knowledge/

1. **Matches:** knowledge/flow-platform.md says "Installer v2 (EAINT-9944) was on hold per BA on 2026-04-16 and never went live (Closed 2026-08-28)". knowledge/flow-stms.md says "The MyBioID installer v2 check (EAINT-9944) never went live (Closed 28.08.2026). Do not test it."
2. **Matches:** knowledge/business-rules-from-test-scenarios.md §15 item 2 already cites this workbook for the v2 button and "Update Required" text.
3. **Planned behaviour vs live:** knowledge/flow-stms.md says "If WebSocket fails to open -> Message 'Update Required - Dermalog Biometric Device'. No version is compared." This TS planned a **version compare** (v1 blocked on Chrome). Since 9944 never went live, the knowledge file stands.
4. **Overlap with EAINT-7229:** business-rules §15 item 1 cites EAINT-7229 Dermalog / MyKad messages. This workbook reuses the same regression sheets, so those messages are re-confirmed here with pass results (Dermalog TS, R3-R13).
5. **Matches (page list):** business-rules §15 item 4 (UCD pages) and §13 item 4 (AATF pages), and flow-edereg.md "Thumbprint (MyKad) pages on AATF", cite catalogue #121 (EAINT-7229 folder copy). The EAINT-9944 copy (#118) has the same page names. The knowledge files drop the "??" markers and the "STEP 3 ONLY" / "COMPANY STEP 1 & 3" notes.
6. **Contradiction — catalogue counts:** knowledge/cr-test-scenario-catalogue.md row 118 says "UCD:39; AATF:0". The AATF sheet in this text copy has 19 rows with 7 page entries (R1-R19), so "AATF:0" is wrong for this copy.
7. **Possible tension — Dereg thumbprint points:** flow-edereg.md says the emulator "has to be applied at all three MyKad/thumbprint auth points in the Deregistration flow". The list's "STEP 3 ONLY" note (sheet AATF, R4) and "??" on Step 1 (R5) suggest fewer [unconfirmed]. The flow file comes from live runs, so it stands until checked.

## 8. Sources read

1. `_reference/sharepoint/qa-team-ts/EAINT-9944 - [eAuto-UCD] To Enhance Web Socket with MyBioID Service Installer v2/EAINT-9944 - [eAuto-UCD] To Enhance Web Socket with MyBioID Service Installer v2.md` — full text copy, all sheets. Formatting, images and cell colours are not in the copy. Some Overall Progress cells hold formulas, not values.
2. `_reference/sharepoint/qa-team-ts/EAINT-9944 - [eAuto-UCD] To Enhance Web Socket with MyBioID Service Installer v2/List of Modules and Pages that requires Thumbprint (UCD & AATF).md` — full text copy (2026-10-28 run), sheets UCD and AATF. Formatting, cell colours and column headers are not in the copy; the meaning of the number column (e.g. "3", "4", "2") is not written.
3. `_reference/tickets/EAINT-9944/` — holds only this study.
4. `_reference/tickets/Studying/EAINT-9944/` — does not exist.
5. `lib/ticketStudies.ts` — no EAINT-9944 entry.
6. knowledge/ grep "9944", "requires Thumbprint", "MyBioID", "WebSocket", "thumbprint": flow-platform.md, flow-stms.md, flow-edereg.md, flow-bmk.md, flow-estm.md, business-rules-from-test-scenarios.md (§13, §15), cr-test-scenario-catalogue.md (rows 117, 118, 121, 122).
7. Not read: Jira ticket, SRD, Teams. Main TS text copy not re-read in the 2026-10-28 update run.

## Knowledge candidates

1. **No thumbprint timeout on WebSocket:** "Tested for over 10 minutes, Web Socket didn’t hit any timeout. No timeout for thumbprint." — source: SharePoint TS EAINT-9944, sheet Connectivity & Security TS, row 9. Target: knowledge/flow-platform.md.
2. **One authentication tab at a time:** "Your session was closed because you opened the authentication page in another tab. Please close this tab and refresh the original tab to continue" — sheet Connectivity & Security TS, row 16 (PASS). Target: knowledge/flow-platform.md. Useful for automation runs that open two tabs on a thumbprint page.
3. **Applet + WebSocket can read at the same time:** "Applet able to read MyKad and do thumbprint the same time as Websocket" — sheet Connectivity & Security TS, row 19 (PASS). Target: knowledge/flow-platform.md.
4. **Network loss popup on [Next]:** "No internet connection. ⏎ Please try again when you have a stable connection." — sheet Connectivity & Security TS, row 3 (PASS). Target: knowledge/business-rules-from-test-scenarios.md §15.
5. **Auto scan timings:** "read within the first 3 second interval"; non-MyKad chip card "Auto Scan timeout after 10 seconds"; no chip "Auto Scan will run for 3 times" — sheet Auto Scan TS, rows 3, 7, 8 (only row 3 PASS). Target: knowledge/flow-platform.md and knowledge/mykad-emulator.md (emulator timing).
6. **MyKad can be pulled after the read:** thumbprint still passes — sheet Thumbprint TS, rows 8-10 (PASS). Target: knowledge/flow-platform.md.
7. **Reconnect after a read needs a page refresh** — sheet Dermalog TS, row 11 (PASS, with remark). Target: knowledge/flow-platform.md; relevant to EAINT-12332 (reconnect button).
8. **Installer file names** (planned, never live): "Dermalog Biometric Software Installation.msi" (login page) and "Dermalog Biometric Software Upgrade.msi" (Download page, Step 1 [Download Installer]) — sheet Download Time, row 6 NOTE. Tag [legacy] if added.
9. **WebSocket vs applet performance:** MyKad read slower on WebSocket with HMAC, next-step load much faster — sheet Performance TS, rows 3-7 and 16. Target: knowledge/flow-platform.md, tagged as measured on staging/sit3, April 2026 [unconfirmed date — the sheet does not date the timings].
10. **Windows 7 not tested:** "YF feedback not to test Windows 7 as it's too old" — sheet QA Laptop Specs, row 4. Target: knowledge/qa-process-from-notion-export.md or automation-playbook.md.
11. **Catalogue fix:** row 118 "UCD:39; AATF:0" — the EAINT-9944 copy has an AATF sheet with 7 page entries — source: List workbook, sheet AATF, R1-R19. Target: knowledge/cr-test-scenario-catalogue.md.
12. **Pre e-Invoice profile update needs the main user's MyKad:** "Please use main user MyKad" — source: List workbook, sheet UCD, R45. Target: knowledge/business-rules-from-test-scenarios.md §15 item 4.
13. **Open markers to verify live:** BMK Step 1 "Please use login user's MyKad" "??" (sheet UCD, R32, heading note "COMPANY STEP 1 & 3" R30); Dereg Step 1 "Please use Owner's MyKad." "??" (sheet AATF, R5, heading note "STEP 3 ONLY" R4). Target: flow-bmk.md and flow-edereg.md as [unconfirmed] leads.
