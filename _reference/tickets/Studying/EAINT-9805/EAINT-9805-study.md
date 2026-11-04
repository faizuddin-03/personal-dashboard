# EAINT-9805 — study (2026-10-29)

## Header

1. **Title (verbatim, Jira):** "⚫eAuto Mobile App - Phase 6: STMS - To update STMS module same as Production Web Portal (as of 29.01.2026)"
2. **Jira status:** **REQ REFINEMENT IN PROGRESS -EAUTO** (Task). Updated 2026-10-26 15:48.
3. **Priority:** Medium.
4. **Fix version:** "S35.X-20261102 🌞/🌚 TBC" (2026-11-02). **Exp. Deploy Date (cf 10087):** 2026-11-02. Labels: 260126-260130, January2026, ProductBacklog.
5. **QA (Jira cf[10041]):** Hui Xin Lee (automation, per workbook "Automation device (Hui Xin)"). Faizuddin = **manual** (Iris manual TS + manual testing). `[from data/pipeline/work/EAINT-9805/history.md, Standing decision 2]`
6. **Assignee:** Zhen (dev). **Reporter / SRD author:** Chee Mei Jia (BA).
7. **Parent epic:** EAINT-7554 "eAuto Mobile App".
8. **Portal:** **UCD Mobile App** (native Android / iOS app, not a web view). Module: **STMS**.
9. **Test env:** **not stated** in Jira or SRD. ETA for Testing (cf 10057) and [QA] Est Man-day (cf 10081): blank.
10. **Comments:** 0. **Links:** none. **Sub-tasks:** 18 (listed under "Dependencies").

## Sources read

1. Jira capture `_reference/tickets/Studying/EAINT-9805/EAINT-9805-jira.md` (captured 2026-10-29 17:04): fields, description, 0 comments, 1 attachment, 18 sub-tasks.
2. **SRD v0.1, 06.02.2026** (.docx, 48,353 bytes, the only attachment) — read through its text copy `EAINT-9805_Mobile App_Phase 6 - STMS Module same as existing production web portal as of 29.01.2026_V0.1_20260206-text.md`. **Images in the .docx were not kept** in the text copy and were not read.
3. `_reference/tickets/EAINT-9805/EAINT-9805-mobile-app-sources-2026-10-28.md` — QA workbook cell text (sheets "Device & Test Scope", "Iris & Dermalog Support"), EAINT-6014 Phase 2 Google Sheet notes, Jira 2026-10-28 sub-task statuses, Teams lines on Iris.
4. `_reference/tickets/EAINT-9805/EAINT-9805-qa-team-ts-study.md` (2026-10-28, earlier QA workbook study).
5. `_reference/tickets/EAINT-9805/EAINT-6014-app-phase2-TS--Functional-and-Interruption-Test.csv` — **not opened row by row**; its rules are already summarised in `knowledge/flow-mobile-app.md` §5.
6. `data/pipeline/work/EAINT-9805/history.md` — standing decisions and lead's scope message.
7. knowledge/: `README.md`, `flow-mobile-app.md` (all), `flow-platform.md` lines 289–321, `flow-stms.md` (grep: mobile, Transfer History, JPJ Official Receipt, e-invoice), `teams-decisions-by-ticket.md` line 422.
8. `_reference/teams/`: **no file name or content contains EAINT-9805.**
9. `lib/ticketStudies.ts`: **no EAINT-9805 entry.**
10. **Not read:** the 9 Figma links in SRD §1.5 (no access in this run); the official SharePoint .xlsx itself (only its text capture); the Claude Iris suggestion workbook in OneDrive.

## What changes

1. **What (SRD §2.1.1):** "This enhancement is to implement the STMS Module to the latest version, aligned with the existing production version as of 29.01.2026."
2. **Why (SRD §2.1.2):** "Ensures Mobile App is aligned with the latest production STMS version."
3. **Where (SRD §2.2.1 Background):** Project "eAuto"; Portal "UCD Mobile App"; Module "STMS Module"; Area "Whole STMS flow include Transfer History, e-invoice & JPJ Official Receipt."
4. **Roll-out rule (Jira description):** "Planning: To complete STMS module same as Production Web Portal" / "Note: Can roll out this with STMS module only, can hide other modules if haven’t ready."
5. **Screens named (SRD §1.5, Figma links, verbatim item names):**
   1. "Figma Design – STMS Transaction Listing"
   2. "Figma Design – STMS Transaction Details Page"
   3. "Figma Design – STMS Individual Category (MyKad)"
   4. "Figma Design – STMS Individual Category (MyPR)"
   5. "Figma Design – STMS Company Category"
   6. "Figma Design – STMS + Transfer History Individual Category"
   7. "Figma Design – STMS + Transfer History Company Category"
   8. "Figma Design – UCD to UCD (Standard)"
   9. "Figma Design – UCD to UCD (Interstate)"
6. **Reference = production web STMS as of 29.01.2026.** The web flow is in `knowledge/flow-stms.md` (6 steps, RHB payment, Transfer History add-on at Step 4, Invoice / e-Invoice, JPJ Official Receipt).

## Requirements

1. **The SRD has no numbered requirements.** v0.1 is an "Initial Draft": Glossary rows 1–5 are blank; §2.1.3 "Additional Note(s)" is blank; §2.2.1 row 5 "Additional Criteria" is blank. `[SRD v0.1 §1.4, §2.1.3, §2.2.1]`
2. **Implied requirement:** every STMS screen and rule in the app behaves the same as production web on 29.01.2026, for Individual (MyKad, MyPR), Company, Transfer History, UCD to UCD (Standard, Interstate), e-Invoice and JPJ Official Receipt. [unconfirmed — derived from SRD §1.5 and §2.2.1, not stated as a list]
3. **Changes after the baseline are added as sub-tasks** (each aligns one later web change), e.g. "Update home page STMS and UCD to UCD tile price from RM25 to RM35" (EAINT-12550), "Display usage code "AH" (e-hailing) on STMS Step 4, Interstate Step 2 and Transaction Details" (EAINT-12553), "Show the Transaction Restriction Notice popup (S00044)" (EAINT-12552). `[Jira sub-task list]`
4. **QA scope as written by the QA team** (workbook "Device & Test Scope", not the SRD):
   1. Full E2E (automation), R17: "All E2E flows in all modules, including negative and edge cases."
   2. Full manual, R20–R22: "1. Iris and Dermalog full testing, including negative testing." / "2. Face login and fingerprint login." / "3. Interruption testing (check the TS with Charmain)."
   3. Automation short check, R25–R27: "1. One E2E happy path for each key module." / "2. File upload." / "3. Edge-to-edge display check (Android 16 and 17 only)…"
5. **Faizuddin's part (lead, Teams 2026-10-28, verbatim):** "Iris Dermalog is new, so we’ll need to prepare similar test scenarios for Iris based on the WebSocket Dermalog test scenarios. Please add the manual TS in EAINT-9805 excel by creating a new tab ya." `[data/pipeline/work/EAINT-9805/history.md, Standing decision 1]`

## New vs existing behaviour

1. **Existing (app):** Phase 1 EAINT-5566 and Phase 2 EAINT-6014 (eLKM, SSM) "Ready for Prod Deployment". `[knowledge/flow-mobile-app.md §1]`
2. **New (Phase 6):** full STMS parity with web incl. Transfer History, e-Invoice, JPJ Official Receipt, UCD to UCD. `[SRD §2.2.1 row 4, §1.5]`
3. **New (app-only, from sub-tasks):** iOS biometric login "Face ID / Touch ID with saved accounts" (EAINT-12592); Android "Rooted Device Handling" (EAINT-12570); iOS "Bottom tab bar with Help and Account pages (settings page)" (EAINT-12666). `[Jira sub-task list]`
4. **New (hardware):** **Iris** reader over **Bluetooth**, beside **Dermalog** over **USB**. `[workbook "Device & Test Scope" R30, R38]`
5. **Scope beyond STMS (sub-tasks):** "STMS LKM Refund Module" (12567, 12591, 12683), "Insurance Cancellation Module" (12637), "E-invoice implementation" (12667), "LLP Business Type" (12668), eSTM items in 12551 and 12575. These are **not in the SRD**. `[Jira sub-task list]`

## Open questions / risks for testing

1. **SRD is v0.1 draft, never baselined.** No requirement list, no glossary, no expected results. Jira status is still "REQ REFINEMENT IN PROGRESS -EAUTO" with a 2026-11-02 deploy date. Risk: no written pass criteria apart from "same as web".
2. **Baseline date vs later web changes.** SRD says "as of 29.01.2026", but sub-tasks add later web changes (RM35 tile, usage code AH, S00044, Perakuan SRD v1.1). Which web version to compare against is not written. [unconfirmed — assume production web today plus listed sub-tasks]
3. **Scope creep past the SRD.** SRD §2.2.1 names only "STMS Module", yet sub-tasks cover LKM Refund, Insurance Cancellation, LLP, eSTM. `knowledge/flow-platform.md` line 298 says "In production code the app's own eSTM entry points are commented out." Whether eSTM is in Phase 6 test scope is not confirmed.
4. **Test environment / UAT app instance** not stated anywhere. Phase 1 used sit3, Phase 2 sit1 (`knowledge/flow-mobile-app.md` §2). Staging now uses the /eauto instance (memory, 2026-10-21) [unconfirmed for the app].
5. **iOS install route and devices:** iOS 18 "TBC", iOS 26 "colleague's phone (TBC)?", iOS 27 "iPhone 17e (TBC)". `[workbook R7–R9]` Manual device column header reads "Manual device (??)" (R1).
6. **Iris app messages unknown** (Bluetooth off, out of range, unpair, permission denied). Workbook R44: "Unpair the scanner and check the message the app shows." — no expected text.
7. **Dermalog on Android 16/17 undecided:** "If it fails, the app should show a clear message and must not crash or freeze. Raise it to SA, because the expected result is not confirmed." `[workbook R14]`
8. **Iris unit deadline:** "The Iris test device must be returned by 2026-11-03." `[knowledge/teams-decisions-by-ticket.md line 422, from Teams 2026-10-13 16:55]` Whether it is the same unit used for the app is [unconfirmed].
9. **Dermalog runtime licence** needed on Android; Phase 2 marked rows N/A "*without runtime license". `[knowledge/flow-mobile-app.md §4.4]` Who holds the licence is not known.
10. **Figma not readable** in this run — screen-level checks (labels, fields) cannot be derived here.
11. **Fix version note says "TBC"** next to 2026-11-02; the date may move.

## Suggested test focus

1. **Faizuddin (manual):** Iris manual TS tab — pair / permission, one full STMS transaction with Iris, Bluetooth off/on, out of range, unpair, interruptions on the thumbprint steps (Step 1 and Step 3). Starting point: the existing suggestion workbook (32 TS, 9805_IR_TS01–TS32) in OneDrive `eAuto Documents\EAINT-9805\`. `[history.md, Standing decision 5]`
2. **STMS parity, side by side with web:** Individual MyKad, Individual MyPR, Company (Type of Business, uploads up to 5MB), Step 4 JPJ check, Transfer History add-on (Individual + Company), RHB payment, Step 6. Compare against `knowledge/flow-stms.md`.
3. **UCD to UCD:** Standard and Interstate (usage code AH on Interstate Step 2 per EAINT-12553).
4. **Documents on Transaction Details:** Invoice, e-Invoice (shows when LHDN Response Status = OK), JPJ Official Receipt (hidden until received), download to phone storage.
5. **Cross-check on web after each app transaction:** UCD and BO Transaction Listing / Details, BO JPJ XML Log (STMS). `[knowledge/flow-mobile-app.md §3.3]`
6. **Sub-task items:** home tile price RM35 (12550), S00044 popup (12552), rooted device block (12570), iOS Face ID / Touch ID with saved accounts (12592).
7. **Device rules:** biometric login, tablet portrait/landscape + mid-flow rotation, edge-to-edge on Android 16/17, interruption rules from Phase 2.
8. **Evidence:** screen recording via mirroring; every bug states device model, OS, app version and build number. `[knowledge/flow-mobile-app.md §3]`

## Dependencies / related tickets

1. **Parent:** EAINT-7554 "eAuto Mobile App". Earlier phases: 5566 (P1), 6014 (P2), 6015 (P3), 7109 (P4), 6016 (P5).
2. **Sub-tasks (Jira, verbatim titles):** EAINT-12425 "Phase 6 Bug fixes + Leftover branch merging"; 12550 "Update home page STMS and UCD to UCD tile price from RM25 to RM35"; 12551 "Align Perakuan with SRD v1.1 and add JPJ Official Receipt download to eSTM"; 12552 "Show the Transaction Restriction Notice popup (S00044)"; 12553 "Display usage code "AH" (e-hailing) on STMS Step 4, Interstate Step 2 and Transaction Details"; 12558 "[Android] Merging Staging branch into develop including items from Phase 3-6"; 12567 "STMS LKM Refund Module"; 12568 "[Android] PR#3 Review - eSTM city list per state, duplicate STMS fee rows, keyboard covering consent fields"; 12570 "[Android] Implement Rooted Device Handling"; 12575 "[Android] Review PR#7 - Backend changelog alignment…"; 12591 "[Android] Review PR#19 STMS LKM Refund Module"; 12592 "[iOS] Biometric login (Face ID / Touch ID) with saved accounts"; 12637 "Insurance Cancellation Module"; 12663 "[Android] Test Coverage Audit V1"; 12666 "[iOS] Bottom tab bar with Help and Account pages (settings page)"; 12667 "[Android] E-invoice implementation"; 12668 "[Android] LLP Business Type"; 12683 "[iOS] STMS LKM Refund Module".
3. **Sub-task statuses** are not in the 2026-10-29 capture. Last known (2026-10-28): 12567 Code Review, 12591 To Do, 12592 and 12637 In Development, the rest listed Done. `[EAINT-9805-mobile-app-sources-2026-10-28.md §3]` 12663, 12666, 12667, 12668, 12683 are **new since 2026-10-28** (status unknown).
4. **Model TS for Iris:** EAINT-7229 (Dermalog WebSocket TS) — `_reference/tickets/EAINT-7229/EAINT-7229-qa-team-ts-study.md`.
5. **Web twin tickets:** EAINT-12559 (JPJ Official Receipt), EAINT-12560 (usage code AH). `[knowledge/flow-platform.md line 307]`

## Against existing knowledge

1. `knowledge/flow-mobile-app.md` §1.4 lists 3 open sub-tasks on 2026-10-28. Jira now has **18 sub-tasks**; 5 are new (12663, 12666, 12667, 12668, 12683). Not a contradiction — knowledge is out of date.
2. `knowledge/flow-platform.md` line 298 ("app's own eSTM entry points are commented out") vs sub-tasks 12551 / 12568 / 12575 that change app eSTM. **Possible conflict**: eSTM code is being built in Phase 6 even if hidden in production. [unconfirmed]
3. `knowledge/flow-platform.md` line 320: "Which modules the app exposes … is not answered yet". The SRD answers only for Phase 6: **STMS, incl. Transfer History, e-invoice, JPJ Official Receipt, UCD to UCD** (§2.2.1, §1.5). Other modules: Jira "can hide other modules if haven’t ready".
4. `knowledge/flow-platform.md` line 321: "iOS status is not recorded." Sub-tasks 12592, 12666, 12683 show **iOS development is active**.
5. `knowledge/flow-stms.md` line 71 notes the tile price change as "Code Review"; on 2026-10-28 EAINT-12550 was Done. `[EAINT-9805-mobile-app-sources-2026-10-28.md §3]`

## Knowledge candidates

1. **Phase 6 SRD scope:** Portal "UCD Mobile App", Module "STMS Module", Area "Whole STMS flow include Transfer History, e-invoice & JPJ Official Receipt." Screens per Figma: STMS Listing, Details, Individual (MyKad / MyPR), Company, STMS + Transfer History (Individual / Company), UCD to UCD (Standard / Interstate). Source: SRD v0.1 06.02.2026 §2.2.1, §1.5. Target: `knowledge/flow-mobile-app.md` §1 and `flow-platform.md` line 320.
2. **SRD status:** v0.1 "Initial Draft", no numbered requirements; ticket in "REQ REFINEMENT IN PROGRESS -EAUTO" with Exp. Deploy Date 2026-11-02. Source: SRD §1.3; Jira fields 2026-10-29. Target: `flow-mobile-app.md` §1.
3. **Sub-task list update:** 18 sub-tasks on 2026-10-29, new: 12663 "[Android] Test Coverage Audit V1", 12666 "[iOS] Bottom tab bar with Help and Account pages (settings page)", 12667 "[Android] E-invoice implementation", 12668 "[Android] LLP Business Type", 12683 "[iOS] STMS LKM Refund Module". Source: Jira capture 2026-10-29. Target: `flow-mobile-app.md` §1.4.
4. **iOS is in active development** (biometric login with saved accounts, bottom tab bar, LKM Refund). Source: Jira sub-tasks 12592, 12666, 12683. Target: replace `flow-platform.md` line 321.
5. **App-only security rule:** Android rooted device handling exists (EAINT-12570 "[Android] Implement Rooted Device Handling"). Expected behaviour not read. Source: Jira sub-task title. Target: `flow-mobile-app.md` new section.
6. **Correction:** `flow-stms.md` line 71 EAINT-12550 "Code Review" → Done (2026-10-28). Source: `EAINT-9805-mobile-app-sources-2026-10-28.md` §3.
