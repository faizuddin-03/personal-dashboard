# EAINT-9805 — related history (2026-10-29)

## Ticket brief

Updated 2026-10-29 after Faizuddin's face-to-face notes (see "Changes 2026-10-29 (f2f notes)"); updated 2026-10-30 after the Ask eAuto answer (see "Changes 2026-10-30 (Ask eAuto)") and the biometric login reply (see "Changes 2026-10-30 (biometric login)").

1. **High-level scope:**
   1. **Biometric first** — every thumbprint point in the app with **Iris (Bluetooth)** and **Dermalog (USB)**: STMS Step 1 / Step 3, eSTM Step 1 / Step 3 and any other page that takes a thumbprint. **Weight, not order:** most coverage on **STMS**, less on **eSTM** (corrected 2026-10-29).
   2. **Iris Bluetooth set** — every case on the UCD side: permission, pair, off / on, out of range, unpair, re-pair, reader switched off [unconfirmed list, Elf to finalise].
   3. **Iris UI on Step 1 / Step 3** — same as or different from the Dermalog screen, and how it shows in the app.
   4. **Documents with the thumbprint** — Perakuan (thumbprint picture), LKM Refund and Insurance Cancellation documents.
   5. **Interruption** (own tab) and **performance** (MyKad read, thumbprint verify, next-step load, as in EAINT-7229).
   6. **Short check per device** (own tab); **edge-to-edge** UI break check incl. fold phones. **Auto-rotate is disabled** for now (rotation = later phase).
   7. **Some E2E** runs only; full STMS E2E is the automation QA's part.
   8. **Expected results from web first** — the app follows web; only app-only cases differ.
   9. **Finger variants (added 2026-10-30)** — different fingers, partial press (half the finger on the reader), poor-quality scan; each accepted or rejected the same way as web.
   10. **Where the thumbprint result shows (added 2026-10-30)** — "MyKad/Thumbprint verified on" date on eSTM details, and the thumbprint image in the eSTM buyer authentication PDF, if the app shows them [unconfirmed which are in the app].
   11. **Biometric login on phones and tablets (added 2026-10-30)** — Face ID / Touch ID (iOS, iPad) and fingerprint / face (Android): turn-on page, saved accounts (max 5), tap-to-login, wrong face / finger, Face ID off / locked / changed, password changed on web, remove account, Account tab switch.
2. **Estimated testing time:** **14 man-days** (Faizuddin's manual part, 1 QA) = base 11 + buffer 3; range **12–17**; confidence **medium** (revised 2026-10-30 from 12: the Elf's scenario list now has **198 TS**, counted). No official figure: Jira "[QA] Est Man-day (cf 10081)" is "—" (Jira capture item 7); no Miro estimate found. [unconfirmed]
3. **Modules / pages to cover:**
   1. **STMS (UCD Mobile App):** Step 1 Seller Authentication, Step 3 Buyer Authentication (thumbprint), Step 5 add-ons, Step 6, Transaction Details — main biometric target.
   2. **eSTM (UCD Mobile App):** Step 1 Buyer (Customer), Step 3 Seller (Dealer) (thumbprint), Perakuan — covered, with less weight than STMS.
   3. **Other thumbprint pages (UCD Mobile App):** UCD to UCD and Interstate Step 1 / Step 3; any other UCD thumbprint screen from the Ask eAuto list (Wholesale, BMK, eInvoice MVD agreement, Insurance add user, Account activation) only if the app has it [unconfirmed which — Phases 3 and 5 were never built].
   4. **Documents (UCD Mobile App):** Perakuan / Slip Pengesahan thumbprint picture, "MyKad/Thumbprint verified on" date (eSTM details), eSTM buyer authentication PDF image, LKM Refund documents, Insurance Cancellation documents, Invoice / e-Invoice / JPJ Official Receipt.
   5. **Login (UCD Mobile App):** Login page, saved-accounts list, "Login with another account" sheet, turn-on page "Log In Faster with Face ID", Face ID / Touch ID / fingerprint prompt, Account tab "Login with Face ID" switch — sub-task 12592 (iOS); Android port [unconfirmed status]. Phones and tablets (Faizuddin, 2026-10-30).
   6. **Device / app shell (UCD Mobile App):** all screens — edge-to-edge, fold phones, auto-rotate off.
   7. **UCD web + BO (web):** same pages on web — source of every expected result; BO JPJ XML Log (STMS) cross-check.
   8. **Not in scope:** AATF (not in the mobile app). AATF shares the same reader panel and server check on web, so a web-side change could touch it — not app scope.
4. **Testing scope** (mode: **Manual**):
   1. **Changes**: STMS (most focus) and eSTM (less focus) on the mobile app aligned with web + Iris Bluetooth reader; manual focus = biometric
   2. **User Type**: Main & Sub UCD (Individual and Company seller); no AATF
   3. **Modules Affected**:
      1. **STMS** - Step 1 / Step 3 thumbprint with Iris and Dermalog
      2. **eSTM** - Step 1 / Step 3 thumbprint with Iris and Dermalog
      3. **Perakuan** - thumbprint picture shown correctly
      4. **LKM Refund / Insurance Cancellation** - documents correct
      5. **Other thumbprint pages** - same reader behaviour
   4. **Reader**:
      1. **Iris (Bluetooth)**: same result as web Dermalog
         1. Permission, pair, off / on, out of range, unpair, re-pair
      2. **Dermalog (USB)**: read and complete one transaction
         1. Android 16 / 17 not supported = clear message, no crash
   5. **Device**:
      1. **Android 15 / iOS 27 (★)**: full manual testing
      2. **Other phones / tablet / iPad**: short check (own tab)
      3. **Edge-to-edge / fold phones**: no UI break on screen change
      4. **Auto-rotate**: disabled, screen stays fixed
   6. **Functional**:
      1. [Scan IC] / [Read MyKad] --> reads MyKad, then thumbprint [unconfirmed app button name]
      2. [Cancel] --> back to category page
   7. **Test Scenarios**:
      1. Biometric (own tab, priority per TS)
         1. Thumb = OK
         2. Wrong thumb = Verification failed
         3. Bluetooth cases = clear message, no crash
         4. Different finger / partial press = same result as web (added 2026-10-30)
      2. Interruption (own tab)
         1. Home / lock / switch app = rescan MyKad & redo thumbprint
         2. No network = "No internet connection"
      3. Performance
         1. MyKad read / thumbprint verify / next step = time of 5 readings & average
      4. Biometric login (own section, added 2026-10-30)
         1. Saved account + matching face / finger = Home
         2. Wrong face / finger or cancel = stays on list, rows kept
         3. Face ID off / locked / changed = dialog shown
         4. Password changed on web = "Saved Login Not Working"
         5. 6th account = no turn-on page

## Changes 2026-10-30 (biometric login)

1. **Faizuddin, dashboard chat 2026-10-30:** "you didnt include the scenarios for login. phones and tablets have another login function which is using biometric (face/fingerprint). those ones need to test too". **Correction:** biometric login is now its own scope line and test section; earlier, after the f2f notes, it was only a module line and one testing-scope line with no scenario set.
2. **Past TS for app login:** only **APP_UCDREG_LOGINFUNC_TS1–TS3** (logo & app version, username, password; EAINT-6014 CSV rows 3–5), all "PASS". **No past TS covers biometric login.** Login messages from Phase 1: "Login Error" and "Session Expired" labels (SRD EAINT-5566 STMS V1.0, Table for Figure 2.2.1.4 / 2.2.1.5) and "Your session has expired Please log in again to continue." (APP_COMPATIBILITY_TS1).
3. **Main source = sub-task EAINT-12592 — "[iOS] Biometric login (Face ID / Touch ID) with saved accounts"** (Jira capture `_reference/tickets/Studying/EAINT-12592/EAINT-12592-jira.md`, fetched 2026-10-30; status "Done"). Key rules, verbatim from its description:
   1. "Dealers can save up to 5 eAuto accounts on their phone and log in to one with Face ID or Touch ID instead of typing the password."
   2. "No backend change. Face ID only unlocks the saved username + password, then today's login runs as if typed (settings.get then login.do)."
   3. "Phones with no saved account see today's login screen, unchanged."
   4. Turn-on page: "Log In Faster with Face ID" with buttons "Turn On Face ID / Maybe Later"; "Asked once per account on this phone".
   5. Dialogs: "Face ID Is Off (Use Password / Go to Settings), Face ID Is Locked, Saved Login Not Working, Face ID Changed."
   6. "Only the server's DENIED (wrong password) removes that one account, with "Saved Login Not Working"."; "A real Face ID / Touch ID change on the phone removes all saved accounts, with "Face ID Changed"."
   7. "A wrong face, cancel, lockout, "Use Password", a keychain or storage glitch, network / server error, maintenance or S00018 to S00026 never remove or hide anything."
   8. Account tab: "Login with Face ID" switch; Turn Off dialog "Turn Off Face ID?" / "You'll need to enter your password to log in to this account."; toasts "Face ID turned off" / "Face ID turned on".
   9. "Touch ID phones get the same screens with Touch ID wording and a fingerprint icon."
4. **Ready-made test list:** the 12592 description section "Test scope" lists about 25 checks (first typed login, Maybe Later, 6th account, cancel / non-matching face, offline tap, Face ID off in Settings, password changed on web, Face ID changed, Edit > Remove, reinstall vs install-over, Touch ID on iPhone SE, Account tab Turn Off / Turn On). Reuse them as the base of the biometric login section.
5. **Dev already tested on a real iPhone:** "Face ID lockout after repeated wrong faces, a different person's face, keyboard over the sheet". **Not yet tested on a real phone:** "passcode turned off, a real Touch ID iPhone, Face ID changed while logged in." Give these higher priority [unconfirmed priority].
6. **Android:** "Android: not started; ports from the specs." (12592, Status 28 Oct). The QA workbook still plans "1 biometric login (fingerprint, and face recognition if offered)" on the Android tablet (Device & Test Scope R3). Android biometric login status: [unconfirmed] — see Questions for the team.
7. **Brief updated:** scope line 8 now holds biometric login, Login module pages expanded, login scenarios added to the testing scope; estimate 10.5 → **12** man-days (range 10–14); brief.json matches.
8. **Elf's answer (2026-10-30):** the section exists as **9805_BL_TS01–TS28**, section "K. Biometric login", workbook tab **Biometric Login TS** (`data/pipeline/work/EAINT-9805/scenarios.md`), built from the 12592 "Test scope" list.
   1. **Covered:** iOS Face ID (turn-on page, saved-row login, the four dialogs, saved-accounts list, Account tab switch, passcode off) on iOS 27; Touch ID **BL_TS20** on iPadOS only; Android fingerprint **BL_TS28** on Android 15 [unconfirmed].
   2. **Gaps the Elf proposed (waiting for Faizuddin's review in the Elf chat):** raise **BL_TS27** (passcode turned off), **BL_TS20** (Touch ID) and **BL_TS26** (Face ID changed while logged in) to **P1**, since 12592 lists them as "Not yet tested on a real phone"; run Touch ID on an iPhone too (workbook R7–R8 "Face ID or Touch ID, depending on the iPhone"); add one Android face-login TS (workbook R3 "face recognition if offered").
   3. **Left out on purpose:** the network-log checks and "No glide" UI checks from 12592.
9. **Estimate re-based on the real scenario count (2026-10-30):** the Elf's list has **198 TS** (`scenarios.json`, counted): BL 28, IN 34, CL 22, TP 17, BT 16, MK 16, FL 14, ST 11, OP 9, IP 8, SC 8, DM 5, DC 4, ES 4, PF 2; priority P1 101 / P2 83 / P3 14. **Correction:** expected TS is now 198, not 95–120; my range was below the drafted list. Estimate raised to **14** man-days (range 12–17).

## Changes 2026-10-30 (Ask eAuto)

Source for every quote in this section: Ask eAuto answer pasted by Faizuddin, dashboard chat 2026-10-30 04:04 (logged in history.md). Ask eAuto says: "This is based on what is live in prod."

1. **One shared reader panel and one shared server check:** "Every thumbprint screen in eAuto uses one shared reader panel and one shared server check, and both are built for the reader you use today."
2. **Server check rules:** "accepts a scan only if the reader software signed the data, the match result is "Identical", the quality score is above zero, the timestamp is recent, and the scan hasn't been used before. A new reader has to produce exactly this, or every scan gets rejected."
   1. **Test meaning:** each rule is a negative case for Iris — wrong finger (match not "Identical"), partial / poor press (quality), slow or stale scan (timestamp), same scan sent twice (reuse) [unconfirmed which can be forced from the phone].
3. **UCD screens that capture a thumbprint** (Ask eAuto table rows, verbatim): "STMS | Seller and buyer perakuan, including UCD-to-UCD and interstate"; "eSTM | New owner and UCD perakuan"; "Wholesale | STMS thumbprint, handover reject-vehicle"; "BMK | Owner and UCD perakuan"; "eInvoice | MVD agreement consent"; "Insurance | Add user / user permission"; "Account | Director activation, company activation".
   1. Matches the EAINT-7229 page list (study §3j) for STMS, UCD to UCD, eSTM, BMK, Pre e-Invoice, Insurance and account activation. **New vs that list:** Wholesale "STMS thumbprint, handover reject-vehicle".
   2. **App relevance:** Phase 6 = STMS (incl. UCD to UCD / Interstate) and eSTM. BMK and Insurance belong to Phases 5 / 3, never built (Changes 2026-10-29 item 2 table). The rest: [unconfirmed whether the app has them].
4. **Where the thumbprint or its result shows:** "The wholesale STMS form shows the thumbprint image."; "Several detail pages show a "MyKad/Thumbprint verified on" date: eSTM, BMK, SSM, eInvoice and wholesale."; "Printed PDFs include the image: eSTM buyer authentication, insurance add-user authorisation and declaration, e-contract signature and customer verification."
   1. For the app: check the eSTM "verified on" date and the eSTM buyer authentication PDF image after an Iris scan [unconfirmed both exist in the app].
5. **AATF shares the pieces (web):** "The AATF screens on the same shared pieces are AATF registration, the AATF dereg owner-consent and COD steps, and AATF user MyKad settings." The app has no AATF (f2f notes), so no app TS; a web regression would need it [unconfirmed whether the Iris change touches web].
6. **App check not confirmed:** "I couldn't confirm whether the mobile app's STMS and eSTM thumbprint steps use the same check, so treat them as possibly affected." Working assumption: [unconfirmed: assumed the app uses the same server check].
7. **Finger variants (Faizuddin, same message):** "also need to include scenarios such as different fingers, partial press fingers (like half of the fingerprint touches the biomtric)". Past TS: only **7229_TP_TS1 / TS2** (correct right / left thumb) and **7229_TP_TS3** (wrong thumb: "Verification failed. Please click on [Scan IC] to try again") cover fingers (study §3c). **No partial-press TS exists in any past TS read.**
8. **Brief updated:** scope items 9–10, modules 3 / 4 / 8, finger line in testing scope; estimate 10 → **10.5** man-days (range 9–12); brief.json matches.

## Changes 2026-10-29 (f2f notes)

Source for every quote in this section: Faizuddin's face-to-face meeting notes, dashboard chat 2026-10-29 09:15 (logged in history.md).

1. **Scope moves to biometric:** "Hui Xin bypass, so need to focus on the biometric side. So focus mainly on biometric, but can sometimes create end to end". Focus: "Focus on STMS > eSTM" — weight, not order (see item 12). Also: "Also need to check any part of the systems that is related to the thumbprint".
2. **Out of scope:** "Mobile app does not have AATF". The EAINT-7229 "AATF" sheet (study §3j) is dropped for the app.
3. **Documents added:** "perakuan [check the thumbprint picture]" and "check other documents like, LKM refund also/insurance cancellation".
4. **Rotation dropped for now:** "tablet and phone will disable autorotate screen (for now - the screen roate will be a later phase)". This replaces the workbook rule "Rotate the tablet in the middle of a flow and check that the data is still there" (EAINT-9805 workbook, Device & Test Scope R50).
5. **Edge-to-edge widened:** "edge to edge display - got any ui break when change screen (like fold phones)". The workbook limited it to "(Android 16 and 17 only)" (R27).
6. **Workbook tabs:** "for short check, also need seperate tab in the workbook"; "put interruption testing as one seperate tab in the excel"; "biometric also one seperate tab".
7. **Expected-result rule:** "for expected results, always check with the web first. because for all behaviours, the mobile will always follow web. only the special cases where the mobile app have, but web doesnt have".
8. **Focus from past TS** ("what need to focus on - 6014/7229"): "Put priority for every scenario"; "Take note of interruption testing"; "UI for IRIS in step 1 and 3 (need to check and confirm if UI same or different, and how it would show in the app)"; "Performance testing (can check the excel file)"; "For IRIS, need to include scenario for bluetooths (think of all the possible scenarios that may happen from the UCD side)".
9. **Setup:** "dont forget to install mykad simulator".
10. **What this maps to in past TS** (for the Elf):
    1. **Priority** ← EAINT-7229 gives every TS a P1 / P2 / P3 (study §3a–§3g); EAINT-6014 uses "P1 - must test / P2 - should test but can be tested in later phase / P3 - good to test" (PROGRESS TRACKING, `EAINT-9805-mobile-app-sources-2026-10-28.md` §2).
    2. **Performance** ← **7229_PF_TS1–TS4** — device load, MyKad read, thumbprint verify, next-step load; method "Time taken for 5 readings & average" (study §3h).
    3. **All thumbprint pages** ← EAINT-7229 page list, sheet "UCD" (study §3j): STMS, UCD To UCD (Standard, Interstate), eSTM, eSerahan Permission, BMK, Insurance permission, Pre e-Invoice, Settings Manage Users, First Time Login New UCD. Which of these exist in the app: [unconfirmed].
    4. **Interruption tab** ← EAINT-6014 "Functional & Interruption Test" (30 eSTM interruption TS) and **STMSAPP_COMPATIBILITY_TS2 / TS3** (thumbprint steps).
    5. **Iris UI on Step 1 / Step 3** ← Phase 1 app SRD buttons "Read MyKad" / "Verify" (Known traps item 14) vs web [Scan IC] (EAINT-7229).
11. **Brief updated:** scope, estimate (8 → **10** man-days), modules and testing scope rewritten; `data/pipeline/work/EAINT-9805/brief.json` updated to match.
12. **Correction (2026-10-29, later):** STMS > eSTM is **how much to focus**, not a test order: more scenarios on STMS, fewer on eSTM. Faizuddin, dashboard chat 2026-10-29: "its not actually order. its the things that we need to focus on. means focus more on STMS, and then eSTM". The earlier wording read it as a run order.

## Changes 2026-10-29 (Faizuddin asked: all previous phases + the lead's three items checked?)

1. **Lead's three items:**
   1. **eAuto App High-Level Test Scope** = the EAINT-9805 official workbook (same "sourcedoc=%7B99f03c9f-d2fc-4dfe-90ad-120a74328866%7D" as `_reference/tickets/EAINT-9805/EAINT-9805-mobile-app-sources-2026-10-28.md` §1). **Checked** (all cells, Header item 3).
   2. **Interruption Testing, Phase 2 Google Sheet** — **partly checked.** Saved: tab "Functional & Interruption Test" (full CSV) and key cells of "P2 - Compatibility Test" and "PROGRESS TRACKING". **Not saved:** "0UCD - STMS", "0[SnF] UCD - STMS", "P2 - STMS + SSM", "P2 [SnF] - STMS", "P2 - Functional Test", "P2 - Production Regression", "0UCD - LOGIN & HOMEPAGE", "P2 - LOGIN & HOMEPAGE" (tab list, same file §2). The sheet cannot be opened from the pipeline (Google login; direct download blocked). Which tab gid 1676292785 is: [unconfirmed — likely "Functional & Interruption Test"].
   3. **EAINT-7229 WebSocket Dermalog TS** — **checked** (Related past tickets item 2).
2. **Previous phases (epic EAINT-7554), checked today via Jira:**

| # | Phase | Status (Jira, 2026-10-29) | QA field (cf 10041) | QA Team TS workbook | Used here |
|---|---|---|---|---|---|
| 1 | EAINT-5566 — Phase 1 (STMS + eSTM app) | "Ready for Prod Deployment" | 5 QAs named | **none** in the QA Team library (fetch ts: "No workbook matches") — TS lived in the Phase 2 Google Sheet "0…" tabs [unconfirmed] | **added** — STMS SRD V1.0 read (item 10 below) |
| 2 | EAINT-6014 — Phase 2 (eLKM, SSM) | "Ready for Prod Deployment" | — | none in library; Google Sheet only | yes (item 1) |
| 3 | EAINT-6015 — Phase 3 (Insurance into eSTM, JomCheck) | "REQ GATHERING & ANALYSIS IN PROGRESS" | "—" | none | no — not STMS, never tested |
| 4 | EAINT-7109 — Phase 4 (UCD to UCD) | "REQ GATHERING & ANALYSIS IN PROGRESS" | "—" | none | no — SRD V0.1 is an empty template (no requirement rows) |
| 5 | EAINT-6016 — Phase 5 (Transfer History, BMK, Insurance) | "To Do" | "—" | none | no — no SRD, only one image attached |

   1. **Result:** only Phases 1 and 2 were ever tested. UCD to UCD (Phase 4) and Transfer History (Phase 5) have **no past app TS**; Phase 6 is their first app test (SRD §1.5 / §2.2.1). Past web TS (EAINT-11057, 12403, 9058) are the only references for them.
   2. All five phases: "[QA] Est Man-day (cf 10081)" = "—" (each `<KEY>-jira.md` item 7, fetched 2026-10-29).
3. **Brief:** scope, estimate and modules unchanged; brief.json not edited.

## Header

1. **Module / portal:** **STMS** on the **UCD Mobile App** (native Android / iOS), SRD v0.1 §2.2.1. Faizuddin's part: **manual** Iris TS + manual testing (history.md, Standing decisions 1–2).
2. **Past tickets kept:** **10** (7 SharePoint workbooks, 1 Google Sheet capture, 1 other QA's ledger, 1 Phase 1 SRD — added 2026-10-29). **Dropped:** 8 name-only matches (see item 4).
3. **Own official TS:** "EAINT-9805 - eAuto Mobile App - Phase 6 STMS - To update STMS module same as Production Web Portal (as of 29.01.2026).xlsx" (QA Team library "eAuto - CR Test Scenarios"). It is a **device and test-scope plan** with 0 numbered TS (`_reference/tickets/EAINT-9805/EAINT-9805-qa-team-ts-study.md` §1 item 5). Not studied here.
4. **Dropped candidates (name match only):**
   1. **EAINT-3210 — BO STMS CSV columns:** BO export only, no app page.
   2. **EAINT-8683 / 8688, EAINT-9842, EAINT-8826, EAINT-8766 — BO SSM permission, SSM audit log, Reset Payment, cancel / edit permissions:** BO settings, not an app flow.
   3. **EAINT-9605 — STMS new usage code & body type:** web fee check at RM15; prices superseded by EAINT-12403.
   4. **EAINT-9642 — JPJ Official Receipt number:** BO JPJ Reports column "NO. RESIT JPJ" only.
   5. **EAINT-9894 — Chrome-for-Dermalog popup (web):** browser-only; "As of 14.09.2026, this ticket is no longer relevant." (`EAINT-9894-qa-team-ts-study.md` §1 item 8, quoting another QA's ledger).

## Related past tickets

1. **EAINT-6014 — eAuto Mobile App Phase 2 (eLKM into eSTM, SSM into STMS / eSTM).** Google Sheet "EAINT-6014: eAuto Mobile App (Phase 2) - Test Scenarios"; tab capture `_reference/tickets/EAINT-9805/EAINT-6014-app-phase2-TS--Functional-and-Interruption-Test.csv`; notes in `_reference/tickets/EAINT-9805/EAINT-9805-mobile-app-sources-2026-10-28.md` §2. **Why:** same app, same STMS steps 1–6, same thumbprint steps; the last executed app STMS TS.
2. **EAINT-7229 — WebSocket Dermalog reader (replaces Java applet).** Workbook "EAINT-7229 - [eAuto] To update frontend to Chrome (including replacing applet with web socket).xlsx"; study `_reference/tickets/EAINT-7229/EAINT-7229-qa-team-ts-study.md`. **Why:** the lead's model for the Iris TS ("based on the WebSocket Dermalog test scenarios", history.md Standing decision 1); host flow was STMS.
3. **EAINT-9058 & 9059 — eAuto App New Invoice.** Workbook "EAINT-9058 & 9059 - eAuto App New Invoice.xlsx"; study `_reference/tickets/EAINT-9058/EAINT-9058-qa-team-ts-study.md`. **Why:** app-side Invoice / e-Invoice on STMS + TH and UCD to UCD details pages — the "e-invoice" area of SRD §2.2.1.
4. **EAINT-11057 — STMS usage code AH on Step 4, Step 6 & Transaction Details (web).** Workbook "EAINT-11057-🔴[eAuto-UCD] STMS - Display Usage Code AH on Step 4 & Transaction Details Page.xlsx"; study `_reference/tickets/EAINT-11057/EAINT-11057-qa-team-ts-study.md`. **Why:** web twin of sub-task 12553 (usage code AH on the app).
5. **EAINT-12403 — STMS & APT service charge RM20 → RM25, tiles RM35 (web).** Workbook "EAINT-12403 - [eAuto-UCD] STMS & APT Increase eAuto Service Charge for Car & Commercial Car (Effective 02.10.2026).xlsx"; study `_reference/tickets/EAINT-12403/EAINT-12403-qa-team-ts-study.md`. **Why:** web twin of sub-task 12550 (tile RM35) and current STMS fee the app must show.
6. **EAINT-9044 — Transaction Restriction setting (web + BO).** Workbook "EAINT-9044 - To add Transaction Restriction setting in Manage Company Accounts page.xlsx"; study `_reference/tickets/EAINT-9044/EAINT-9044-qa-team-ts-study.md`. **Why:** web twin of sub-task 12552 (S00044 Transaction Restriction Notice popup); STMS and UCD to UCD entry points. [unconfirmed: S00044 is this popup's code — linked only through `knowledge/flow-platform.md` line 295]
7. **EAINT-8802 — Bypass Purchase SSM (STMS & eSTM).** Workbook "EAINT-8802 - [eAuto-SSM] To Bypass Purchase SSM (STMS & eSTM).xlsx"; study `_reference/tickets/EAINT-8802/EAINT-8802-qa-team-ts-study.md`. **Why:** changes STMS Company Step 2–6; live 2026-01-14, so inside the 29.01.2026 web baseline.
8. **EAINT-9247 — SSM Integration for LLP.** Workbook "EAINT-9247 - [eAuto] SSM Integration For LLP.xlsx"; study `_reference/tickets/EAINT-9247/EAINT-9247-qa-team-ts-study.md`. **Why:** web twin of sub-task 12668 "[Android] LLP Business Type"; has STMS E2E and functional sheets.
9. **EAINT-104 — STMS LKM Refund (other QA's coverage).** Ledger `_reference/codebases/eauto-qa-charmain/test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md` (read only). **Why:** web twin of sub-tasks 12567 / 12591 / 12683 (STMS LKM Refund on the app).
10. **EAINT-5566 — eAuto Mobile App Phase 1 (STMS on the app), added 2026-10-29.** No TS workbook in the QA Team library; SRD `_reference/tickets/Studying/EAINT-5566/SRD_EAINT-5566_STMS_Mobile Application_V1.0_20250122-text.md`. **Why:** the first app STMS build — Steps 1–6, listing, Dermalog prompt; Phase 6 aligns it with current web.

## What was tested before

1. **EAINT-6014 (app Phase 2), tab "Functional & Interruption Test":**
   1. **101 TS ids, all "PASS"** — 3 login, 34 STMS functional, 35 eSTM functional, 30 eSTM interruption (counted from the CSV). First row tested "01/17/2025" by a QA engineer (CSV row 3).
   2. **APP_STMSUCDREG_FUNC_TS2** — Step 1 "Biometric Verification": "Successful Verification - Show "Verification Passed" Unsuccessful Verification - MyKad not inserted - Invalid MyKad - Invalid Fingerprint" (CSV row 8; line breaks removed).
   3. **APP_STMSUCDREG_FUNC_TS7 / TS8** — Step 2 Company uploads: "File size & format: - 5 MB - PDF only" (row 13) and "- 5 MB - PDF / JPEG / PNG" (row 14).
   4. **APP_STMSUCDREG_FUNC_TS20** — Step 3 "Biometric Verification", same expected as TS2 (row 26).
   5. **APP_STMSUCDREG_FUNC_TS29 / TS32** — Step 5 "View Transaction Details" popup "Selectable tabs - Seller Details - Dealer Details" (row 35); "Payment History, Show All" (row 38).
   6. **APP_STMSUCDREG_FUNC_TS33 / TS34** — Step 6 progress bar on "STMS Submission Failed" and "Trx Approved" (rows 39–40).
   7. **STMSAPP_COMPATIBILITY_TS2 / TS3** (tab "P2 - Compatibility Test") — thumbprint steps: "Navigate with Home button & reopen app - Remain on the same page - Auto refresh the page, need to rescan MyKad & redo thumbprint" (`EAINT-9805-mobile-app-sources-2026-10-28.md` §2).
   8. **APP_COMPATIBILITY_TS1** — idle 1 hour: "Ensure show message above "Username" field: "Your session has expired Please log in again to continue."" (same file §2).
2. **EAINT-7229 (web Dermalog WebSocket), 85 TS ids, final round "Pass" 40 / "N/A" 50** (study §1 item 9):
   1. **7229_DD_TS1–TS13** — device unplug / reconnect before, during, after read and thumbprint (sheet "Dermalog TS", R10–R22). All PASS.
   2. **7229_MK_TS1–TS8** — valid, no card, invalid, non-MyKad card (sheet "MyKad TS", R10–R17).
   3. **7229_TP_TS1–TS9** — right / left / wrong thumb, card removed, refresh (sheet "Thumbprint TS", R10–R18).
   4. **7229_FUNC_TS1–TS5** — [Cancel] at each point: "Redirect to Create STMS Transaction category page" (sheet "Functional TS", R10–R14).
   5. **7229_C&S_TS1–TS3, TS5, TS6** — network lost: "No internet connection. Please try again when you have a stable connection." (sheet "Connectivity & Security TS", R10–R15).
   6. **7229_C&S_TS19** — MyKad details correct on "UCD Step Page", "UCD & BO Transaction Listing Page", "UCD & BO Transaction Details Page", "BO JPJ XML Log" (R30).
3. **EAINT-9058 & 9059 (app Invoice), 58 counted + 13 Buyer TS, all "Not Started"** (study §1 items 5–6):
   1. **8550_NEW_EI_TS1** — STMS + TH Individual, valid TIN: "[Invoice] & [e-Invoice] buttons are visible on details page" (sheet "New Transactions (e-Invoice)", R3).
   2. **8550_INV/MIS_TS1** — STMS + TH, invalid TIN flip; notation shown / hidden (sheet "Invalid or Blank TIN", R3–R6).
   3. **8550_NEW_EI_TS5 / 8550_INV/MIS_TS5** — UCD to UCD Interstate: "(Create in WEB check in APP)" (New Transactions R7; Invalid or Blank TIN R19).
4. **EAINT-11057 (web usage code AH), 26 ids, 52 Pass / 0 Fail / 6 blank** (study §1 item 7):
   1. **11057_STMS_TS1–TS3** — Step 4 AH on success, on failed enquiry, hidden when no AH (sheet "STMS", R5–R7).
   2. **11057_STMS_TS4–TS6** — 2nd JPJ enquiry; Step 6 and Transaction Details (R8–R16).
   3. **11057_UCD_TS8–TS10** — Interstate Step 2 AH (sheet "UCD to UCD", R20–R22).
5. **EAINT-12403 (web fee change), 45 ids, 38 PASS / 7 Deprioritised** (study §1 items 5–6):
   1. **12403_STMS_E2E1** — Step 5 "JPJ Fee = RM10.00 • eAuto Fee = RM25.00 • Service Tax 8% = RM2.00 • Total Amount Payable = RM37.00" (R16).
   2. **12403_STMS_DSP1** — home tile "From RM35"; module page "Price from RM35* for each STMS Transfer" (R30).
   3. **12403_UTU_DSP1** — "RM35* only for each UCD to UCD Transfer" (R40).
6. **EAINT-9044 (web Transaction Restriction), 118 TS, 116 PASS / 2 N/A** (study §1 items 5–6):
   1. **9044_STMS_TS1** — CREATE NEW TRANSACTION → "You are currently restricted from performing transactions. ⏎ Please contact eAuto at 03-27798899." (sheet "E2E Scenarios - STMS", R2).
   2. **9044_STMS_TS14–TS18** — Next through steps and Step 5 payment → normal flow (R15–R19).
   3. **9044_UTU_TS1–TS4** — UCD to UCD Standard / Interstate entry → popup (sheet "E2E Scenarios - UCD to UCD", R2–R5).
7. **EAINT-8802 (web SSM bypass), 218 TS, 174 Pass / 44 N/A** (study §1 item 7):
   1. **E2E R6** — "User can proceed to Step 6 without purchasing SSM" and "SSM related items should NOT appear in any step".
8. **EAINT-9247 (web LLP), 420 rows, 385 PASS / 2 FAILED / 33 N/A** (study §1 item 5):
   1. Sheets **"E2E Scenarios - STMS"** (59 rows) and **"Func. TS (STMS; Flow)"** (69 rows) cover STMS Step 2 / 4 / 5 for LLP sellers.
9. **EAINT-104 (other QA's LKM Refund ledger):** "143 `LKM-nn` scenarios over 25 blocks, 102 Pass and 41 N/A" (ledger header), split into `UCD-STMS-LKM-REFUND` and `BO-LKM-REFUND`.

## Reusable scenarios

1. **Iris negative set (Faizuddin's tab)** ← **7229_DD_TS1–TS13** (device loss / reconnect): map "unplug" to Bluetooth off / out of range / unpair. Already done in the suggestion workbook (history.md Standing decision 5).
2. **Iris MyKad + thumbprint set** ← **7229_MK_TS1–TS8**, **7229_TP_TS1–TS9**: same expected messages as a starting point only [unconfirmed which texts the app reuses].
3. **[Cancel] at each point** ← **7229_FUNC_TS1–TS5**.
4. **Network loss on thumbprint step** ← **7229_C&S_TS1–TS6** and **STMSAPP_COMPATIBILITY_TS2 / TS3** item 3 ("Will show toast message, "No internet connection"").
5. **Interruption on Step 1 / Step 3** ← **STMSAPP_COMPATIBILITY_TS2 / TS3** (Home, Overview, lock, kill).
6. **Session idle 1 hour** ← **APP_COMPATIBILITY_TS1**.
7. **Company uploads 5MB / format** ← **APP_STMSUCDREG_FUNC_TS7 / TS8** and STMSAPP_COMPATIBILITY_TS1 item 3 ("upload file larger than 5MB").
8. **Web cross-check of MyKad data** ← **7229_C&S_TS19** (UCD + BO listing / details, BO JPJ XML Log).
9. **Documents on app details page** ← **8550_NEW_EI_TS1** (STMS + TH Invoice + e-Invoice) and **8550_NEW_EI_TS5** (UCD to UCD, create on web, check on app).
10. **Usage code AH on app** ← **11057_STMS_TS1–TS3** (Step 4) and **11057_UCD_TS8–TS10** (Interstate Step 2) — for sub-task 12553 (another QA's automation scope).
11. **Tile price RM35** ← **12403_STMS_DSP1**, **12403_UTU_DSP1** — for sub-task 12550.
12. **Transaction Restriction popup** ← **9044_STMS_TS1–TS2**, **9044_UTU_TS1–TS4** (block), **9044_STMS_TS14–TS18** (no block mid-flow) — for sub-task 12552.

## Known traps

1. **Dermalog licence:** testers without it marked rows N/A — "*without runtime license" (EAINT-6014 "P2 - Compatibility Test"; `EAINT-9805-mobile-app-sources-2026-10-28.md` §2).
2. **Thumbprint step resets on interruption:** "Remain on the same page - Auto refresh the page, need to rescan MyKad & redo thumbprint" (same, STMSAPP_COMPATIBILITY_TS2 / TS3). Expect a rescan, not a bug.
3. **Back on login / home kills the app:** "Back in login page / homepage will kill the app" (`knowledge/flow-mobile-app.md` §5 item 1, from EAINT-6014 R78).
4. **UAT app points at one staging instance:** "The UAT App is linked to the staging environment, please use staging/sit1 on the web for testing." (EAINT-6014 PROGRESS TRACKING). Phase 6 instance not stated.
5. **Bug reports need the build:** "raise them under respective APP version and build number in EAINT-6014" (same).
6. **Reconnect after a read needs a refresh (web):** "Only after refreshing page then will allow to restart reading MyKad" (EAINT-7229 "Dermalog TS", R18). Check the app equivalent.
7. **No thumbprint timeout (web):** "Tested for over 10 minutes, Web Socket didn't hit any timeout. No timeout for thumbprint." (EAINT-7229 "Connectivity & Security TS", R16).
8. **Usage code AH blocks payment at the 1st enquiry:** "Need to perform Step 4 JPJ Enquiry with != AH, otherwise will redirect to error page when navigate to Step 5 (Existing behavior for Usage Code not supported by eAuto)" (EAINT-11057 sheet "STMS", R8, R11).
9. **Tile price base differs app vs web:** app sub-task 12550 "Update home page STMS and UCD to UCD tile price from RM25 to RM35" (Jira capture item 9) vs web "Tiles (excl. 8%): STMS From RM30 -> RM35, UCD TO UCD RM30 -> RM35" (EAINT-12403 R3–R6). The app was one price step behind web [unconfirmed]; both end at RM35.
10. **UCD to UCD on the app was check-only:** "(Create in WEB check in APP)" (EAINT-9058 New Transactions R7). Whether Phase 6 creates UCD to UCD on the app is in SRD §1.5 Figma only [unconfirmed].
11. **Restriction popup has a UI bug history:** "Pop up is displayed but UI issue is till found" (EAINT-9044 STMS R2 remark).
12. **LKM Refund offered only to some sellers:** "the build on the QA instance offers the refund only to an individual seller of a dealer registered in Kuala Lumpur or Selangor. A company seller is not offered the refund at all in this release" (EAINT-104 ledger, "What this module covers").
13. **e-Invoice depends on JPJ success:** "TH JPJ = Failed" gives "[Invoice] button visible" only (EAINT-9058 study §4 item 6, New Transactions R9).
14. **App reader prompt and buttons differ from web (Phase 1 SRD, added 2026-10-29):** app message "Please plugin the dermalog to continue fingerprint verification" under title "Fingerprint Verification" (SRD EAINT-5566 STMS V1.0, Table 2.5.2.1 row 1); Step 1 buttons "Read MyKad" and "Verify" (Table 2.5.3.1 rows 5–6), not web [Scan IC] / [Reconnect] (EAINT-7229). Whether Phase 6 renames them for Iris: [unconfirmed].
15. **App [Cancel] wording (Phase 1 SRD):** "Popup Message Content: ⏎ Sure to cancel?"; "Yes" goes to "STMS Create Transaction (Category) page" (Table 2.5.3.1 row 4).
16. **LKM Refund documents carry an e-signature, not a thumbprint (added 2026-10-29):** "e-Signature replaces the thumbprint (EAINT-10093, S34.2-20261001)." (`knowledge/flow-stms-addons.md` line 94). When checking "documents like, LKM refund" (f2f notes), expect a signature on the 3 documents, not a thumbprint picture [unconfirmed for the app].
17. **Perakuan hides the thumbprint until ticked (web):** "The thumbprint part stays hidden until the Perakuan is ticked." (`knowledge/flow-stms.md` line 32). Check the same order with Iris on the app.
18. **MyKad simulator on web needs Chrome flags:** "Chrome 138+ blocks an HTTPS page from opening `ws://localhost`." (`knowledge/charmain-qa-repo.md` line 140). For the web expected-result checks [unconfirmed whether the f2f "mykad simulator" is this emulator].

19. **Old reader plug-in still inside web STMS / eSTM (added 2026-10-30):** "STMS and eSTM still contain an old reader plug-in as a fallback, tied to the old reader's driver." (Ask eAuto, 2026-10-30). On web, a failed Iris path might fall back to it [unconfirmed].
20. **Reader emulator copies today's reader (added 2026-10-30):** "Dev testing uses a reader emulator that copies today's reader, so it would need to match the new one." (Ask eAuto, 2026-10-30). An emulator pass does not prove Iris works; use the real Iris unit.
21. **Every scan rejected if the new reader's data differs (added 2026-10-30):** "A new reader has to produce exactly this, or every scan gets rejected." (Ask eAuto, 2026-10-30). Run one good Iris scan end to end first, before any negative case.

22. **Biometric login testable on the iOS simulator (added 2026-10-30):** "QA can test most of it on the simulator. Setup per simulator: Simulator menu > Device > Face ID > Enrolled." (EAINT-12592 description, "Test scope"). Newer Xcode menu: "Device > Face ID > tick Enrolled" (12592 comment, 2026-10-23). Use an iPhone SE simulator for Touch ID.
23. **Old "Maybe Later" blocks the turn-on page (added 2026-10-30):** "anyone who tapped Maybe Later on an older build will not see the turn-on page again for that account" (12592, "Before testing"). Reinstall the app before testing.
24. **Staging login ends the current session (added 2026-10-30):** "On staging (28 Oct) every login.do while signed in ends the current session, even with a wrong password" (12592, Requirement). Do not log in to the same account on web and app at once during a test.

## Past QA-Issues mentioned

1. **EAINT-7229 (web Dermalog):** EAINT-8854 (wrong-thumb message), EAINT-8855 (retry after wrong thumb), EAINT-8856 ("Unable to read photo" cases), EAINT-8857 (unplug before read), EAINT-8859 (swap MyKad during read), EAINT-8871 (network-loss UI), EAINT-8874 (retry after read timeout), EAINT-8875 (second-tab session) — from the study §3a–§3g.
2. **EAINT-9044 (Transaction Restriction):** EAINT-10219 (popup UI issue), EAINT-10272 (permission rows) — study §1 item 10.
3. **EAINT-6014, 9058, 11057, 12403, 8802, 9247:** no QA-Issue key written in the captured sheets / studies.

## Estimated testing effort

1. **Comparable tickets:**

| # | Ticket | TS count | [QA] Est Man-day (cf 10081) |
|---|---|---|---|
| 1 | EAINT-6014 — app Phase 2 | 101 (Functional & Interruption tab only) | "—" `[EAINT-6014-jira.md item 7, fetched 2026-10-29]` |
| 2 | EAINT-7229 — web Dermalog WebSocket | 85 | "—" `[EAINT-7229-jira.md item 7, fetched 2026-10-29]` |
| 3 | EAINT-9058 — app Invoice | 58 + 13 | "—" `[EAINT-9058-jira.md item 7, fetched 2026-10-29]` |
| 4 | EAINT-11057 — usage code AH | 26 | "—" `[EAINT-11057-jira.md item 7, fetched 2026-10-29]` |
| 5 | EAINT-12403 — STMS fee RM25 | 45 | "3" `[EAINT-12403-jira.md item 7, captured 2026-10-27]` |
| 6 | EAINT-9044 — Transaction Restriction | 118 | "—" `[EAINT-9044-jira.md item 7, fetched 2026-10-29]` |
| 7 | EAINT-104 — STMS LKM Refund | 143 | "16" `[EAINT-104-jira.md item 7, fetched 2026-10-29]` |

   1. EAINT-9805 itself: "[QA] Est Man-day (cf 10081):** —" (Jira capture item 7). The Scout study quotes no Miro estimate.
   2. Pace reference: "*Each QA/BQAs need to complete at least 16 TS per day" (EAINT-6014 PROGRESS TRACKING).
2. **TS count for EAINT-9805 (Faizuddin's manual part):** **198 TS**, counted in the Elf's `scenarios.json` on 2026-10-30 (P1 101 / P2 83 / P3 14). Earlier forecasts: 95–120 (2026-10-30, with biometric login), 80–100, 70–90, 40–55 — all below the drafted list. Larger than 7229 (85) because it adds biometric login (28), interruption (34) and Bluetooth / connection-loss sets (38).
3. **Estimate in man-days:** **14** (range 12–17), 1 QA. Revised 2026-10-30 from 12 to fit 198 TS. Earlier: 12, 10.5, 10, 8.
   1. **TS review and finalise:** 1 — the Elf has drafted all 198; Faizuddin reviews, checks expected results on web, settles open priorities.
   2. **Test execution:** 10 — ≈20 TS per day (most are one short check each; pace reference "16 TS per day" from EAINT-6014 is for full functional rows) [unconfirmed pace]. P1 (101) first on Android 15 and iOS 27, then P2, then P3; short checks on other devices.
   3. **Retest / QA-Issue buffer:** 3 — unknown Iris messages and UI, new app builds per fix, Android biometric login not built yet, Iris unit due back 2026-11-03 [unconfirmed same unit].
   4. **Automation build:** 0 — manual only (history.md Standing decision 2); STMS E2E automation is another QA's.
4. **Confidence: medium** (was low). TS count is now real. Still open: iOS devices "TBC", Iris messages, Android biometric login build, Phase 6 staging instance. [unconfirmed] The official figure lives in the QA Portal, which agents do not open.

## Sources read

1. `data/pipeline/work/EAINT-9805/history.md`.
2. `_reference/tickets/Studying/EAINT-9805/EAINT-9805-study.md`, `EAINT-9805-jira.md`.
3. `_reference/tickets/EAINT-9805/EAINT-9805-qa-team-ts-study.md`, `EAINT-9805-mobile-app-sources-2026-10-28.md`, `EAINT-6014-app-phase2-TS--Functional-and-Interruption-Test.csv` (parsed in full).
4. Studies: `_reference/tickets/EAINT-7229/`, `EAINT-9058/`, `EAINT-11057/` (full); `EAINT-12403/`, `EAINT-9044/`, `EAINT-9605/`, `EAINT-9642/`, `EAINT-9894/`, `EAINT-8802/`, `EAINT-9247/` (header + scenarios) — each `<KEY>-qa-team-ts-study.md`.
5. `_reference/sharepoint/qa-team-ts/INDEX.md` and folder listing (name search: STMS, Transfer History, e-Invoice, Official Receipt, LLP, restriction, Dermalog, app).
6. `_reference/codebases/eauto-qa-charmain/test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md` (header, "What this module covers").
7. `knowledge/flow-mobile-app.md` (full); grep of `knowledge/script-inventory-team.md`, `flow-stms.md`, `flow-platform.md`, `flow-payments-fees.md`, `flow-ucd-to-ucd.md`, `cr-test-scenario-catalogue.md`; `data/pipeline/knowledge-review.json`, `data/pipeline/answers.json` (no EAINT-9805 entries).
8. Jira (toolbox, 2026-10-29): EAINT-6014, 7229, 9058, 11057, 9044, 8802, 9247, 104 — field "[QA] Est Man-day (cf 10081)".
9. **Added 2026-10-29:** Jira EAINT-5566, 6015, 7109, 6016, 7554 (toolbox); SRD text copies `_reference/tickets/Studying/EAINT-5566/SRD_EAINT-5566_STMS_Mobile Application_V1.0_20250122-text.md` and `_reference/tickets/Studying/EAINT-7109/SRD_EAINT-7109_…_V0.1_18042025-text.md`; fetch ts for EAINT-5566 / 6014 / 6015 / 7109 / 6016 (no workbook found).
10. **Not read:** original .xlsx files; Figma links; the Iris suggestion workbook in OneDrive; the Phase 2 Google Sheet STMS tabs (see Changes 2026-10-29 item 1.2); the Phase 1 eSTM SRD.

## Knowledge candidates

1. **EAINT-6014 Phase 2 app TS size:** tab "Functional & Interruption Test" holds 101 TS ids, all "PASS" — 3 login, 34 STMS functional, 35 eSTM functional, 30 eSTM interruption; no STMS interruption ids in that tab (STMS interruption lives in "P2 - Compatibility Test"). Source: `_reference/tickets/EAINT-9805/EAINT-6014-app-phase2-TS--Functional-and-Interruption-Test.csv`. Target: `knowledge/flow-mobile-app.md` §5.
2. **App STMS Company upload formats:** SSM Company / Business Profile "5 MB - PDF only"; Board Resolution, Authorisation Letter, Staff Employment Pass & MyKad "5 MB - PDF / JPEG / PNG". Source: same CSV rows 13–14 (APP_STMSUCDREG_FUNC_TS7 / TS8). Target: `flow-mobile-app.md`.
3. **Man-day comparable:** EAINT-104 STMS LKM Refund "[QA] Est Man-day (cf 10081)" = "16". Source: `_reference/tickets/Studying/EAINT-104/EAINT-104-jira.md` item 7, 2026-10-29. Target: `knowledge/cr-test-scenario-catalogue.md` man-day line.
4. **EAINT-7229 Jira summary differs from the TS title:** Jira "⚫🟡[eAuto] To implement web socket to replace Java applet" vs workbook "To update frontend to Chrome (including replacing applet with web socket)". Source: `EAINT-7229-jira.md` item 1. Target: `cr-test-scenario-catalogue.md` row for 7229.
5. **Earlier app phases never tested past Phase 2 (added 2026-10-29):** Phase 3 EAINT-6015 and Phase 4 EAINT-7109 "REQ GATHERING & ANALYSIS IN PROGRESS", Phase 5 EAINT-6016 "To Do", QA field "—" on all three; no QA Team TS workbook exists for any app phase before EAINT-9805. Source: `<KEY>-jira.md` items 2–3, fetched 2026-10-29; fetch ts results. Target: `knowledge/flow-mobile-app.md` §1 item 2.
6. **App Dermalog-missing prompt (Phase 1):** title "Fingerprint Verification", content "Please plugin the dermalog to continue fingerprint verification"; Step 1 buttons "Read MyKad" / "Verify" / "Next". Source: SRD EAINT-5566 STMS V1.0, Tables 2.5.2.1 and 2.5.3.1. Target: `flow-mobile-app.md` §4.
7. **Thumbprint server check rules (added 2026-10-30):** a scan is accepted only if signed by the reader software, match "Identical", quality above zero, recent timestamp, not used before. Source: Ask eAuto answer, dashboard chat 2026-10-30 04:04 ("based on what is live in prod"). Target: `knowledge/flow-platform.md` § MyKad and thumbprint reader.
8. **One shared reader panel + server check for all UCD and AATF thumbprint screens; Wholesale "STMS thumbprint, handover reject-vehicle" also captures a thumbprint.** Source: same. Target: `flow-platform.md` § MyKad and thumbprint reader (page list).
9. **Where the thumbprint result shows:** "MyKad/Thumbprint verified on" date on eSTM, BMK, SSM, eInvoice and wholesale details; image on the wholesale STMS form and in PDFs (eSTM buyer authentication, insurance add-user authorisation and declaration, e-contract signature, customer verification). Source: same. Target: `flow-platform.md`.
10. **Web STMS / eSTM keep the old reader plug-in as a fallback; the dev reader emulator copies today's reader.** Source: same. Target: `flow-platform.md` and `flow-mobile-app.md` §4.
11. **iOS biometric login rules (EAINT-12592):** up to 5 saved accounts per phone; no backend change ("settings.get then login.do"); dialogs Face ID Is Off / Is Locked / Saved Login Not Working / Face ID Changed; only server DENIED removes one account, a real Face ID change removes all; Account tab "Login with Face ID" switch. Source: `_reference/tickets/Studying/EAINT-12592/EAINT-12592-jira.md` description, 2026-10-30. Target: `knowledge/flow-mobile-app.md` new section "Biometric login".
12. **Staging: every login.do while signed in ends the current session, even with a wrong password** (28 Oct). Source: same, "Requirement". Target: `flow-mobile-app.md` / `flow-platform.md` login rules.
