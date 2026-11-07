---
name: eaint-9805-mobile-qa-issue
description: Raise QA-Issue tickets for the eAuto MOBILE APP ticket EAINT-9805 in the mobile format the team used under EAINT-6014 (Mobile App Phase 2) — purple panel with Testing Environment / Version / Android Phone (or iOS Phone), no Browser/Module/Staging Test line, the red/green Item / Step to Simulate | Actual Result | Expected Result table, and "Current Web Behavior:" evidence in the Expected cell. Use WHENEVER a bug found while testing the eAuto mobile app (Android or iOS, MyKad / Iris / Dermalog / biometric login / STMS / eSTM / LKM Refund / Insurance Cancellation on the app) is raised, filed, logged or "raised under 9805". Overrides the web format of eauto-qa-issue-ticket for this ticket only.
---

# EAINT-9805 Mobile App QA-Issue

Format source: QA-Issues under **EAINT-6014** (eAuto Mobile App Phase 2), read 2026-11-06.
1. 75 of 92 QA-Issues used the format below. Reference tickets: **EAINT-7196**, **EAINT-7292**, **EAINT-7299**, **EAINT-7239**.
2. Faizuddin, 2026-11-06: "i want for this ticket to have a seperate format for raising an issue. can refer to the bugs raised under EAINT-6014."

Everything not stated here (field IDs, QA / Developer fields, duplicate check, priority, On Hold flow, attaching evidence through Claude in Chrome, the 10 MB cap) follows the **eauto-qa-issue-ticket** skill. Read it for those rules.

## 1. Fixed values

1. Parent: **EAINT-9805** unless the user names another mobile parent.
2. Issue type: `QA-Issue`. cloudId `8fc3c96f-5850-4bd1-bb80-f57582b68e93`, project `EAINT`.
3. Testing Environment text: `eAuto Mobile App` (verbatim, as in every 6014 ticket).

## 2. Ask before creating (one AskUserQuestion batch; skip what the user already gave)

1. **Platform:** Android or iOS (or both).
2. **Version / build:** the app build tested, written as the app shows it (6014 used `v1.0.0-build-41`). Never guess it.
3. **Phone model:** exact model (6014 examples: `Xiaomi 14T 2406APNFAG`, `Samsung A54`). Several phones → join with ` / `.
4. **Priority:** Highest / High / Medium / Low. Never defaulted.
5. **Developer / assignee:** always ask. 9805 has separate Android and iOS developers, so the dev follows the platform.
6. **Evidence:** screenshot or screen recording of the app, plus the web screenshot for "Current Web Behavior:" when the case exists on web.

## 3. Title

`[eAuto App - UCD] <Module / Step> - <plain symptom>`

1. Module first, then step (e.g. `STMS Step 1 - MyKad verification pop-up not shown when card is pulled during Dermalog read`).
2. Add `[Android]` or `[iOS]` after the prefix when only one platform is affected: `[eAuto App - UCD] [iOS] Iris Pairing - ...`.
3. Web-alignment bugs end with the 6014 phrasing: `... to follow same behavior as web's` / `... as per Web behavior`.

## 4. Description (ADF)

Template: `references/description-template.json`. Structure, top to bottom:

1. **Purple note panel** (`panelType: "note"`), three paragraphs, bold label + plain value:
   1. `Testing Environment:` eAuto Mobile App
   2. `Version:` <build>
   3. `Android Phone:` <model> — for iOS use `iOS Phone:` <model>. Both platforms → two lines.
2. **No** Browser, Module or orange Staging Test line. These are the web format only. Test data (IC, vehicle no., transaction id) goes in the steps.
3. **Three-column table**, header row bold:
   1. `Item / Step to Simulate` — default colour.
   2. `Actual Result` — red `#bf2600`.
   3. `Expected Result` — green `#006644`.
4. **Column 1:** optional bold label `Scenarios`, then an **ordered list** of steps. Failing states bold red `#ff5630` (e.g. `JPJ Enquiry = Failed`); success states bold green `#36b37e`.
5. **Column 2 (Actual):** bold area label (e.g. `"View Details" button:` / `Payment Summary section`), then a bullet list of what happened, key words bold. App screenshot or recording below it.
6. **Column 3 (Expected):** same bold area label, bullet list of what should happen, key words bold. Then the source:
   1. Web case → blue bold `#0747A6` label `Current Web Behavior:` + web screenshot. Wording follows the web text verbatim (memory: feedback_mobile-app-wording-follows-web).
   2. Figma case → bold `Figma:` + link + frame screenshot.
   3. App-only case with no confirmed wording → say so and ask eAuto; do not invent expected text.
7. Several symptoms in one ticket → one table row each.
8. Optional closing line under the table for scope, bold: e.g. `*To fix for STMS as well` / `Please check all eSTM category (MyKad, MyPR and Company)`.

## 5. Build separator sub-tasks (6014 practice — ask first)

Under 6014 the team created a plain **Sub-task** per build before its issues: summary `=======  v1.0.0-build-44 eAuto Mobile App Issues ======= ` (no description), so the parent's child list groups issues by build. Ask the user whether to create one for a new build. Never create it without a yes.

Not a consistent rule (checked 2026-11-06): only 14 dividers exist in EAINT — 1 under EAINT-5566 (Phase 1, `v1.0.0`, EAINT-5824) and 13 under EAINT-6014 (builds 30–35 and 38–44). Builds 36 and 37 had no divider, and none was made from build 45 onwards (issues raised on builds 45, 49 and 52), and later 6014 issues name their build only in the panel.

## 6. After creating

1. Attach evidence (eauto-qa-issue-ticket "Attaching test evidence"). Screen recordings usually exceed what automation can embed inline; attach to the Attachments panel and tell the user.
2. Report key + URL, platform, build, phone, priority, assignee.
3. Note the TS id the bug came from (e.g. `9805_MK_TS10`) when the user gives it, so the workbook Remarks can cite the key.

## 7. Retest (reference only)

6014 retest comments: `Tested and verified in eAuto Mobile App:` + green `pass` lozenge, then a note panel with `Version:` and `Android Phone:` of the retest build, evidence in an expand titled `Test Evidence`. Default retest format stays the **qa-issue-retest** skill (DONE / REDEV) unless the user asks for this one.
