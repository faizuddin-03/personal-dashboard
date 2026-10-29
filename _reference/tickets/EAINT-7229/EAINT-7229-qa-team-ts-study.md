# EAINT-7229 — QA Team test script study (2026-10-28)

Written by the SharePoint Scribe (scheduled, unattended). Read only. No other file changed.

## Sources read

1. **Main TS workbook text copy (first run):** `_reference/sharepoint/qa-team-ts/EAINT-7229 - [eAuto] To update frontend to Chrome (including replacing applet with web socket)/EAINT-7229 - [eAuto] To update frontend to Chrome (including replacing applet with web socket).md` (text copy dated "28/10/2026, 1:00:25 am"). Read in full, all sheets. Original: SharePoint library "eAuto - CR Test Scenarios", modified 14/04/2026, 1:03:01 pm (catalogue #053).
2. **Page-list workbook text copy (second run):** `_reference/sharepoint/qa-team-ts/EAINT-7229 - [eAuto] To update frontend to Chrome (including replacing applet with web socket)/List of Modules and Pages that requires Thumbprint (UCD & AATF).md` (text copy dated "28/10/2026, 1:28:12 am"). Read in full, both sheets. Original: "List of Modules and Pages that requires Thumbprint (UCD & AATF).xlsx", same library and folder, modified 25/02/2026, 11:49:42 am (catalogue #121).
3. **Older UCD-only page list text copy (third run):** `_reference/sharepoint/qa-team-ts/EAINT-7229 - [eAuto] To update frontend to Chrome (including replacing applet with web socket)/List of Modules and Pages that requires Thumbprint (UCD).md` (text copy dated "28/10/2026, 10:05:11 am"). Read in full, one sheet ("Sheet1"). Original: "List of Modules and Pages that requires Thumbprint (UCD).xlsx", same library and folder, modified 02/09/2025, 2:13:25 pm (catalogue #122).
4. **Not opened:** all three original .xlsx files. The text copies keep cell text only, so **cell colours, highlights and images are lost**. The Performance sheet note refers to yellow cells that cannot be seen here. Column headers of the page-list workbook are not in the text copy, so the meaning of its number column and tick column is [unconfirmed].
5. **Formula cells:** the main workbook "Overall Progress" sheet holds COUNTIF formulas. The text copy shows the formulas, not their results. Only the typed numbers in that sheet can be quoted.
6. **Ticket folders:** `_reference/tickets/EAINT-7229/` holds only this study. `_reference/tickets/Studying/EAINT-7229/` does not exist (rechecked 2026-10-28, third run).
7. **lib/ticketStudies.ts:** no EAINT-7229 entry found (rechecked third run).
8. **knowledge/:** `README.md`, `flow-platform.md` (§ MyKad and thumbprint reader), `business-rules-from-test-scenarios.md` §13 and §15, `flow-stms.md`, `flow-bmk.md`, `flow-browser-reminder.md`, `flow-company-profile-einvoice.md`, `production-regression-scope.md`, `cr-test-scenario-catalogue.md` (#053, #118, #121, #122).
9. **Not read:** the Jira ticket, the SRD and the EAINT-9944 copy of the page-list workbook (catalogue #118). No text copy of those exists in this folder.

## 1. Header

1. **Ticket:** EAINT-7229 — "[eAuto] To update frontend to Chrome (including replacing applet with web socket)" (sheet "Browsers", R2).
2. **Workbooks in the ticket folder (three studied):**
   1. **Main TS:** "EAINT-7229 - [eAuto] To update frontend to Chrome (including replacing applet with web socket).xlsx", modified 14/04/2026. Items 3–12 below describe it.
   2. **Older UCD-only page list:** "List of Modules and Pages that requires Thumbprint (UCD).xlsx", modified 02/09/2025, 2:13:25 pm. **Sheets (1):** "Sheet1", title "List of Modules/Pages that requires Thumbprint (UCD)" (R1). **No TS ids, no Pass/Fail column, no tester name, no date, no card notes, no marks** in the sheet. It lists **8 module groups / 17 page rows** (counted from the text copy). Author per catalogue #122: "Charmain Ea Chiang", date "2025-09-02" (catalogue, not the sheet). See §3k.
   3. **Newer page list:** "List of Modules and Pages that requires Thumbprint (UCD & AATF).xlsx", modified 25/02/2026, 11:49:42 am. **Sheets (2):** "UCD", "AATF". **No TS ids, no Pass/Fail column, no tester name, no date** in the sheet. It lists **9 UCD module groups / 24 page rows** and **4 AATF module groups / 7 page rows** (counted from the text copy). Author per catalogue #121: "May Chin Mei Theng", date "2026-02-25" (catalogue, not the sheet).
3. **Portal / module:** **UCD and AATF** — every page that needs a MyKad + thumbprint read. The page-list workbook names them (sheets "UCD" and "AATF"; see §3j). The main TS ran on **STMS** as the host flow: cancel rows say "Redirect to Create STMS Transaction category page" (main TS, sheet "Functional TS", R10–R14).
4. **Test environment:** "Test environment: staging/sit2" (main TS, every TS sheet, R4). The page list names no environment.
5. **Test objective:** "To verify stable and correct WebSocket integration between the system and Dermalog for MyKad and thumbprint processing." (main TS, every TS sheet, R6).
6. **Main TS sheets (13):** QA Laptop Specs; Overall Progress; Download Time for Installer; Browsers; Dermalog TS; MyKad TS; Thumbprint TS; 2 MyKads TS; Functional TS; Auto Scan TS; Connectivity & Security TS; Performance TS; Performance TS - New Installer.
7. **Scenario count (main TS) — 85 unique TS ids:**
   1. Dermalog TS: **13** (7229_DD_TS1–TS13).
   2. MyKad TS: **8** (7229_MK_TS1–TS8).
   3. Thumbprint TS: **9** (7229_TP_TS1–TS9).
   4. 2 MyKads TS: **12** (7229_2MK_TS1–TS12).
   5. Functional TS: **8** (7229_FUNC_TS1–TS8).
   6. Auto Scan TS: **6** (7229_AS_TS1–TS6).
   7. Connectivity & Security TS: **21** (7229_C&S_TS1–TS21).
   8. Performance TS: **4** ids (7229_PF_TS1–TS4) over 17 measurement rows.
   9. Performance TS - New Installer: **4** (7229_PF__NI_TS1–TS4).
   10. Plus **Download Time for Installer**: TS1–TS6 (first table) and TS1–TS9 (retest table "After AWS is up").
8. **Three test rounds** per TS sheet (sheet R7 band headers): "Before New Design Changes", "AFTER New Design Changes", "New Installer Web socket". Each round has its own Laptop + Test Result column.
9. **Result counts (main TS) — typed values in "Overall Progress":**
   1. **Final Installer (Latest)** (R13): "Pass" **40**, "N/A" **50**, "Count" **90**. Per module: Dermalog 13 Pass; MyKad 8 N/A; Thumbprint 9 Pass; 2 MyKads 12 N/A; Functional 8 N/A; Auto Scan 6 Pass; Connectivity & Security 8 Pass / 13 N/A; Performance 4 Pass / 9 N/A (R5–R12).
   2. **AFTER New Design Changes** (R32): Pass **80**, N/A **14**, Count **94**.
   3. **BEFORE New Design Changes** (R50): Partial Pass **24**, Pass **52**, N/A **6**, Count **82**.
   4. **No "Failed" value** is typed in any round. Failed / Not Started / In Progress cells are formulas only.
10. **Browser summary (sheet "Browsers", R9–R18):**
   1. Chrome "v139.0.7258.139 (Latest)", Web Socket, P1 — all seven TS groups "Partial PASS", except Performance "PASS".
   2. Firefox "v36.0.4", Java Applet, P1 — "E2E Happy Flow for any P1 Module", "PASS", remark "eSTM module (E2E + thumbprint )".
   3. Firefox "v142.0 (Latest)", Web Socket, P2 — "PASS", remark "Pending MJ to confirm with KM ⏎ BMK module  (E2E + thumbprint )".
   4. Edge "v139.0.3405.111 (Latest)", Web Socket, P2 — "PASS", remark "Pending MJ to confirm with KM ⏎ STMS module  (E2E + thumbprint )".
11. **Testers named in the main TS:** Nadhirah, Nabila, Nick, Charmain, Zuhaira, Azfar (QA column, all sheets). The page list names none.
12. **Dates written in the main TS:**
    1. "Installer not ready, need dev to provide the file to download and patch (as of 21/08/2025 9.30AM)" ("Browsers", R25).
    2. "Retested 10/10/2025" (many Remarks cells).
    3. "Nadhirah 25/1125", "26/1125", "25/11/25", "26/11/25" (QA cells, final installer round).
    4. "Tested with latest websocket installer received on 25th Nov (Tues)." ("Performance TS - New Installer", R9).

## Changes since last study (2026-10-28)

### This run (third run) — "List of Modules and Pages that requires Thumbprint (UCD).xlsx"

1. **What changed:** this run reads the **older UCD-only page list** (modified 02/09/2025, 2:13:25 pm) for the first time. It is added as §3k.
2. **No row-by-row diff against itself:** no earlier text copy of this workbook exists in the repo. Its SharePoint date (02/09/2025) is the **oldest** of the three workbooks, so it is new to this study, not a new SharePoint edit [unconfirmed — only file dates seen].
3. **New scenarios / pages:** 17 page rows in 8 groups (§3k). Page inventory only: **no TS id, no expected result, no Pass/Fail, no marks**.
4. **Removed scenarios:** none. Main TS and the UCD & AATF list are unchanged since their earlier runs.
5. **Result changes:** none. This workbook holds no results.
6. **Older list vs newer UCD & AATF list (what the Feb 2026 list added or renamed):**
   1. **UCD To UCD (Standard) and (Interstate)** — absent in the older list; present in the newer one (UCD sheet, R8–R16).
   2. **eSerahan Permission** — older list has 4 rows (Sheet1, R13–R16). Newer list adds "eSerahan L1 User - e-Serahan User Activation Page (L1 User)" and "eSerahan Approval User - e-Serahan User Activation Page (L2 User)" (UCD sheet, R27–R28).
   3. **Insurance** — older list has 4 rows (Sheet1, R24–R27); newer list adds "Director Verification To Add Insurance User (Main User)" (UCD sheet, R38).
   4. **BMK dealer step** — older list: "Step 2 - Dealer" (Sheet1, R20). Newer list: "Step 3 - Dealer" (UCD sheet, R33). `flow-bmk.md` line 54 says Step 3. The older row is **outdated or a typo** [unconfirmed which].
   5. **STMS** — older: "Create New Transaction (All)" (Sheet1, R4). Newer: "Create New Transaction (MyKad, MyPR, Company)" (UCD sheet, R4).
   6. **Settings** — older: "User Accounts" › "Add User Account (Main User)" (Sheet1, R30–R31). Newer: "Manage Users" › "Add New User Account (Main & Sub User)" (UCD sheet, R48–R49).
   7. **Pre e-Invoice** — older: "Update Company/Business Profile" › "Step 3 - MVD Agreement" (Sheet1, R34–R35). Newer: "Step 3 - MVD License Agreement & Thumbprint Verification" (UCD sheet, R45).
   8. **First login** — older: "First Time Login New UCD" (Sheet1, R38). Newer: "First Time Login New UCD (Main User)" (UCD sheet, R52).
   9. **AATF** — no AATF sheet in the older list.
   10. **Card notes and ✅ / "??" marks** — none in the older list; added in the newer one.
7. **Corrections made in this run:**
   1. **Sources read** said the UCD-only list (catalogue #122) was "Not read". Fixed (Sources read items 3 and 9).
   2. **Header item 2** said two workbooks studied. Now three.
   3. **Page-list number column:** the older list puts "1", "2", "3"… in column A beside each page (Sheet1, R5–R38), so column A there is a **running number per group**. The number beside a module name in the newer list stays [unconfirmed].

### Earlier run (second run) — "List of Modules and Pages that requires Thumbprint (UCD & AATF).xlsx"

1. Read the newer page list for the first time; 31 page rows added as §3j (24 UCD, 7 AATF). No results in it. Tick column: "✅" on 10 rows, "??" on 2 rows (BMK Step 1 Owner R32; Dereg Step 1 Owner R5), "x" on 1 group header (Upload COD, AATF R7); meaning [unconfirmed].
2. Corrections then: main TS sheet count "11" → **13**; Studying-folder claim fixed; Portal / module now names AATF pages; Gap 1 rewritten.

## 2. What the ticket changed, as the TS shows it

1. **Reader technology:** the **Firefox 36.0.4 Java applet** is replaced by a **WebSocket** reader for Chrome (P1), Edge and Firefox latest (P2). Firefox 36.0.4 keeps the applet ("Browsers", R9–R18).
2. **New buttons:** the WebSocket page adds **[Reconnect]**. "Java applet dont have [Reconnect] button" ("Functional TS", R16, existing-behaviour column).
3. **Final button name is [Scan IC]**, replacing [Verify] / [Read MyKad] in the new design (e.g. "Dermalog TS" R13–R14 expected column). The next-step button reads **[Next]** in the expected design; the interim Chrome build showed **[Continue]** ("Thumbprint TS" R15, actual column).
4. **Auto Scan IC (new):** the page reads the card automatically in three 3-second intervals, then falls back to manual ("Auto Scan TS", R10–R15).
5. **HMAC on WebSocket messages (new):** "HMAC present and valid" ("Connectivity & Security TS", R20, actual column).
6. **One-tab rule (new):** a second tab with the same auth page closes the session ("Connectivity & Security TS", R23–R25, R27–R28).
7. **New error messages** replace Java errors such as "java.net.NoRouteToHostException: No route to host: connect" ("Connectivity & Security TS", R10, existing column).
8. **New installer:** "Dermalog Biometric Software Installation.msi" (login page) and "Dermalog Biometric Software Upgrade.msi" (UCD / AATF Download page and Chrome Step 1 thumbprint page) ("Download Time for Installer", R6 NOTE).

## 3. Scenarios

Expected = the "Expected Result (New Design)" column unless stated. Result = final round recorded.

### 3a. Dermalog device (sheet "Dermalog TS")

1. **7229_DD_TS1** (P1) — no device. Expected: "Please plug in Dermalog Biometric Device and click [Reconnect]", [Reconnect] enabled. PASS (R10).
2. **7229_DD_TS2** (P1) — unplug before read. Expected: "Please plug in dermalog and click [Reconnect]". PASS; issue EAINT-8857 (R11).
3. **7229_DD_TS3** (P1) — unplug during read. Expected: "Unable to read photo. Please try again." then [OK] to verification page with [Scan IC] enabled. PASS; EAINT-8856 (R12).
4. **7229_DD_TS4** (P1) — unplug after read. Expected: "Place Thumb on reader", [Scan] disabled. PASS (R13).
5. **7229_DD_TS5** (P1) — unplug during thumbprint. Expected: no error, [Scan IC] disabled. PASS (R14).
6. **7229_DD_TS6** (P1) — unplug after thumbprint. Expected: no error, [Next] works. PASS (R15).
7. **7229_DD_TS7** (P1) — reconnect before read. Expected: "Please insert IC and click [Read MyKad]." PASS (R16).
8. **7229_DD_TS8** (P1) — reconnect during read. Expected: "Unable to read photo. Please try again." then Auto Scan IC. PASS; EAINT-8856 (R17).
9. **7229_DD_TS9** (P1) — reconnect after read. Expected: stays on "Place thumb on reader", "Only after refreshing page then will allow to restart reading MyKad". PASS (R18).
10. **7229_DD_TS10** (P1) — reconnect during thumbprint. Expected: "Place thumb on reader.", cannot proceed. PASS (R19).
11. **7229_DD_TS11** (P1) — reconnect after thumbprint. Expected: proceed to next step. PASS (R20).
12. **7229_DD_TS12** (P2) — retry read after reconnect. Expected: "Unable to read photo. Please try again." then Auto Scan IC. PASS; EAINT-8856 (R21).
13. **7229_DD_TS13** (P3) — rapid plug / unplug. Expected: "Unable to read photo. Please try again." PASS; EAINT-8856 (R22).

### 3b. MyKad (sheet "MyKad TS")

1. **7229_MK_TS1** (P1) — valid MyKad. Expected: "User able to proceed with thumbprint". PASS (R10).
2. **7229_MK_TS2** (P1) — no card. Expected: "No card is detected. Please insert IC and click [Scan IC] to try again." PASS (R11).
3. **7229_MK_TS3** (P1) — invalid MyKad. Expected: with chip, after 10 s "No card is detected…"; without chip "Please ensure the IC is placed properly or the chip surface is cleaned". PASS (R12).
4. **7229_MK_TS4** (P2) — retry after failed read. Expected: "Place thumb on reader.", proceed. PASS (R13).
5. **7229_MK_TS5** (P2) — multiple failed reads. Same as TS4. PASS (R14).
6. **7229_MK_TS6** (P1) — remove card during read. Expected: "Unable to read photo. Please try again." then Auto Scan IC. PASS; EAINT-8856 (R15).
7. **7229_MK_TS7** (P1) — remove card after read. Expected: proceed with thumbprint. PASS (R16).
8. **7229_MK_TS8** (P1) — non-MyKad card. Expected: Auto Scan IC messages per chip / no chip. PASS (R17).

### 3c. Thumbprint (sheet "Thumbprint TS")

1. **7229_TP_TS1 / TS2** (P1) — correct right / left thumb. Expected: "Verification Passed" and "Verification Completed", [Next] works. PASS (R10–R11).
2. **7229_TP_TS3** (P1) — wrong thumb. Expected: "Verification failed. Please click on [Scan IC] to try again". PASS; EAINT-8854 (R12).
3. **7229_TP_TS4** (P2) — retry after wrong thumb. Same message. PASS; EAINT-8855 (R13).
4. **7229_TP_TS5** (P2) — many wrong thumbs then right. Expected: [Scan IC] re-reads, then pass. PASS; EAINT-8855 (R14).
5. **7229_TP_TS6 / TS7 / TS8** (P1) — remove card before / during / after thumbprint. Expected: verification still passes. PASS (R15–R17).
6. **7229_TP_TS9** (P2) — refresh after thumbprint. Expected: "After refresh: ⏎ - System reset MyKad and Thumbprint". PASS (R18).

### 3d. Two MyKads (sheet "2 MyKads TS")

1. **7229_2MK_TS1** (P1) — two valid cards at once. Expected: "System read & show only one MyKad details". AFTER PASS (R10).
2. **7229_2MK_TS2** (P2) — one valid, one invalid. Expected: shows MyKad A only. AFTER PASS (R11).
3. **7229_2MK_TS3** (P1) — swap before read. Expected: reads MyKad B. AFTER PASS (R12).
4. **7229_2MK_TS4** (P1) — swap during read. Expected: "Unable to read photo. Please try again." AFTER PASS; EAINT-8859 (R13).
5. **7229_2MK_TS5–TS7** (P1) — swap after read / during / after thumbprint. Expected: flow stays on MyKad A. AFTER PASS (R14–R16).
6. **7229_2MK_TS8** (P1) — swap after cancel. Expected: "a new transaction flow is started with MyKad B". AFTER PASS (R17).
7. **7229_2MK_TS9** (P2) — thumb of A after swap. Expected: proceed. AFTER PASS (R18).
8. **7229_2MK_TS10** (P2) — thumb of B after swap. Expected: "Verification failed. Please click on [Scan IC] to try again." AFTER PASS; EAINT-8854 (R19).
9. **7229_2MK_TS11** (P2) — retry after failed swap. Expected: "Unable to retry after swap from MyKad A to B while reading". AFTER **N/A**; remark "Pending new changes to remove [Verify] button after failed verification" (R20).
10. **7229_2MK_TS12** (P3) — rapid swaps during thumbprint. Expected: "Verification Passed". AFTER PASS (R21).
11. Final installer round: all **N/A** (Overall Progress R8).

### 3e. Functional (sheet "Functional TS")

1. **7229_FUNC_TS1–TS5** (P2, TS5 P1) — [Cancel] before / during / after read, during / after thumbprint. Expected: "Redirect to Create STMS Transaction category page". AFTER PASS (R10–R14).
2. **7229_FUNC_TS6** (P3) — rapid [Cancel]. Expected: "[Cancel] > [No] remains on same page", "[Cancel] > [Yes] will cancel transaction". AFTER PASS (R15).
3. **7229_FUNC_TS7** (P3) — rapid [Reconnect]. **No expected result written.** AFTER N/A (R16).
4. **7229_FUNC_TS8** (P3) — rapid [Read MyKad] with no card. Expected: "Please ensure the MyKad is placed properly or the chip surface is cleaned". AFTER PASS (R17).

### 3f. Auto Scan (sheet "Auto Scan TS")

1. **7229_AS_TS1–TS3** (P1) — auto read on 1st / 2nd / 3rd 'READCARD'. Expected: "The card is read within the first 3 second interval" (second / last for TS2 / TS3). PASS (R10–R12).
2. **7229_AS_TS4** (P1) — manual read after Auto Scan timeout. Expected: "MyKad is read manually upon clicking on button [Read MyKad]". PASS (R13).
3. **7229_AS_TS5** (P2) — chip card that is not MyKad. Expected: "Auto Scan timeout after 10 seconds and will display manual read MyKad page with [Scan IC] button enabled". PASS (R14).
4. **7229_AS_TS6** (P2) — card without chip. Expected: "Auto Scan will run for 3 times and will display manual read MyKad page with [Scan IC] button enabled". PASS (R15).

### 3g. Connectivity & security (sheet "Connectivity & Security TS")

1. **7229_C&S_TS1–TS3, TS5, TS6** (P1) — network lost before / during / after read, during / after thumbprint. Expected: [Next] blocked, popup "Title: Error ⏎ No internet connection. Please try again when you have a stable connection." AFTER PASS; UI issue EAINT-8871 (R10–R12, R14–R15).
2. **7229_C&S_TS4** (P1) — MyKad read timeout. Expected: "No MyKad read timeout as [Scan IC] button will be enabled once it detects invalid MyKad". N/A (R13).
3. **7229_C&S_TS7** (P1) — thumbprint timeout. Expected: "Tested for over 10 minutes, Web Socket didn't hit any timeout. No timeout for thumbprint." N/A (R16).
4. **7229_C&S_TS8** (P2) — restore network. Expected: "Verification Passed", proceed. AFTER PASS (R17).
5. **7229_C&S_TS9** (P2) — retry after read timeout. Expected: Manual Scan IC messages. AFTER PASS; EAINT-8874 (R18).
6. **7229_C&S_TS10** (P2) — retry after thumbprint timeout. Expected: "No timeout". N/A (R19).
7. **7229_C&S_TS11** (P1) — HMAC visible in F12. Expected: "HMAC is displayed in data description". PASS (R20).
8. **7229_C&S_TS12** (P1) — wrong HMAC key in DB after read. Expected: "Able to proceed to next step". PASS (R21).
9. **7229_C&S_TS13** (P1) — wrong HMAC key in DB before read. Expected: "Unable to proceed to next step", "Error message prompted "Please read the MyKad again"". PASS (R22).
10. **7229_C&S_TS14, TS20, TS21** (P2) — same auth page opened in a second tab (after read / during Auto Read / after details). Expected Tab B: "Your session was closed because you opened the authentication page in another tab. Please close this tab and refresh the original tab to continue". PASS; EAINT-8875 (R23–R25).
11. **7229_C&S_TS15** (P1) — applet browser + WebSocket browser at once. Expected: "Applet able to read MyKad and do thumbprint the same time as Websocket". PASS; remark "KM okay with the actual result" (R26).
12. **7229_C&S_TS16** (P2) — two WebSocket browsers. Expected: same one-tab message. PASS (R27).
13. **7229_C&S_TS17** (P3) — User B opens User A's Step 3 URL (same company). Expected: one-tab message. AFTER PASS (R28).
14. **7229_C&S_TS18** (P3) — reuse Step 1–3 URLs after Step 4. Expected: Step 1 and Step 3 still usable, Step 2 not. AFTER PASS; "It's existing issue" (R29).
15. **7229_C&S_TS19** (P3) — MyKad details on all pages. Expected: correct on "UCD Step Page", "UCD & BO Transaction Listing Page", "UCD & BO Transaction Details Page", "BO JPJ XML Log". AFTER PASS (R30).

### 3h. Performance (sheets "Performance TS" and "Performance TS - New Installer")

1. **7229_PF_TS1 / PF__NI_TS1** — device load time, page land to "Please insert IC and click [Read MyKad].". PASS.
2. **7229_PF_TS2 / PF__NI_TS2** — MyKad reading time. PASS.
3. **7229_PF_TS3 / PF__NI_TS3** — thumbprint verification time. PASS.
4. **7229_PF_TS4 / PF__NI_TS4** — next step load time. PASS.
5. Method: "Time taken for 5 readings & average" (every PF row).

### 3i. Installer download time (sheet "Download Time for Installer")

1. First table (R4–R21): single and concurrent downloads by 1–3 testers, 4.07 to 13.49 minutes.
2. Retest table under "After AWS is up, to retest the table below" (R24–R41): **1.1 to 3.31 sec** for all rows.

### 3j. Pages that need a thumbprint (page-list workbook)

Format: page — card note (verbatim) — mark. A number after the module name is in the sheet; its meaning is [unconfirmed].

**Sheet "UCD"**

1. **STMS** ("Sistem Tukar Milik Sementara (STMS)", "3", "- IN STEP 3", R3) › "Create New Transaction (MyKad, MyPR, Company)" (R4):
   1. "Step 1 - Seller (Owner)" — extra cell "Step 1 - Company," (R5).
   2. "Step 3 - Buyer (Dealer)" — "Please use login user" — ✅ (R6).
2. **UCD To UCD (Standard)** ("1", R8) › "Create New Transaction": "Step 1 - Seller (Owner)" (R10); "Step 3 - Buyer (Dealer)" — "Please use login user" — ✅ (R11).
3. **UCD To UCD (Interstate)** ("1", R13): same two steps (R15); Step 3 — "Please use login user" — ✅ (R16).
4. **eSTM** ("eSerahan Tukar Milik (eSTM)", R18) › "Create New Transaction (MyKad, MyPR, Company)" ("3", R19):
   1. "Step 1 - Buyer (Customer)" (R20).
   2. "Step 3 - Seller (Dealer)" — "Please use login user" — ✅ (R21).
5. **eSerahan Permission** (R22), no mark on any row:
   1. "Director Verification To Add eSerahan User (Main User)" (R23).
   2. "Director Verification To Remove e-Serahan User (Main User)" (R24).
   3. "Director Verification To Inactivate e-Serahan User (Main User)" (R25).
   4. "e-Serahan User Activation Page (Sub User)" (R26).
   5. "eSerahan L1 User - e-Serahan User Activation Page (L1 User)" (R27).
   6. "eSerahan Approval User - e-Serahan User Activation Page (L2 User)" (R28).
6. **BMK** ("Butiran Maklumat Kenderaan (BMK)", "4", "COMPANY STEP 1 & 3", R30):
   1. "Step 1 - Owner" — "Please use login user's MyKad" — "??" (R32).
   2. "Step 3 - Dealer" — "Please use login user's MyKad" — ✅ (R33).
7. **Insurance** › "Update Insurance Permission" (R35–R36), no mark on any row:
   1. "Director Verification To Accept Insurance Commercial Agreement (Main User)" (R37).
   2. "Director Verification To Add Insurance User (Main User)" (R38).
   3. "Director Verification To Remove Insurance User (Main User)" (R39).
   4. "Director Verification To Inactivate Insurance User (Main User)" (R40).
   5. "Insurance User Activation Page (Sub User)" (R41).
8. **Pre e-Invoice** ("4", R43) › "Update Company/Business Profile (ROB, ROC, Trading License Number, Limited Liability Partnership)" (R44): "Step 3 - MVD License Agreement & Thumbprint Verification" — "Please use main user MyKad" — ✅ (R45).
9. **Settings** › "Manage Users" › "Add New User Account (Main & Sub User)" (R47–R49), no mark.
10. **Create New UCD Company Account** › "First Time Login New UCD (Main User)" (R51–R52), no mark.

**Sheet "AATF"**

1. **Deregistration (DEREG)** (R3) › "Create New Transaction (MyKad, MyPR)" ("2", "STEP 3 ONLY", R4):
   1. "Step 1 - Owner" — "Please use Owner's MyKad." — "??" (R5).
   2. "Step 3 - AATF" — "Please use login user's MyKad" — ✅ (R6).
2. **Upload Certificate of Destruction (COD)** ("2", "x", R7): "Step 1 - AATF" — "Please use the login user's MyKad" — ✅ (R8).
3. **Settings** ("2", R10) › "Manage Users" (R11):
   1. "Add New User Account (Main User)" — "Please use login user's MyKad" — ✅ (R12).
   2. "Update User Account (Main User)" — "Please use login user's MyKad" — ✅ (R13).
4. **Create New AATF Company Account** › "First Time Login New AATF (Main User)" (R15–R16), no mark.
5. **Create New AATF User Account** › "First Time Login New AATF (Sub User)" (R18–R19), no mark.

### 3k. Pages that need a thumbprint (older UCD-only list, 02/09/2025)

Sheet "Sheet1". Format: page (row). Column A holds a running number per group. No notes, no marks, no results.

1. **STMS** ("Sistem Tukar Milik Sementara (STMS)", R3) › "Create New Transaction (All)" (R4): "Step 1 - Seller (Owner)" (R5); "Step 3 - Buyer (Dealer)" (R6).
2. **eSTM** ("eSerahan Tukar Milik (eSTM)", R8) › "Create New Transaction" (R9): "Step 1 - Buyer (Customer)" (R10); "Step 3 - Seller (Dealer)" (R11).
3. **eSerahan Permission** (R12):
   1. "Director Verification To Add eSerahan User (Main User)" (R13).
   2. "e-Serahan User Activation Page (Sub User)" (R14).
   3. "Director Verification To Remove e-Serahan User (Main User)" (R15).
   4. "Director Verification To Inactivate e-Serahan User (Main User)" (R16).
4. **BMK** ("Butiran Maklumat Kenderaan (BMK)", R18): "Step 1 - Owner" (R19); "Step 2 - Dealer" (R20) — see Changes item 6.4.
5. **Insurance** › "Update Insurance Permission" (R22–R23):
   1. "Director Verification To Accept Insurance Commercial Agreement (Main User)" (R24).
   2. "Director Verification To Remove Insurance User (Main User)" (R25).
   3. "Director Verification To Inactivate Insurance User (Main User)" (R26).
   4. "Insurance User Activation Page (Sub User)" (R27).
6. **Settings** › "User Accounts" › "Add User Account (Main User)" (R29–R31).
7. **Pre e-Invoice** › "Update Company/Business Profile" › "Step 3 - MVD Agreement" (R33–R35).
8. **Create New UCD Company Account** › "First Time Login New UCD" (R37–R38).

## 4. Business rules and system behaviour

1. **Final message set (new design):**
   1. No device: "Please plug in Dermalog Biometric Device and click [Reconnect]" ("Dermalog TS", R10).
   2. No card: "No card is detected. Please insert IC and click [Scan IC] to try again." ("MyKad TS", R11).
   3. Card without chip: "Please ensure the IC is placed properly or the chip surface is cleaned" ("MyKad TS", R12).
   4. Card pulled / device lost during read: "Unable to read photo. Please try again." ("Dermalog TS", R12).
   5. Wrong thumb: "Verification failed. Please click on [Scan IC] to try again" ("Thumbprint TS", R12).
   6. Good thumb: "Verification Passed" and "Verification Completed" ("Thumbprint TS", R10).
   7. Network lost at [Next]: "No internet connection. Please try again when you have a stable connection." ("Connectivity & Security TS", R10).
   8. Second tab: "Your session was closed because you opened the authentication page in another tab. Please close this tab and refresh the original tab to continue" (R23).
   9. HMAC key wrong: "Please read the MyKad again" (R22).
2. **Auto Scan timing:** three 'READCARD' attempts, each a "3 second interval" ("Auto Scan TS", R10–R12). A chip card that is not MyKad times out "after 10 seconds" (R14).
3. **No thumbprint timeout:** "Tested for over 10 minutes, Web Socket didn't hit any timeout. No timeout for thumbprint." ("Connectivity & Security TS", R16).
4. **Card can leave the reader after a good read:** "System able to detect thumbprint successfully after MyKad read successful and removed before thumbprint" ("Thumbprint TS", R15).
5. **Two cards in readers:** "System read & show only one MyKad details" ("2 MyKads TS", R10). After a read, swapping cards does not change the subject: "User able to proceed with thumbprint as MyKad reading is from MyKad A" (R15).
6. **Refresh resets the widget:** "After refresh: ⏎ - System reset MyKad and Thumbprint" ("Thumbprint TS", R18).
7. **Device reconnect after a read needs a page refresh:** "Only after refreshing page then will allow to restart reading MyKad" ("Dermalog TS", R18).
8. **Applet and WebSocket can run at the same time** on two browsers: "Applet able to read MyKad and do thumbprint the same time as Websocket" ("Connectivity & Security TS", R26); remark "KM okay with the actual result".
9. **Step URLs stay reachable after Step 4 (existing issue):** "Step 1: Able to do thumbprint for new trx & proceed with next step", "Step 3: Able to redo thumbprint for same trx & proceed with next step" ("Connectivity & Security TS", R29); remark "It's existing issue, both preprod1 & sit2 behave the same".
10. **HMAC check is enforced:** with the key changed in the DB before the read, "Unable to proceed to next step" ("Connectivity & Security TS", R22). With the key changed after the read, "Able to proceed to next step" (R21).
11. **Installer files:** "Dropdown Name: Dermalog Biometric Software", "File Name: Dermalog Biometric Software Installation.msi" (login page); "Buttton Name: Dermalog Biometric Software Upgrade", "File Name: Dermalog Biometric Software Upgrade.msi" (UCD / AATF Download page); "[Chrome] Step 1 Thumbprint Page: ⏎ - Button Name: Download Installer" ("Download Time for Installer", R6 NOTE).
12. **Two installer versions:** "2 versions of installer: ⏎ 1. Upgrade version  ⏎ 2. New Installation version + Driver File (will be with CS team)" ("Download Time for Installer", R4 NOTE).
13. **WebSocket is faster at the next step:** Firefox applet next-step averages "30.25", "40.72", "34.54" s vs Chrome WebSocket "1.08", "0.62", "0.78" s ("Performance TS - New Installer", R18).
14. **Old vs new Dermalog device:** "no noticeable difference in loading time between the old and new Dermalog devices." ("Performance TS - New Installer", R9 note).
15. **Windows 7 out of scope:** "YF feedback not to test Windows 7 as it's too old" ("QA Laptop Specs", R4).
16. **Whose MyKad at each step (page list):**
    1. Dealer / AATF step uses the logged-in user's card: "Please use login user" (UCD, R6, R11, R16, R21); "Please use login user's MyKad" (UCD R33; AATF R6, R12, R13).
    2. Company profile step uses the main user's card: "Please use main user MyKad" (UCD, R45).
    3. Dereg owner step uses the owner's card: "Please use Owner's MyKad." (AATF, R5).
    4. BMK Step 1 Owner also says "Please use login user's MyKad" (UCD, R32) but is marked "??" [unconfirmed whether this is settled].
17. **Seller / buyer roles flip between STMS and eSTM:** STMS "Step 1 - Seller (Owner)", "Step 3 - Buyer (Dealer)" (UCD, R5–R6); eSTM "Step 1 - Buyer (Customer)", "Step 3 - Seller (Dealer)" (UCD, R20–R21).
18. **Dereg note "STEP 3 ONLY"** (AATF, R4) and BMK note "COMPANY STEP 1 & 3" (UCD, R30) suggest which steps carry the read for some ID types [unconfirmed meaning].
19. **Company Profile update sits under "Pre e-Invoice"** in both page lists (UCD & AATF list, UCD sheet R43–R45; UCD-only list, Sheet1 R33–R35).
20. **Thumbprint page scope grew between Sept 2025 and Feb 2026:** the UCD-only list (02/09/2025) has 17 pages; the UCD & AATF list (25/02/2026) has 24 UCD + 7 AATF pages. Added: UCD To UCD, eSerahan L1 / L2 activation, Add Insurance User, all AATF pages (Changes item 6) [unconfirmed whether these pages gained a thumbprint later or were only missed in the first list].
21. **BMK dealer step number conflicts between lists:** "Step 2 - Dealer" (UCD-only list, Sheet1, R20) vs "Step 3 - Dealer" (UCD & AATF list, UCD sheet, R33). Knowledge and the newer list agree on Step 3.

## 5. Test data, environments, accounts, setup

1. **Environment:** "staging/sit2" (every TS sheet, R4). C&S_TS18 also compared "preprod1" (R29).
2. **Hardware:** a physical **Dermalog** reader. Rows tag "Tested with NEW Dermalog" or "Tested with -OLD dermalog". 2MK_TS1–TS2 need "2 Dermalog connected" (R10–R11).
3. **Cards:** valid MyKads A and B (two different people), an invalid MyKad, a chip card that is not MyKad ("e.g. Debit Card", "Auto Scan TS" R14) and a card without chip.
4. **Accounts:** "User A & B is UCD under the same company" ("Connectivity & Security TS", R28). Download rows use "Company A" / "Company B" and user types UCD and AATF. **No credentials present** in the sheet.
5. **Dev help needed:** "Ask dev help to amend the key in DB (to wrong key)" ("Connectivity & Security TS", R21–R22).
6. **DevTools:** "Suggested to use F12 during testing, to simulate issues and help dev debug" ("Browsers", R24). HMAC rows use "F12 > Network > Socket > Messages > Data" (R20).
7. **Laptops:** sheet "QA Laptop Specs" lists 12 machines with Windows version, CPU, RAM and priority. All "Firefox Java Applet" / "Chrome Web Socket" tick cells are "false".
8. **Page list setup:** cards needed per page are login user, main user and owner (§4 item 16). No environment, account or **credentials** in either page-list workbook. The UCD-only list has no card notes at all.

## 6. Gaps and risks for regression

1. **Only STMS, eSTM and BMK were run end to end in the main TS.** Cancel rows target STMS; Browsers sheet names eSTM (Firefox 36), BMK (Firefox 142), STMS (Edge). The page list (§3j) names the other pages but records **no result**. Pages with **no mark at all**: eSerahan Permission (6 rows), Update Insurance Permission (5 rows), UCD Manage Users add, First Time Login New UCD (Main), First Time Login New AATF (Main and Sub). Pages marked "??": BMK Step 1 Owner, Dereg Step 1 Owner. A regression should still touch these.
2. **Final installer round left 50 of 90 rows N/A** (Overall Progress R13): MyKad, 2 MyKads, Functional and most Connectivity rows were not rerun on the final installer.
3. **Open sign-offs in the sheet:** "Regression Testing, Pending BA to confirm on the expected result" (Browsers R14); "Pending BA to confirm with KM" (R15); "Pending MJ to confirm with KM" (R17–R18). No closing note is written.
4. **7229_FUNC_TS7 has no expected result**, and **7229_2MK_TS11** waits on "Pending new changes to remove [Verify] button after failed verification".
5. **Text inconsistencies to watch:**
   1. MK_TS8 expected says "No card is detecetd. Please insert IC and click [Read IC] to try again." (typo and [Read IC] instead of [Scan IC]) ("MyKad TS", R17).
   2. AS_TS4 step says "click [Read IC]" while expected says "[Read MyKad]" ("Auto Scan TS", R13).
   3. DD_TS4 expected uses "[Scan]" where other rows use "[Scan IC]" ("Dermalog TS", R13).
6. **No thumbprint timeout** means a page can sit open forever with a session held [unconfirmed risk].
7. **Step URL reuse (C&S_TS18)** lets a user redo Step 3 thumbprint for the same transaction after Step 4. Logged as existing; no fix recorded.
8. **Firefox below 36 block, browser reminder and the weekly WebSocket / applet usage email** are not in this TS. Check them from `flow-browser-reminder.md` and EAINT-11935.
9. **Use the newer page list, not the older one, for regression scope.** The UCD-only list (02/09/2025) misses UCD To UCD, eSerahan L1 / L2 activation, Add Insurance User and all AATF pages, and gives BMK dealer as "Step 2" (Sheet1, R20). A regression built from it would leave pages out.
10. **Performance spread:** Lenovo IdeaPad device load "Min: 9.02 ⏎ Max: 53.01 ⏎ Avg: 28.68" on Java applet ("Performance TS - New Installer", R5). Slow machines can look like a hang.

## Knowledge candidates

1. **HMAC is checked, not just sent.** `flow-platform.md` line 123 says "[unconfirmed] Responses are HMAC-signed. Whether eAuto checks the signature is not known." This TS shows a wrong key blocks the flow: "Unable to proceed to next step ⏎ - Error message prompted "Please read the MyKad again"" [from SharePoint TS #053 EAINT-7229, sheet Connectivity & Security TS, row 22]. Candidate: drop the [unconfirmed] tag and cite this row.
2. **Screen text correction.** `flow-platform.md` line 87 gives the landing text as "Please insert MyKad into the reader." That is the **Firefox 36 applet** text (existing-behaviour column). New design text: "Please insert IC and click [Read MyKad]." [from SharePoint TS #053 EAINT-7229, sheet Dermalog TS, row 16] and Performance rows "'Please insert IC and click [Read MyKad].'" [sheet Performance TS, row 10].
3. **Auto Scan timing:** three 'READCARD' attempts of 3 s each; chip card not MyKad times out "after 10 seconds"; no-chip card "Auto Scan will run for 3 times" [from SharePoint TS #053 EAINT-7229, sheet Auto Scan TS, rows 10–15]. `flow-platform.md` line 88 has the 3 intervals but not the 10-second rule.
4. **One-tab rule message:** "Your session was closed because you opened the authentication page in another tab. Please close this tab and refresh the original tab to continue" [sheet Connectivity & Security TS, row 23]. Matters for automation: a second tab or parallel run on the same auth page kills the first [unconfirmed for the emulator].
5. **No thumbprint timeout:** "Tested for over 10 minutes, Web Socket didn't hit any timeout. No timeout for thumbprint." [sheet Connectivity & Security TS, row 16].
6. **Network-loss popup:** "No internet connection. Please try again when you have a stable connection." [sheet Connectivity & Security TS, row 10].
7. **Wrong-thumb message:** "Verification failed. Please click on [Scan IC] to try again" [sheet Thumbprint TS, row 12]. Not yet in `business-rules-from-test-scenarios.md` §15.
8. **Installer file names:** "Dermalog Biometric Software Installation.msi" (login page) and "Dermalog Biometric Software Upgrade.msi" (UCD / AATF Download page, Chrome Step 1 "Download Installer") [sheet Download Time for Installer, row 6]. Fits `flow-platform.md` § QA scope line 130.
9. **Browser matrix detail:** Firefox "v142.0 (Latest)" on WebSocket is P2 [sheet Browsers, row 17]. `flow-platform.md` line 119 lists Chrome, Edge and Firefox 36 only; `flow-stms.md` line 148 says "Firefox 37+". Candidate: add Firefox latest (WebSocket, P2).
10. **Existing issue — step URL reuse:** Step 1 and Step 3 URLs still accept a thumbprint after Step 4; "It's existing issue, both preprod1 & sit2 behave the same" [sheet Connectivity & Security TS, row 29]. Candidate for `flow-stms.md` / `flow-estm.md` traps.
11. **QA-Issue tickets raised under this CR:** EAINT-8854, 8855, 8856, 8857, 8859, 8871, 8874, 8875 (Remarks cells, all TS sheets). Candidate for the ticket history in `flow-platform.md`.
12. **Missing AATF page:** `flow-platform.md` line 93 and `business-rules-from-test-scenarios.md` §13 item 4 list "Create New AATF Company Account" but not the sub-user first login: "Create New AATF User Account" › "First Time Login New AATF (Sub User)" [from SharePoint TS #121 List of Modules and Pages that requires Thumbprint (UCD & AATF), sheet AATF, rows 18–19].
13. **Missing UCD page detail:** `flow-platform.md` line 86 says "UCD to UCD"; the page list splits it into "UCD To UCD (Standard)" and "UCD To UCD (Interstate)", each Step 1 Seller (Owner) and Step 3 Buyer (Dealer) [sheet UCD, rows 8–16]. It also gives Manage Users as "Add New User Account (Main & Sub User)" [sheet UCD, row 49].
14. **Whose card per step:** "Please use login user" on dealer Step 3 rows, "Please use main user MyKad" on Company Profile Step 3 [sheet UCD, rows 6, 45]. Useful for the MyKad emulator data in automation.
15. **Catalogue count looks wrong:** `cr-test-scenario-catalogue.md` row #121 records "UCD:39; AATF:0 | 39". The text copy holds 7 AATF page rows (sheet AATF, R5–R19) [unconfirmed what the catalogue counted].
16. **Catalogue #122 understates the older list:** `cr-test-scenario-catalogue.md` row #122 records "Sheet1:0 | 0" and modules "STMS, eSTM, eSerahan Permission (Sheet1)". The text copy holds 17 page rows in 8 groups, also BMK, Insurance, Settings, Pre e-Invoice and First Time Login New UCD [from SharePoint TS #122 List of Modules and Pages that requires Thumbprint (UCD), Sheet1, R3–R38]. Candidate: fix the row and mark #122 as superseded by #121.
17. **BMK dealer step:** older list says "Step 2 - Dealer" [#122, Sheet1, R20]; newer list says "Step 3 - Dealer" [#121, sheet UCD, R33]. `flow-bmk.md` line 54 already says Step 3. Candidate: note the older row as outdated so nobody follows it.
