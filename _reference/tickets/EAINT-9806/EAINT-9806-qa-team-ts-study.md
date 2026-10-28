# EAINT-9806 — QA Team test script study (2026-10-28)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9806 - [eAuto] To Display Winner Announcement Popup for TNG Campaign CNY 2026 in Homepage.md` (text copy dated "28/10/2026, 1:21:16 am"; cell text only, no formatting or images).
2. **Ticket folders:** `_reference/tickets/EAINT-9806/` and `_reference/tickets/Studying/EAINT-9806/` held no files before this study.
3. **lib/ticketStudies.ts:** no entry for EAINT-9806.
4. **knowledge/:** `cr-test-scenario-catalogue.md` rows 113 (lines 124, 465); `flow-ucd-shell.md` lines 43-90 (popup chain, per-campaign orders); `flow-insurance-purchase.md` line 780 (popup code order); catalogue rows for related tickets EAINT-8564, EAINT-8637, EAINT-9559, EAINT-9560, EAINT-9892, EAINT-10053.
5. **Not read:** Jira ticket, SRD, and the original .xlsx (formatting, colours, dropdowns, images). Not available to this unattended run.

## 1. Header

1. **Ticket:** EAINT-9806 — "[eAuto] To Display Winner Announcement Popup for TNG Campaign CNY 2026 in Homepage".
2. **Module / portal:** UCD portal, **Homepage** (every row has Screen = "Homepage").
3. **Workbook:** "EAINT-9806 - [eAuto] To Display Winner Announcement Popup for TNG Campaign CNY 2026 in Homepage.xlsx", library "eAuto - CR Test Scenarios", modified 05/03/2026, 2:12:18 pm.
4. **Sheets:** one — "EAINT-9806".
5. **Scenarios:** **20** (EAINT9806_TS1 to EAINT9806_TS20, rows R4-R23).
6. **Results:** all 20 rows "**Pending**". Progress block (R2-R3): Pending "20", TOTAL "20". Pass/Fail are COUNTIF formulas; the cached values are not in the text copy. Pending is a typed "20", not a formula.
7. **Tester:** QA column = "Maisarah" on every row. **Dates:** none written in the sheet; only the file modified date (05/03/2026).
8. **Columns:** "TS No | Browser | Main UCD / Sub UCD | Screen | Pre-Condition | Test Scenarios | Expected Result | QA | Test Result | Remarks" (R3).

## 2. What the ticket changed, as the TS shows it

1. **New popup:** a "Winner Announcement Popup for TNG Campaign CNY 2026" on the UCD Homepage after login.
2. **Display window:** shown "from 6-7 March" (R4, TS1).
3. **Hari Raya popup paused:** the Hari Raya 2026 popup is hidden on 6-7 March while the winner popup shows (R4), then "displayed back correctly from 8-31 March" (R22, TS19).
4. **Bilingual:** English first, switches to Chinese, "Interval between English and Chinese is 7 seconds" (R6).
5. **Once per login:** not shown again when the UCD returns to Homepage (R8).
6. **Homepage only:** no row tests the Insurance Module dashboard, unlike the earlier TNG winner ticket EAINT-8564 [unconfirmed that the dashboard is out of scope; inferred from Screen column].

## 3. Scenarios

**A. Hari Raya popup hidden during winner window**

1. **TS1** (Chrome, Main UCD) — Hari Raya not shown while winner popup shows. Expected: "1. Hari Raya popup is not displayed in Homepage screen from 6-7 March ⏎ 2. Winner Announcement Popup for TNG Campaign CNY 2026 is displayed in homepage screen from 6-7 March".
2. **TS2** (Firefox, Sub UCD) — same as TS1.

**B. Chrome — winner popup is first**

1. **TS3** (Main UCD; Insurance ✅, Profile ✅) — "displayed correctly as first popup"; English first; 7-second interval.
2. **TS4** (Main UCD; Insurance ✅, Profile ❌) — order "Winner Announcement Popup for TNG Campaign CNY 2026 (1st) ➡️ Company Profile Update popup (2nd)"; English first; 7 s.
3. **TS5** (Main UCD) — shown once; "not displayed whenever redirected back to Homepage".
4. **TS6** (Main UCD; Insurance ❌) — first popup; "To ensure UCD is unable to access Insurance Module page".
5. **TS11-TS14** (Sub UCD) — same four checks as TS3-TS6.

**C. Firefox — winner popup is second, after Web Socket**

1. **TS7** (Main UCD; Insurance ✅, Profile ✅) — "Web Socket (1st) ➡️ Winner Announcement Popup for TNG Campaign CNY 2026 (2nd)"; English first; 7 s.
2. **TS8** (Main UCD; Profile ❌) — "Web socket (1st) ➡️ Winner Announcement Popup for TNG Campaign CNY 2026 (2nd) ➡️ Company Profile Update popup (3rd)".
3. **TS9** (Main UCD) — shown once; not on return to Homepage.
4. **TS10** (Main UCD; Insurance ❌) — second after Web socket; no Insurance Module access.
5. **TS15-TS18** (Sub UCD) — same four checks as TS7-TS10.

**D. Hari Raya popup returns after winner popup ends**

1. **TS19** (Chrome, Sub UCD) — "1. Hari Raya 2026 popup is displayed back correctly from 8-31 March in Insurance Transaction Listing ⏎ 2. CNY Winner List 2026 popup is not displayed"; English first; 7 s.
2. **TS20** (Firefox, Main UCD) — same as TS19.

## 4. Business rules and system behaviour the TS reveals

1. **Winner window 6-7 March, Hari Raya paused:** "Hari Raya popup is not displayed in Homepage screen from 6-7 March" (sheet EAINT-9806, R4).
2. **Hari Raya resumes 8-31 March:** "Hari Raya 2026 popup is displayed back correctly from 8-31 March in Insurance Transaction Listing" (sheet EAINT-9806, R22).
3. **Chrome order — winner popup first:** "Winner Announcement Popup for TNG Campaign CNY 2026 (1st) ➡️ Company Profile Update popup (2nd)" (sheet EAINT-9806, R7).
4. **Firefox order — Web Socket first:** "Web socket (1st) ➡️ Winner Announcement Popup for TNG Campaign CNY 2026 (2nd) ➡️ Company Profile Update popup (3rd)" (sheet EAINT-9806, R11).
5. **Browser decides the Web Socket popup:** Chrome rows never list a Web Socket popup; Firefox rows always do (R6-R9 vs R10-R13). [unconfirmed] This fits Firefox 36 still using the Java applet and being nudged to the WebSocket reader (`knowledge/flow-platform.md` line 119).
6. **Bilingual timing:** "Interval between English and Chinese is 7 seconds" (sheet EAINT-9806, R6).
7. **Once per login:** "Winner Announcement Popup for TNG Campaign CNY 2026 popup is not displayed whenever redirected back to Homepage" (sheet EAINT-9806, R8).
8. **No insurance permission still sees the popup:** with "Company Level Insurance Permission ❌" the popup is "displayed correctly as first popup" and "To ensure UCD is unable to access Insurance Module page" (sheet EAINT-9806, R9).
9. **Main and Sub UCD behave the same:** TS11-TS18 (Sub UCD) repeat TS3-TS10 (Main UCD) with identical expected results.

**Where this differs from knowledge/:**

1. **EAINT-8564 (2025 TNG winner popup)** said the winners popup "should be the last popup" (`flow-ucd-shell.md` line 73). EAINT-9806 puts it **first** on Chrome and **second** on Firefox. Not a conflict — popup order is per campaign (`flow-ucd-shell.md` lines 57-60).
2. **EAINT-10053** title says "To Display Campaign Popup on Homepage for Hari Raya 2026 from 6 to 7 March 2026" (`cr-test-scenario-catalogue.md` line 357). EAINT-9806 says Hari Raya is **not** shown 6-7 March (R4). [unconfirmed] Which ticket deployed last, or whether 10053 replaced this window, is not recorded.
3. **Code order on prod** lists "websocket reminder, East Coast, … Merdeka, profile update, e-Invoice reminder, CNY, Raya" (`flow-insurance-purchase.md` line 780). It has no TNG winner dialog, so the winner popup code was removed after the campaign [unconfirmed].

**Sheet errors seen (copy-paste):**

1. **TS8 and TS16** expect "Hari Raya 2026 popup in English is shown first by default" in a winner-popup scenario (R11, R19). [unconfirmed] Likely should read the winner popup.
2. **TS19 and TS20** have Screen "Homepage" but expect the popup "in Insurance Transaction Listing" (R22, R23). They also say "English and Chinese" for Hari Raya, and number two points "2." [unconfirmed] Likely copied from the Hari Raya ticket.
3. **TS10** expected says only "CNY 2026 is displayed correctly as second popup" (R13).

## 5. Test data, environments, accounts, setup

1. **Browsers:** Chrome and Firefox (version not stated).
2. **Users:** Main UCD and Sub UCD. No login IDs, no company names. **No credentials present.**
3. **Pre-conditions** (two flags per row): "Company Level Insurance Permission ✅/❌" and "Company Profile Update ✅/❌". ❌ on Profile Update makes the Company Profile Update popup appear.
4. **Environment:** not named in the sheet.
5. **Dates:** the TS needs the system date (or campaign config) inside 6-7 March and then 8-31 March. How the tester moved between windows is not written.

## 6. Gaps or risks a regression should still cover

1. **No Pass/Fail recorded** — every row is "Pending"; the file shows no evidence the TS was executed.
2. **Window edges:** no row checks 5 March (before) or the 7→8 March switch at midnight.
3. **Close button:** no row checks closing the popup, or the duplicate `#dialog-campaign-close-btn` trap (`flow-ucd-shell.md` lines 323-325).
4. **Other popups:** East Coast, e-Invoice reminder and the CNY campaign popup are not in any order row.
5. **Browser gaps:** TS1/TS2 cover only Chrome-Main and Firefox-Sub; TS19/TS20 cover only Chrome-Sub and Firefox-Main.
6. **Removal check:** no row confirms the winner popup is gone after 7 March other than TS19-TS20's "CNY Winner List 2026 popup is not displayed".
7. **Insurance dashboard:** not tested; EAINT-8564 showed the winner popup there too.
8. **Content:** no check of winner names, image, or the Chinese text itself.

## Knowledge candidates

1. **TNG CNY 2026 winner popup window** — "Hari Raya popup is not displayed in Homepage screen from 6-7 March" and winner popup "is displayed in homepage screen from 6-7 March". Source: SharePoint TS #113 EAINT-9806, sheet EAINT-9806, row 4. Target: `flow-ucd-shell.md` campaign examples.
2. **Per-campaign order example #7** — Chrome: "Winner Announcement Popup for TNG Campaign CNY 2026 (1st) ➡️ Company Profile Update popup (2nd)" (row 7); Firefox: "Web socket (1st) ➡️ Winner Announcement Popup for TNG Campaign CNY 2026 (2nd) ➡️ Company Profile Update popup (3rd)" (row 11). Source: SharePoint TS #113 EAINT-9806. Target: `flow-ucd-shell.md` lines 61-73 list.
3. **Web Socket popup is Firefox-only in campaign TS** — Chrome rows omit it, Firefox rows list it first. Source: SharePoint TS #113 EAINT-9806, rows 6-13. [unconfirmed] mechanism. Target: `flow-ucd-shell.md`.
4. **Campaign popups show without insurance permission** — popup "displayed correctly as first popup" with "Company Level Insurance Permission ❌" (row 9). Source: SharePoint TS #113 EAINT-9806. Target: `flow-ucd-shell.md` "Campaign popup behaviour".
5. **Date conflict to resolve** — EAINT-9806 hides Hari Raya 6-7 March (row 4); EAINT-10053 title shows Hari Raya "from 6 to 7 March 2026". Needs Jira check before any knowledge entry. Target: `cr-test-scenario-catalogue.md` note.
