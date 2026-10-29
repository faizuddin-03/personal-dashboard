# EAINT-11784 — QA Team test script study (2026-10-27)

## Sources read

1. **Text copy** of the workbook: `_reference/sharepoint/qa-team-ts/EAINT-11784 - [eAuto-Insurance] Visual of webinar on eAuto Insurance for June 2026.md` (exported 27/10/2026, 8:53:57 pm). It states "Cell text only, row by row; formatting and images are not kept." So **cell colours, images and any embedded QR/banner screenshots were not seen**.
2. **knowledge/** grep for `EAINT-11784`: `knowledge/business-rules-from-test-scenarios.md` lines 548-552; `knowledge/cr-test-scenario-catalogue.md` lines 115, 367.
3. **lib/eautoFlows/modules/ucd-portal.ts** lines 231-300 and **lib/eautoFlows/modules/insurance.ts** lines 100, 978-1023 (mention 11784).
4. **knowledge/flow-ucd-shell.md** lines 40-119 (popup chain) and **knowledge/flow-insurance-purchase.md** (banner/popup grep only).
5. **lib/ticketStudies.ts**: no entry for EAINT-11784.
6. **Not present:** `_reference/tickets/EAINT-11784/` (no files before this study), `_reference/tickets/Studying/EAINT-11784/`. No SRD, no Jira ticket text, no Teams thread read. Jira was not queried (unattended run).
7. **Not read:** the original `.xlsx` (`_reference/sharepoint/eauto-cr-test-scenarios/...xlsx`) and the duplicate text at `_reference/inbox/eauto-flows-run/ts-text/EAINT-11784_...xlsx.txt` — the `.md` text copy was used instead.

## 1. Header

1. **Ticket:** EAINT-11784 — "[eAuto-Insurance] Visual of webinar on eAuto Insurance for June 2026".
2. **Module / portal:** UCD portal — **HomePage**, **Insurance module landing page**, **Insurance Transaction Listing** (Screen column values "HomePage" and "Insurance Page").
3. **Workbook:** "EAINT-11784 - [eAuto-Insurance] Visual of webinar on eAuto Insurance for June 2026.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 18/06/2026, 9:15:07 am.
4. **Sheets:** 2.
   1. **Sheet1** — 11784_TS01 to 11784_TS16, rows R2-R53 (52 step rows).
   2. **Sheet1 (2)** — same rows R2-R53 copied word for word, plus **11784_TS17** and **11784_TS18** (R54-R61). [unconfirmed] Sheet1 (2) looks like the later working copy.
5. **Scenarios:** **18 unique** (TS01-TS18). Columns: "TS No. | Browser | User | Pre-Condition | Screen | Test Scenario & Steps | Expected Result | QA | Test Result (P/F)".
6. **Result counts (Sheet1 (2), by scenario):**
   1. **Pass: 14** — TS01-TS07, TS09-TS15 (every step row "Pass").
   2. **No result: 2** — **TS08** (R25-R27) and **TS16** (R51-R53): QA and Test Result cells empty.
   3. **Pending: 2** — **TS17** (R54-R57) and **TS18** (R58-R61): "Pending".
   4. **Fail: 0.**
7. **Tester:** QA column "Aliah" on TS01-TS03, TS12-TS14, TS17-TS18. QA column **empty** on TS04-TS11 and TS15-TS16, although TS04-TS07 and TS09-TS15 show "Pass".
8. **Dates:** none written in the sheet. Only the SharePoint modified date (18/06/2026).
9. **Extra column note:** "* deprio" on Sheet1 R12 (TS04), R21 (TS07), R28 (TS09), R47 (TS15). These scenarios are still marked "Pass".

## 2. What the ticket changed, as the TS shows it

1. Adds a **webinar banner** (June 2026) for UCD users. It "contains the webinar details, session info & QR code for registration" (Sheet1, R3).
2. Shown in **three places**:
   1. **HomePage** after login (Sheet1, R3, R12).
   2. **Insurance Module Landing Page** (Sheet1, R6).
   3. **Above the Insurance Listing** (Sheet1, R9).
3. Takes part in the **login popup chain** after "Update Company Profile" (Chrome) and after "Upgrade Web Socket" (Firefox) (Sheet1, R2-R3, R28, R37-R38).
4. Is meant to be **auto-hidden** after a set day (Sheet1 (2), R54 pre-condition) — **not yet tested** (Pending).

## 3. Scenarios, grouped

All rows: User "Main UCD". Each scenario repeats the same close / click-outside / refresh checks.

### A. Chrome — Insurance permission ON

1. **TS01** (HomePage, Company Profile pending) — login shows "Update Company Profile banner is displayed upon login"; close it → "Webinar banner is displayed"; click outside → "The webinar popup will remain on screen"; (x) + refresh → "After refresing the page, the webinar banner will not appear again." **Pass** (R2-R5).
2. **TS02** (Insurance landing page, Company Profile pending) — "Webinar banner is displayed upon entering the Insurance Landing Page"; same click-outside and close/refresh checks. **Pass** (R6-R8).
3. **TS03** (Insurance Listing, Company Profile pending) — "The webinar banner is displayed above the listing upon entering the page"; "There will be no webinar banner displayed in Details Page"; "The webinar banner remains in the listing page" after refresh. **Pass** (R9-R11).
4. **TS04** (HomePage, Company Profile updated) — "Webinar banner is displayed upon login"; same checks. **Pass**, "* deprio" (R12-R14).
5. **TS05** (Insurance landing page, Company Profile updated) — as TS02. **Pass** (R15-R17).
6. **TS06** (Insurance Listing, Company Profile updated) — as TS03. **Pass** (R18-R20).

### B. Chrome — Insurance permission OFF

1. **TS07** (HomePage, Company Profile pending) — as TS01, plus "In Home Page, ensure UCD is unable to navigate to Insurance Page". **Pass**, "* deprio" (R21-R24).
2. **TS08** (HomePage, Company Profile updated) — as TS04 plus the no-navigation check. **No result recorded** (R25-R27).

### C. Firefox — Insurance permission ON

1. **TS09** (HomePage, Company Profile updated) — "Upgrade Web Socket popup will be displayed first" then "Webinar banner is displayed after closing the previous popup". **Pass**, "* deprio" (R28-R30).
2. **TS10** (Insurance landing page, Company Profile updated) — as TS02. **Pass** (R31-R33).
3. **TS11** (Insurance Listing, Company Profile updated) — as TS03. **Pass** (R34-R36).
4. **TS12** (HomePage, Company Profile pending) — "Upgrade Web Socket popup & Update Company Profile popup will be displayed in sequence"; closing both → "Webinar banner is displayed". **Pass** (R37-R40).
5. **TS13** (Insurance landing page, Company Profile pending) — as TS02. **Pass** (R41-R43).
6. **TS14** (Insurance Listing, Company Profile pending) — as TS03. **Pass** (R44-R46).

### D. Firefox — Insurance permission OFF

1. **TS15** (HomePage, Company Profile pending) — as TS12 plus the no-navigation check. **Pass**, "* deprio" (R47-R50).
2. **TS16** (HomePage, Company Profile updated) — as TS09 plus the no-navigation check. **No result recorded** (R51-R53).

### E. Auto-hide after end date (Sheet1 (2) only)

1. **TS17** (Chrome, Company Profile pending, permission ON) — next day: "No webinar banner is displayed on the Home Page"; "No webinar banner is displayed upon entering the Insurance Page"; "The webinar banner is not displayed above the listing upon entering the page". **Pending** (R54-R57).
2. **TS18** (Firefox, same) — same three checks. **Pending** (R58-R61).

## 4. Business rules and system behaviour the TS reveals

1. **Content:** "Ensure the webinar banner contains the webinar details, session info & QR code for registration." (Sheet1, R3; repeated R6, R9 and others).
2. **Modal, not click-away:** "Click outside the banner" → "The webinar popup will remain on screen" (Sheet1, R4, R7, R13 and others). The sheet calls it both "banner" and "popup".
3. **Close is remembered on Home and landing page:** "The webinar banner will be closed. ⏎ After refresing the page, the webinar banner will not appear again." (Sheet1, R5, R8).
4. **Listing banner is different:** it is not closed in any step; on refresh "The webinar banner remains in the listing page" (Sheet1, R11). It returns on "re-entering the Listing Page" (Sheet1, R10).
5. **Not on Details page:** "There will be no webinar banner displayed in Details Page" (Sheet1, R10).
6. **Chrome order with profile pending:** "Update Company Profile banner is displayed upon login" first, then after "(x) button on Update Company Profile popup" → "Webinar banner is displayed" (Sheet1, R2-R3).
7. **Firefox order, profile updated:** "Upgrade Web Socket popup will be displayed first ⏎ ⏎ Webinar banner is displayed after closing the previous popup" (Sheet1, R28).
8. **Firefox order, profile pending:** "Upgrade Web Socket popup & Update Company Profile popup will be displayed in sequence" (Sheet1, R37), then webinar (Sheet1, R38).
9. **Shown even without Insurance permission:** with "NO Permission to Insurance" the Home webinar banner still shows (Sheet1, R22, R25, R48, R51), and "In Home Page, ensure UCD is unable to navigate to Insurance Page" (Sheet1, R24, R27, R50, R53).
10. **Auto-hide is configurable:** pre-condition "Set webinar banner to auto-hidden on next day. To test the result on next day" (Sheet1 (2), R54). [unconfirmed] whether this is a BackOffice setting, a config file or a code date — the sheet does not say.

## 5. Test data, environments, accounts, setup

1. **Environment:** not written in the sheet. [unconfirmed] staging.
2. **Browsers:** Chrome (TS01-TS08, TS17) and Firefox (TS09-TS16, TS18).
3. **Account type:** "Main UCD" only. No login IDs. **No credentials** in the sheet.
4. **Account states needed:**
   1. "Pending update on Company Profile" vs "Have updated Company Profile".
   2. "Have Permission to Insurance" vs "NO Permission to Insurance".
5. **Setup for TS17/TS18:** banner end date set to the next day; test run the following day (Sheet1 (2), R54).
6. **Data:** any existing insurance transaction, to open "any insurance Details Page" (Sheet1, R10).

## 6. Gaps or risks a regression should still cover

1. **Auto-hide never executed:** TS17/TS18 are "Pending". Nothing in the sheet proves the banner disappears after its end date.
2. **TS08 and TS16 not recorded:** Home banner for a user with **no Insurance permission and profile updated** has no result on either browser.
3. **Sub UCD not tested:** every row is "Main UCD".
4. **Closing the listing banner:** no step closes the banner above the listing. Whether it has an (x), and whether closing it is remembered, is untested.
5. **Close persistence scope:** only page refresh was tested. Not tested: logout/login, a new browser session, or whether closing on Home also hides it on the Insurance landing page. [unconfirmed] the flag may be localStorage, like the other popups in `knowledge/flow-ucd-shell.md`.
6. **QR code target:** the QR is only checked as present. Scanning it / the registration link is not tested.
7. **Insurance landing page without permission:** not reachable, so not tested; only "unable to navigate" is checked.
8. **"* deprio" rows marked Pass** with an empty QA column (TS04, TS07, TS09, TS15): unclear who ran them or if they were run. [unconfirmed]
9. **Superseded content:** a later webinar (EAINT-12106, August 2026) exists per `knowledge/cr-test-scenario-catalogue.md` line 117. A regression should check the **current** webinar ticket, not June 2026 content.

## Comparison with existing knowledge

1. **`knowledge/business-rules-from-test-scenarios.md` lines 548-552** says the banner is "auto-hidden after its end date", citing "Sheet1 (2), rows 54-57". Those rows are **"Pending"** — the rule is an expected result, never observed. Should be tagged as untested.
2. **`knowledge/cr-test-scenario-catalogue.md` line 115** lists "Auto-hidden after end date (Sheet1 (2)!R54-R57)" as a finding. Same Pending caveat applies.
3. **`lib/eautoFlows/modules/ucd-portal.ts` line 279** says: "With a pending company profile update the Update Company Profile banner shows on the Homepage; the webinar banner shows on the Insurance pages." The TS shows the webinar banner **also shows on the Homepage** after closing the profile popup (Sheet1, R3). The lib text is incomplete.
4. **`lib/eautoFlows/modules/ucd-portal.ts` line 235** says "Popup shows once per login." For the webinar, the TS tests **refresh after close**, not re-login; and on the listing the banner **remains after refresh** (Sheet1, R11). "Once per login" is not what this TS proves.
5. **`knowledge/flow-ucd-shell.md` line 51-55** `dialogSelectorOrder` has no webinar dialog. The webinar's DOM id and localStorage flag are unknown. [unconfirmed] — no HTML capture exists for this ticket.
6. **Consistent with** `flow-ucd-shell.md` line 57-60: popup order is per campaign. This TS's orders (Chrome: Profile → Webinar; Firefox: Web Socket → Profile → Webinar) hold for June 2026 only.

## Knowledge candidates

1. **Webinar banner shows on Home even with no Insurance permission**; the user still cannot open the Insurance page. Source: "NO Permission to Insurance" pre-condition + "Webinar banner is displayed" + "In Home Page, ensure UCD is unable to navigate to Insurance Page" `[from SharePoint TS EAINT-11784, sheet Sheet1, rows 21-24, 47-50]`. Target: `knowledge/flow-ucd-shell.md` § Campaign popup behaviour.
2. **Webinar popup is modal**: "Click outside the banner" → "The webinar popup will remain on screen" `[from SharePoint TS EAINT-11784, sheet Sheet1, row 4]`. Target: `knowledge/flow-ucd-shell.md`.
3. **Listing banner stays after refresh; not shown on Details page**: "The webinar banner remains in the listing page"; "There will be no webinar banner displayed in Details Page" `[from SharePoint TS EAINT-11784, sheet Sheet1, rows 10-11]`. Target: `knowledge/flow-insurance-purchase.md` or `flow-ucd-shell.md`.
4. **Correction:** mark the auto-hide rule in `knowledge/business-rules-from-test-scenarios.md` line 550 and `knowledge/cr-test-scenario-catalogue.md` line 115 as **untested — TS17/TS18 "Pending"** `[from SharePoint TS EAINT-11784, sheet Sheet1 (2), rows 54-61]`.
5. **Correction:** `lib/eautoFlows/modules/ucd-portal.ts` line 279 — webinar banner also shows on Homepage after the Update Company Profile popup is closed `[from SharePoint TS EAINT-11784, sheet Sheet1, rows 2-3]`.
6. **Result gaps for the catalogue:** TS08 and TS16 have no result; TS17 and TS18 are "Pending" `[from SharePoint TS EAINT-11784, sheet Sheet1 (2), rows 25-27, 51-61]`. Target: `knowledge/cr-test-scenario-catalogue.md` line 115.
7. **June 2026 popup order** (campaign-specific, per the not-fixed rule): Chrome "Update Company Profile" → webinar; Firefox "Upgrade Web Socket popup & Update Company Profile popup will be displayed in sequence" → webinar `[from SharePoint TS EAINT-11784, sheet Sheet1, rows 2-3, 28, 37-38]`. Target: example list in `knowledge/flow-ucd-shell.md` lines 64-73.
