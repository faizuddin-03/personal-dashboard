# EAINT-12106 — QA Team test script study (2026-10-27)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study of another
QA engineer's test script. Row numbers `Rn` are the sheet row numbers in the text copy
(R1 = header row).

## Sources read

1. **Text copy (primary):** `_reference/sharepoint/qa-team-ts/EAINT-12106 - [eAuto-UCD] Display Webinar on eAuto Insurance for August 2026.md` — "text copy (27/10/2026, 8:17:48 pm)", "Cell text only, row by row; formatting and images are not kept." Read through Grep; the Read tool failed on the `[ ]` in the path.
2. **Second text copy:** `_reference/inbox/eauto-flows-run/ts-text/EAINT-12106_-_eAuto-UCD_Display_Webinar_on_eAuto_Insurance_for_August_2026.xlsx.txt` — same cells, no row numbers. Used to read whole rows that Grep cut short.
3. **Workbook:** `_reference/sharepoint/eauto-cr-test-scenarios/EAINT-12106 - [eAuto-UCD] Display Webinar on eAuto Insurance for August 2026.xlsx`. Not opened. Colours, images and comments were **not read**.
4. **Ticket folders:** `_reference/tickets/EAINT-12106/` and `_reference/tickets/Studying/EAINT-12106/` held no files before this study.
5. **`lib/ticketStudies.ts`:** no entry for EAINT-12106.
6. **knowledge/:** `cr-test-scenario-catalogue.md` (rows 030, 017, 024), `environments-history.md` line 56, `business-rules-from-test-scenarios.md` §7, `flow-ucd-shell.md` (dialog chain), `flow-insurance-purchase.md` line 768.
7. **Not read:** the Jira ticket, the SRD, and Teams. Nothing in this study comes from them.

---

## 1. Header

1. **Ticket:** EAINT-12106 — "[eAuto-UCD] Display Webinar on eAuto Insurance for August 2026".
2. **Portal / module:** UCD portal — **Home Page**, **Insurance Module Landing Page**, **Insurance Transaction Listing**.
3. **Workbook:** "EAINT-12106 - [eAuto-UCD] Display Webinar on eAuto Insurance for August 2026.xlsx". SharePoint library "eAuto - CR Test Scenarios", modified 03/08/2026, 12:15:37 pm.
4. **Sheets:**
   1. **Sheet1** — the EAINT-12106 scenarios: **18 scenarios** (`12106_TS01`–`12106_TS18`), 58 step rows (R2–R59).
   2. **Sheet1 (2)** — a carried-over copy of the June 2026 webinar script (`11784_TS01`–`11784_TS18`, i.e. EAINT-11784), 60 step rows (R2–R61). Not part of this ticket's run [unconfirmed — inferred from the `11784_` ids].
5. **Columns (R1, both sheets):** "TS No. | Browser | User | Pre-Condition | Screen | Test Scenario & Steps | Expected Result | QA | Test Result (P/F)".
6. **Results:**
   1. **Sheet1:** **58 of 58 step rows "Pass"**. All 18 scenarios passed.
   2. **Sheet1 (2):** 46 "Pass", 8 "Pending" (`11784_TS17`, `11784_TS18`, R54–R61), 6 blank (`11784_TS08` R25–R27, `11784_TS16` R51–R53). Four rows carry an extra cell "* deprio" (R12, R21, R28, R47).
7. **Tester:** "Aliah" in the QA column of every Sheet1 row.
8. **Dates:** none written in the sheet. Workbook modified 03/08/2026.
9. **Environment:** not named in the sheet. `knowledge/environments-history.md` line 56 records "2026-08-03 | uat4 | EAINT-12106 | Aliah | `[from Teams QAs, 2026-08-03 10:13, Aliah Maisarah]`".

## 2. What the ticket changed, as the TS shows it

1. A **webinar banner (popup)** is shown on the UCD **Home Page** after login, and on the **Insurance Module Landing Page**. "Ensure the webinar banner contains the webinar details, session info & QR code for registration." (Sheet1, R3 and every first-step row).
2. The same webinar banner joins the **rotating banner on the Insurance Transaction Listing**, after the English and Chinese Merdeka 2026 banners, on a 7-second switch (Sheet1, R9).
3. The webinar popup is **dismissed for good** once closed: "After refresing the page, the webinar banner will not appear again." (Sheet1, R5).
4. The webinar stops after a **cutoff date** (Sheet1, R54–R59).
5. It runs **during the Merdeka Rewards campaign**, so the TS checks its place in the popup chain behind Upgrade Web Socket, Merdeka Rewards and Update Company Profile (Sheet1, R28, R37).
6. It is a **re-run of the June 2026 webinar (EAINT-11784)** with the August content. The main new item is the Merdeka popup/banner in front of it [unconfirmed — inferred from comparing Sheet1 with Sheet1 (2)].

## 3. Scenarios (Sheet1)

Each of TS01–TS16 also checks two follow-up steps: "Click outside the banner" → "The webinar popup will remain on screen", and close + refresh → "The webinar banner will be closed. After refresing the page, the webinar banner will not appear again." Only the first-step check is listed below.

### A. Main UCD, Chrome

1. **12106_TS01** (R2–R5) — Home, profile pending, has Insurance. "The Merdeka Rewards banner & Update Company Profile banner is displayed upon login"; after closing them, "Webinar banner is displayed".
2. **12106_TS02** (R6–R8) — Insurance Landing, profile pending. "The Merdeka Rewards banner is displayed upon entering the Insurance Landing Page. Close the banner." then "Webinar banner is displayed."
3. **12106_TS03** (R9–R11) — Insurance Listing, profile pending. Merdeka English → Chinese (7 s) → webinar (7 s). Webinar back on re-entry; "The webinar banner remains in the listing page" after refresh.
4. **12106_TS04** (R12–R14) — Home, profile updated. "Merdeka banner is displayed upon login. Close the banner popup." then "Webinar banner is displayed."
5. **12106_TS05** (R15–R17) — Insurance Landing, profile updated. "Webinar banner is displayed upon entering the Insurance Landing Page" (no Merdeka mentioned).
6. **12106_TS06** (R18–R20) — Insurance Listing, profile updated. Same as TS03.
7. **12106_TS07** (R21–R24) — Home, profile pending, **NO Insurance permission**. "Merdeka banner & Update Company Profile banner is displayed upon login", then webinar; "In Home Page, ensure UCD is unable to navigate to Insurance Page".
8. **12106_TS08** (R25–R27) — Home, profile updated, **NO Insurance permission**. Merdeka, then webinar; Insurance not reachable.

### B. Sub UCD, Firefox

1. **12106_TS09** (R28–R30) — Home, profile updated. "Upgrade Web Socket popup will be displayed first, then the Merdeka Rewards banner will be displayed. Close the banner. Webinar banner is displayed after closing the previous popup".
2. **12106_TS10** (R31–R33) — Insurance Landing, profile updated. Merdeka Rewards, then webinar.
3. **12106_TS11** (R34–R36) — Insurance Listing, profile updated. Same rotation as TS03.
4. **12106_TS12** (R37–R40) — Home, profile pending. "Upgrade Web Socket popup, Merdeka Rewards banner & Update Company Profile popup will be displayed in sequence", then webinar.
5. **12106_TS13** (R41–R43) — Insurance Landing, profile pending. Merdeka Rewards, then webinar.
6. **12106_TS14** (R44–R46) — Insurance Listing, profile pending. Same rotation as TS03.
7. **12106_TS15** (R47–R50) — Home, profile pending, **NO Insurance permission**. Web Socket, Merdeka, Company Profile in sequence, then webinar; Insurance not reachable.
8. **12106_TS16** (R51–R53) — Home, profile updated, **NO Insurance permission**. Web Socket, Merdeka, then webinar; Insurance not reachable.

### C. After the cutoff date

1. **12106_TS17** (R54–R56) — Chrome, Sub UCD, "Patch the cutoff date." Home and Insurance Landing: "Merdeka Rewards popup is displayed Ensure the Webinar popup is not displayed". Listing: "Merdeka rewards banner is displayed Ensure the webinar banner is not displayed".
2. **12106_TS18** (R57–R59) — Firefox, Main UCD. Same three checks as TS17.

## 4. Business rules and system behaviour the TS reveals

1. **Webinar content:** "Ensure the webinar banner contains the webinar details, session info & QR code for registration." (Sheet1, R3).
2. **No click-outside dismiss:** "Click outside the banner" → "The webinar popup will remain on screen" (Sheet1, R4).
3. **Popup closes for good:** "The webinar banner will be closed. After refresing the page, the webinar banner will not appear again." (Sheet1, R5).
4. **Webinar comes after Merdeka:** "The Merdeka Rewards banner is displayed upon entering the Insurance Landing Page. Close the banner. Webinar banner is displayed." (Sheet1, R6).
5. **Listing rotation and timing:** "1. Merdeka 2026 banner is displayed correctly in Insurance Transaction Listing 2. Merdeka 2026 banner in English is shown first by default 3. Interval between English and Chinese is 7 seconds 4. The webinar banner is displayed after the Merdeka banner. 5. Interval between Chinese Merdeka banner & Webinar banner is 7 seconds" (Sheet1, R9).
6. **Listing banner is not one-time:** "There will be no webinar banner displayed in Details Page The webinar banner is displayed when re-entering the Listing Page" (Sheet1, R10); after refresh, "The webinar banner remains in the listing page" (Sheet1, R11).
7. **Chain order, Sub UCD on Firefox, profile updated:** "Upgrade Web Socket popup will be displayed first, then the Merdeka Rewards banner will be displayed. Close the banner. Webinar banner is displayed after closing the previous popup" (Sheet1, R28).
8. **Chain order, profile pending:** "Upgrade Web Socket popup, Merdeka Rewards banner & Update Company Profile popup will be displayed in sequence" (Sheet1, R37). The webinar comes **last** in the chain: "Webinar banner is displayed" after closing all three (Sheet1, R38).
9. **No Insurance permission still sees the webinar on Home:** the webinar shows, and "In Home Page, ensure UCD is unable to navigate to Insurance Page" (Sheet1, R24, R27, R50, R53).
10. **Cutoff date ends it on all three screens; Merdeka stays:** "Merdeka Rewards popup is displayed Ensure the Webinar popup is not displayed" (Sheet1, R54, R55); "Merdeka rewards banner is displayed Ensure the webinar banner is not displayed" (Sheet1, R56).
11. **Cutoff is tested by patching:** "To verify Webinar popup & banner is not displayed after cutoff date. Patch the cutoff date." (Sheet1, R54, Pre-Condition). The June script used a different method: "Set webinar banner to auto-hidden on next day. To test the result on next day" (Sheet1 (2), R54). That one stayed "Pending" (R54–R61).
12. **Upgrade Web Socket popup shows only on Firefox:** it appears in every Firefox Home scenario (R28, R37, R47, R51) and in no Chrome one [unconfirmed — inferred from the pattern; matches the EAINT-12180 Firefox-only announcement in `knowledge/flow-ucd-shell.md` line 91].

## 5. Test data, environment, accounts, setup

1. **Accounts:** "Main UCD" and "Sub UCD". No login IDs in the sheet. **No credentials present.**
2. **Account states needed:**
   1. "Pending update on Company Profile" vs "Have updated Company Profile".
   2. "Have Permission to Insurance" vs "NO Permission to Insurance".
3. **Browsers:** Chrome (TS01–TS08, TS17); Firefox (TS09–TS16, TS18).
4. **Environment:** not in the sheet; uat4 per `knowledge/environments-history.md` line 56 (Teams, 2026-08-03 10:13).
5. **Setup for TS17/TS18:** a **dev patch of the cutoff date** (Sheet1, R54). Who patched it and where is not written.
6. **No transaction data** is needed beyond existing rows on the Insurance Transaction Listing.

## 6. Gaps and risks for regression

1. **Wrong account in the steps:**
   1. TS15 and TS16: User column "Sub UCD", step "1. Login as Main UCD" (R47, R51).
   2. TS18: User column "Main UCD", step "Login as sub UCD" (R57).
   3. Which account was really used is unknown.
2. **Details page not visited in TS03/TS06/TS11/TS14:** steps are "3. Go to Insurance landing page 4. Navigate to Insurance Listing page" (R10). The expected result still says "There will be no webinar banner displayed in Details Page". The June script did visit it: "3. Go to any insurance Details Page 4. Click on the back button" (Sheet1 (2), R9). So the **Details page check has no matching step** in August.
3. **TS15 close step skips Merdeka:** R47 shows three popups, but R48 closes only "Upgrade Web Socket popup & Update Company Profile popup".
4. **TS01 close step is unclear:** "Click (x) button on Merdeka Update Company Profile popup" (R3). It does not say if one or both popups were closed, or in which order.
5. **TS05 shows no Merdeka on Insurance Landing**, while TS02, TS10 and TS13 do (R15 vs R6, R31, R41). This may be because Merdeka was already seen in that session [unconfirmed]. The pre-condition does not say.
6. **Not covered:**
   1. The **webinar QR code / registration link** is only "ensure it contains"; nobody scans or opens it.
   2. **Bilingual webinar content** — no English/Chinese check for the webinar itself.
   3. **Logout and re-login** after closing the webinar: does it come back on the next login? Only refresh is tested.
   4. **Start date** — no check that it is hidden before the start.
   5. **Sub UCD with NO Insurance permission** on Chrome, and Main UCD on Firefox before cutoff.
   6. **AATF / other portals** — not in scope here.
7. **Cutoff tested by patch, not by the real date.** The real cutoff on the live date was not checked in the sheet.
8. **Automation risk:** the webinar dialog id is not in the known `dialogSelectorOrder` list (`knowledge/flow-ucd-shell.md` lines 51–54), and not in the "Popup code order on login" (`knowledge/flow-insurance-purchase.md` line 768). Its selector and localStorage flag are unknown. A banner-closing helper might not close it.

## 7. Contradictions and links to knowledge/

1. **"Shown once per login … also not again on the Insurance module page"** (`business-rules-from-test-scenarios.md` §7 item 2, from EAINT-11925). In this TS the Merdeka Rewards banner **does** show on the Insurance Landing Page (Sheet1, R6, R31, R41). Either each TS was a new login, or the rule changed for Merdeka Rewards [unconfirmed].
2. **"auto-hidden after its end date"** (`business-rules-from-test-scenarios.md` §7 item 7) cites EAINT-11784 Sheet1 (2) rows 54–57. In the copy inside this workbook those rows are **"Pending"**, not passed. The August script (Sheet1, R54–R59) is the first **passed** proof of the cutoff rule.
3. **Catalogue row 030** (`cr-test-scenario-catalogue.md` line 117) matches this study: "Sheet1:18; Sheet1 (2):18", R6, R28, R54 rules.
4. **Popup order is not fixed** (`flow-ucd-shell.md` lines 57–60). This TS gives one more per-campaign order: Web Socket → Merdeka Rewards → Company Profile → webinar. No conflict.

## Knowledge candidates

1. **Webinar listing-banner rotation (Aug 2026):** "Merdeka 2026 banner in English is shown first by default 3. Interval between English and Chinese is 7 seconds 4. The webinar banner is displayed after the Merdeka banner. 5. Interval between Chinese Merdeka banner & Webinar banner is 7 seconds" — `[from SharePoint TS EAINT-12106, sheet Sheet1, row 9]`. Target: `business-rules-from-test-scenarios.md` §7.
2. **Listing banner persists after refresh; popup does not:** "The webinar banner remains in the listing page" (row 11) vs "After refresing the page, the webinar banner will not appear again." (row 5) — `[from SharePoint TS EAINT-12106, sheet Sheet1, rows 5, 11]`. Target: §7 item 7.
3. **Webinar is last in the popup chain (Aug 2026 campaign):** "Upgrade Web Socket popup, Merdeka Rewards banner & Update Company Profile popup will be displayed in sequence" then "Webinar banner is displayed" — `[from SharePoint TS EAINT-12106, sheet Sheet1, rows 37-38]`. Target: `flow-ucd-shell.md` per-campaign order list.
4. **Cutoff passed:** "Merdeka Rewards popup is displayed Ensure the Webinar popup is not displayed" after "Patch the cutoff date." — `[from SharePoint TS EAINT-12106, sheet Sheet1, rows 54-59]`. Replace or add to the EAINT-11784 "Pending" citation in §7 item 7.
5. **Webinar popup shows without Insurance permission:** webinar shows on Home and "ensure UCD is unable to navigate to Insurance Page" — `[from SharePoint TS EAINT-12106, sheet Sheet1, rows 24, 27]`. Target: §7 item 3.
6. **Webinar dialog selector unknown** — no HTML capture of the webinar popup exists in `_reference/html/`. Lead for `flow-ucd-shell.md` traps; needs a capture during the next webinar campaign [unconfirmed].
