# EAINT-9805 — QA Team test script study (2026-10-28)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9805 - eAuto Mobile App - Phase 6 STMS - To update STMS module same as Production Web Portal (as of 29.01.2026).md` (text copy dated "28/10/2026, 9:55:09 am"). Cell text only — formatting, colours, dropdowns and images are **not** available.
2. **Previous study:** this file, earlier 2026-10-28 version (built from the text copy of 28/10/2026, 9:35:17 am, workbook modified 9:34:59 am). The older text copy itself was overwritten, so the comparison below is against the rows this study had recorded.
3. **Ticket folders:** `_reference/tickets/EAINT-9805/` holds only this study. `_reference/tickets/Studying/EAINT-9805/` **does not exist**.
4. **knowledge/:** `knowledge/flow-platform.md` lines 289–321 ("Flow: eAuto mobile app (Android / iOS) parity with web", incl. EAINT-9805 tags on lines 294, 298, 301, 307, 313), lines 14, 48, 82–92; `knowledge/flow-stms.md` lines 33–35, 69–71; `knowledge/flow-estm.md` line 1196; `knowledge/teams-decisions-by-ticket.md` line 422; `knowledge/flow-inventory-control.md` lines 162, 200; `knowledge/business-rules-from-test-scenarios.md` lines 877–881; grep for Dermalog / Iris / mobile app across `knowledge/`.
5. **lib/ticketStudies.ts:** no entry for EAINT-9805.
6. **Not read:** the Jira ticket, the SRD and the original .xlsx (no access in this unattended run).

## 1. Header

1. **Ticket:** EAINT-9805.
2. **Module / portal:** **eAuto Mobile App** (Android / iOS / iPadOS), **STMS** module, per the workbook title.
3. **Workbook:** "EAINT-9805 - eAuto Mobile App - Phase 6 STMS - To update STMS module same as Production Web Portal (as of 29.01.2026).xlsx" — SharePoint library "eAuto - CR Test Scenarios", modified **28/10/2026, 9:37:37 am** (previous study: 28/10/2026, 9:34:59 am; before that 27/10/2026, 5:42:02 pm).
4. **Sheets (2):** "Device & Test Scope" and "Sheet1".
5. **Number of scenarios:** **0 numbered TS rows.** The workbook is a **device and test-scope plan**, not a scenario list. It defines 9 OS/device rows, 4 test levels and 2 scanner checklists (5 steps each).
6. **Result counts:** **none.** No Pass/Fail column exists in either sheet.
7. **Tester:** Device & Test Scope R1 header "Automation device (Hui Xin)" — the automation tester is named. The manual tester column reads "Manual device (??)" — **still not assigned**.
8. **Dates:** none written in the sheet, other than "(as of 29.01.2026)" in the workbook title.

## Changes since last study (2026-10-28)

1. **Two saves on 28/10/2026 so far** — 9:34:59 am and **9:37:37 am**. This update compares the 9:37:37 am save (text copy 9:55:09 am) with the 9:34:59 am save.
2. **Cell text: no change found.** Every recorded row reads the same: Device & Test Scope R1–R10, R12–R14, R16–R17, R19–R22, R24–R27, R29–R30, R32–R36, R38, R40–R44, R46–R50, R52–R54, R57–R59; Sheet1 R2, R4–R14, R16–R22. Same as the 2026-10-27 version too.
3. **New scenarios:** none. **Removed scenarios:** none. **Result changes:** none — there is still no Pass/Fail column.
4. **Still open, unchanged:** manual tester "(??)" (R1); iOS/iPad devices "TBC" (R7–R9); Dermalog on Android 16/17 "the expected result is not confirmed" (R14); Iris step still reads "Capture a thumbprint" (R41).
5. [unconfirmed] Both 28/10/2026 saves changed **formatting, colours, dropdowns or images** only, which the text copy does not keep. It cannot be confirmed from the text copy.
6. **Fixes to this study (not workbook changes):**
   1. Header and Sources read updated to the 9:37:37 am save and the 9:55:09 am text copy.
   2. Added the existing EAINT-9805 lines in `knowledge/flow-platform.md` (294, 298, 301, 307, 313) to Sources read, and line 298 to "Against existing knowledge" (item 6).
   3. All other knowledge/ line references re-checked on 2026-10-28 — still correct (flow-platform.md 48, 82, 89, 320, 321; business-rules-from-test-scenarios.md 878; teams-decisions-by-ticket.md 422).
   4. Kept from the earlier 2026-10-28 update: `_reference/tickets/Studying/EAINT-9805/` **does not exist**; gap 11 (Iris device return date) and gap 2 (web Dermalog message as reference).

## 2. What the ticket changed, as the TS shows it

1. The title states the change: "To update STMS module same as Production Web Portal (as of 29.01.2026)" (workbook name).
2. The TS **does not describe any STMS screen, field or rule**. It only defines which devices and OS versions get which depth of testing.
3. Focus areas the plan names: **biometric scanners** (Iris over Bluetooth, Dermalog over USB), **biometric login** (fingerprint, face), **file upload**, **edge-to-edge display**, **tablet rotation**, and **interruption testing**.
4. [unconfirmed] The workbook appears to be a **reusable device-scope sheet for the mobile app release**, not a ticket-specific script — nothing in it is STMS-specific.

## 3. Scenarios, grouped

### A. Device matrix (sheet "Device & Test Scope", R2–R10)

1. **R2 — Android 13**, ZTE Blade V50: automation "Automation short check"; manual "Manual short check: Iris and Dermalog".
2. **R3 — Android 15**, Samsung Galaxy Tab Active4 Pro 5G (tablet): automation "“Can use” check"; manual "1 Iris transaction, 1 Dermalog transaction, 1 biometric login (fingerprint, and face recognition if offered)".
3. **R4 — Android 15**, Infinix Note 40 Pro (automation) / Samsung Galaxy A54 5G (No. 2) (manual): "Full E2E testing" / "Full manual testing".
4. **R5 — Android 16**, REALME 13+ 5G: "Automation short check + edge-to-edge display check"; manual "Manual short check: Iris and Dermalog (see Dermalog note)".
5. **R6 — Android 17**, "Xiaomi 14T (when Android 17 is available)": "Same as Android 16".
6. **R7 — iOS 18**, device "TBC": "Automation short check"; manual "Manual short check: Iris + 1 biometric login (Face ID or Touch ID, depending on the iPhone)".
7. **R8 — iOS 26**, "colleague's phone (TBC)?": same as iOS 18.
8. **R9 — iOS 27**, "iPhone 17e (TBC)": "Full E2E testing"; manual "Full manual testing, except no Dermalog (not supported on iOS) and no fingerprint login (iPhone only has Face ID)".
9. **R10 — iPadOS ?**, "iPad (A16) - iPad 11": "“Can use” check"; manual "Manual short check: Iris + 1 biometric login (Touch ID)".

### B. Test levels (sheet "Device & Test Scope")

1. **Full E2E testing (automation), R16–R17:** "All E2E flows in all modules, including negative and edge cases."
2. **Full manual testing, R19–R22:** "1. Iris and Dermalog full testing, including negative testing." / "2. Face login and fingerprint login." / "3. Interruption testing (check the TS with Charmain)."
3. **Automation short check, R24–R27:** "1. One E2E happy path for each key module." / "2. File upload." / "3. Edge-to-edge display check (Android 16 and 17 only): check that buttons and text are not hidden under the top status bar or the bottom navigation bar."
4. **"Can use" check (tablet and iPad), R46–R54:** automation "One E2E happy path for each key module", "Check every visited screen in both portrait and landscape", "Rotate the tablet in the middle of a flow and check that the data is still there"; manual "One Iris transaction + one Dermalog transaction (no Dermalog on iPad)", "One biometric login".

### C. Scanner short checks (sheet "Device & Test Scope", under "Manual short check" R29)

1. **Dermalog (USB), R30–R36:** "Connect the scanner and allow the USB permission." → "Capture a thumbprint and complete one transaction." → "Unplug and plug in again, then scan again." → "Lock the phone or leave it idle, then scan again." → "Unplug the scanner and check the message the app shows."
2. **Iris (Bluetooth), R38–R44:** "Pair the scanner and allow the Bluetooth permission." → "Capture a thumbprint and complete one transaction." → "Turn Bluetooth off and on, then scan again." → "Move out of range and come back, then scan again." → "Unpair the scanner and check the message the app shows."
3. **Expected results:** none written for the "check the message" steps — the message text is **not stated**.

### D. Scanner support matrix (sheet "Sheet1", R2–R22, title "eAuto Mobile App Testing")

1. **Android 8–12 (R5–R9):** IRIS "false", DERMALOG "true".
2. **Android 13–15 (R10–R12):** IRIS "true", DERMALOG "true". Android 15 marked "⭐".
3. **Android 16–17 (R13–R14):** IRIS "true", DERMALOG "false".
4. **iOS 14–27 (R16–R22):** IRIS "true", DERMALOG "false". iOS 27 marked "⭐".
5. [unconfirmed] "⭐" marks the two **full-E2E target OS versions** (Android 15 and iOS 27 match the "Full E2E testing" rows R4 and R9).

## 4. Business rules and system behaviour the TS reveals

1. **Dermalog is not supported on iOS:** "no Dermalog (not supported on iOS)" (Device & Test Scope, R9).
2. **Dermalog is not officially supported on Android 16+:** "Dermalog note for Android 16 and 17: Dermalog does not officially support Android 16 and above." (Device & Test Scope, R12).
3. **Dermalog failure on Android 16+ has no confirmed expected result:** "If it fails, the app should show a clear message and must not crash or freeze. Raise it to SA, because the expected result is not confirmed." (Device & Test Scope, R14). A pass is acceptable: "If the Dermalog transaction passes, there is no concern." (R13).
4. **Iris is not supported on Android 8–12** (Sheet1, R5–R9, IRIS "false").
5. **Connection types:** "Dermalog (USB):" (R30) and "Iris (Bluetooth):" (R38).
6. **No Dermalog on iPad:** "(no Dermalog on iPad)" (Device & Test Scope, R53).
7. **Biometric login exists in the app:** "1 biometric login (fingerprint, and face recognition if offered)" (R3); "Face ID or Touch ID, depending on the iPhone" (R7).
8. **Edge-to-edge risk is Android 16/17 only:** "Edge-to-edge display check (Android 16 and 17 only)" (R27).
9. **The app has a file upload function** in scope of the short check: "2. File upload." (R26).
10. **Distribution:** a Play Store account is listed under "Playstore ID" (R57) — the app is installed from the Play Store for testing [unconfirmed: could be internal testing track].

## 5. Test data, environments, accounts, setup

1. **Environment:** **not stated** in the workbook (no staging/UAT URL).
2. **Accounts:** "Playstore ID" (R57) with a Gmail address (R58) — **credentials present** (password on R59). Not copied here.
3. **Devices:** ZTE Blade V50, Samsung Galaxy Tab Active4 Pro 5G, Infinix Note 40 Pro, Samsung Galaxy A54 5G (No. 2), REALME 13+ 5G, Xiaomi 14T, iPhone 17e, iPad (A16) - iPad 11. Several marked "TBC".
4. **Hardware:** Dermalog USB thumbprint scanner; Iris Bluetooth scanner.
5. **No UCD logins, vehicle numbers or MyKad test data** are in the workbook.

## 6. Gaps or risks a regression should still cover

1. **No STMS scenarios at all.** The title promises STMS parity with production web, but no STMS step, field, fee or receipt check is written. Parity must be checked against the web STMS flow (`knowledge/flow-stms.md`; app entry point "UCD mobile app › STMS (/mb/ucd/stms/*)", line 69).
2. **No expected messages** for scanner unplug / unpair / Bluetooth-off steps (R36, R44). The tester has nothing to compare against. [unconfirmed] The web wording may be a starting point: "Please plug in Dermalog Biometric Device and click [Reconnect]" (`knowledge/business-rules-from-test-scenarios.md` line 878, from TS EAINT-7229) — whether the app reuses it is not known.
3. **Dermalog on Android 16/17 is undecided** — "the expected result is not confirmed" (R14). Pending SA answer.
4. **Iris step wording:** "Capture a thumbprint" under Iris (Bluetooth) (R41) [unconfirmed: possibly copied from the Dermalog block; Iris may capture an iris, not a thumb].
5. **iOS 18, iOS 26, iOS 27 and iPadOS devices are "TBC"**; manual tester is "(??)". iOS coverage may not happen.
6. **Interruption testing** is delegated: "check the TS with Charmain" (R22) — that TS is not in this workbook.
7. **"Key module"** is not defined (R25, R48). [unconfirmed] which modules count.
8. **No Pass/Fail column** — results cannot be read from this workbook.
9. **Android 8–12** appear in Sheet1 but have **no device row** in the test scope — Dermalog-only OS versions are untested.
10. **Web-twin changes after 29.01.2026** (e.g. RM25→RM35 tile price EAINT-12550, JPJ Official Receipt EAINT-12551/12559, usage code AH EAINT-12553/12560) are outside this baseline per `knowledge/flow-platform.md` lines 295 and 307.
11. **Iris device availability:** "The Iris test device must be returned by 2026-11-03." (`knowledge/teams-decisions-by-ticket.md` line 422, "[same chat, 2026-10-13 16:55, Mei Jia Chee]"). [unconfirmed] If this is the same unit, every Iris row (R2–R10, R38–R44, R53) must run before 2026-11-03.

### Against existing knowledge

1. `knowledge/flow-platform.md` line 321: "iOS status is not recorded." — this workbook **records a planned iOS scope** (iOS 18, 26, 27; Iris only; Face ID). Still planned, not results.
2. `knowledge/flow-platform.md` line 320: "Which modules the app exposes, and how they differ from web, is not answered yet (Ask eAuto Q24 not received)." — **this workbook does not answer it** either.
3. `knowledge/flow-platform.md` lines 14 and 82 describe Dermalog on **web** via a local WebSocket ("It opens ws://localhost:7878/IDCard", line 82). The app uses **USB** Dermalog and adds a **Bluetooth Iris** scanner — not recorded in knowledge/. No contradiction, a new channel.
4. `knowledge/flow-platform.md` line 48: "The mobile app shares the web database, so password rules reach it. It was not tested separately." — this workbook adds **biometric login** (fingerprint / Face ID / Touch ID) as an app-only login path, not covered there.
5. `knowledge/flow-inventory-control.md` line 162: "Device scope Phase 1: Dermalog only." — Iris is a **stock** item deferred there, but an **in-scope scanner** for the app here. No contradiction, different modules.
6. `knowledge/flow-platform.md` line 298: "App STMS and eSTM follow web rules. In production code the app's own eSTM entry points are commented out." — this workbook **adds no STMS or eSTM rule** to check that against. It also names no eSTM step, which fits the commented-out entry points [unconfirmed].

## Knowledge candidates

1. **Mobile app scanner support:** Dermalog (USB) — Android only, "not supported on iOS", "does not officially support Android 16 and above"; Iris (Bluetooth) — Android 13+ and all iOS listed (14–27). Source: SharePoint TS EAINT-9805, sheet "Device & Test Scope" R9, R12, R30, R38; sheet "Sheet1" R5–R22. Target: `knowledge/flow-platform.md` § mobile app.
2. **Open rule:** Dermalog failure on Android 16/17 — "the app should show a clear message and must not crash or freeze. Raise it to SA, because the expected result is not confirmed." Source: sheet "Device & Test Scope" R14. Target: flow-platform.md "Open questions" (line 319 onward).
3. **Mobile app test-depth plan:** full E2E on Android 15 and iOS 27; short checks elsewhere; tablet/iPad "Can use" check with portrait/landscape and mid-flow rotation. Source: sheet "Device & Test Scope" R2–R10, R46–R54. Target: flow-platform.md "QA scope to check" (line 309).
4. **Edge-to-edge display check** for Android 16/17: "check that buttons and text are not hidden under the top status bar or the bottom navigation bar." Source: sheet "Device & Test Scope" R27.
5. **App has biometric login** (fingerprint / face / Face ID / Touch ID) and **file upload**. Source: sheet "Device & Test Scope" R3, R7, R21, R26. Target: flow-platform.md line 48 area (app login).
6. **iOS planned scope** to replace "iOS status is not recorded." (flow-platform.md line 321): planned, not executed — iOS 18 / 26 short check, iOS 27 full E2E, devices "TBC". Source: sheet "Device & Test Scope" R7–R9.
7. **Play Store test account exists** in the workbook (credentials present, R57–R59) — keep out of knowledge/; point to the workbook only.
