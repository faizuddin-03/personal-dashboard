# EAINT-9892 — QA Team test script study (2026-10-28)

## Sources read

1. **Text copy of the workbook:** `_reference/sharepoint/qa-team-ts/EAINT-9892 - ⚪[eAuto] To Display Winner Announcement Popup for TNG Campaign Hari Raya 2026 in Homepage.md` (captured "28/10/2026, 1:06:25 am"; "Cell text only, row by row; formatting and images are not kept."). Images and cell colours in the xlsx were not seen.
2. **knowledge/cr-test-scenario-catalogue.md** rows 115 (lines 125, 467).
3. **knowledge/business-rules-from-test-scenarios.md** §7 (UCD homepage: popups, campaigns, banners).
4. **knowledge/flow-ucd-shell.md** (popup dialog chain).
5. **Not found:** `_reference/tickets/EAINT-9892/` (no prior files), `_reference/tickets/Studying/EAINT-9892/` (does not exist), `lib/ticketStudies.ts` (no EAINT-9892 entry). No SRD or Jira ticket text was read.

## 1. Header

1. **Ticket:** EAINT-9892.
2. **Title:** "To Display Winner Announcement Popup for TNG Campaign Hari Raya 2026 in Homepage" (workbook name).
3. **Module / portal:** UCD portal, **Homepage** only.
4. **Workbook:** "EAINT-9892 - ⚪[eAuto] To Display Winner Announcement Popup for TNG Campaign Hari Raya 2026 in Homepage.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 03/04/2026, 3:08:15 pm.
5. **Sheets:** one — "Sheet1".
6. **Scenarios:** **16** (EAINT9892_TS1 to EAINT9892_TS16, Sheet1 rows R5–R20).
7. **Results:** **16 Pass, 0 Fail**. Progress block (Sheet1 R3): Pass "16", TOTAL "16", Completion % "1" (100%). Pending / In Progress / Fail are COUNTIF formulas with no cached value in the text copy.
8. **Tester:** QA column reads "Maisarah" on every row.
9. **Dates:** none written in the sheet. Only the SharePoint modified date (03/04/2026).
10. **Environment:** not named in the sheet.

## 2. What the ticket changed, as the TS shows it

1. A new **"Winner Announcement Popup for TNG Campaign Hari Raya 2026"** appears on the UCD **Homepage** after login (Sheet1 R5, Test Scenarios: "To verify Winner Announcement Popup for TNG Campaign Hari Raya 2026 is displayed correctly in eAuto Homepage upon successful login").
2. The popup is **bilingual** (English then Chinese, switching every 7 seconds) and shows **once per login** (Sheet1 R5, R7).
3. The Insurance module page is **not** in scope — only the Homepage is tested. [unconfirmed] that the popup is Homepage-only; the title says "in Homepage".

## 3. Scenarios

Columns (Sheet1 R4): "TS No | Browser | Main UCD / Sub UCD | Screen | Pre-Condition | Test Scenarios | Expected Result | QA | Test Result | Remarks". "Screen" and "Remarks" are blank on every row.

The 16 rows are one block of 4 scenarios, repeated for **Chrome / Firefox** × **Main UCD / Sub UCD**.

### A. Chrome — Main UCD

1. **TS1** (R5) — Insurance ✅, Profile Update ✅ — popup on login. Expected: "displayed correctly as first popup in Homepage screen", "in English is shown first by default", "Interval between English and Chinese is 7 seconds". Pass.
2. **TS2** (R6) — Insurance ✅, Profile Update ❌ — order with Company Profile Update. Expected: "Winner Announcement Popup for TNG Campaign Hari Raya 2026 (1st) ➡️ Company Profile Update popup (2nd)", English first, 7 seconds. Pass.
3. **TS3** (R7) — Insurance ✅, Profile Update ✅ — shown once. Expected: "popup is not displayed whenever redirected back to Homepage". Pass.
4. **TS4** (R8) — Insurance ❌, Profile Update ✅ — no Insurance permission. Expected: "displayed correctly as first popup in Homepage screen", "To ensure UCD is unable to access Insurance Module page". Pass.

### B. Firefox — Main UCD

1. **TS5** (R9) — Insurance ✅, Profile Update ✅. Expected: "displayed correctly as second popup in Homepage screen ⏎ Web Socket (1st) ➡️ Winner Announcement Popup for TNG Campaign Hari Raya 2026 (2nd)", English first, 7 seconds. Pass.
2. **TS6** (R10) — Insurance ✅, Profile Update ❌. Expected: "Web socket (1st) ➡️ Winner Announcement Popup for TNG Campaign Hari Raya 2026 (2nd) ➡️ Company Profile Update popup (3rd)", English first, 7 seconds. Pass.
3. **TS7** (R11) — shown once. Expected: "is not displayed whenever redirected back to Homepage". Pass.
4. **TS8** (R12) — Insurance ❌. Expected: "Web socket (1st) ➡️  Winner Announcement Popup for TNG Campaign Hari Raya 2026 (2nd)", "To ensure UCD is unable to access Insurance Module page". Pass.

### C. Chrome — Sub UCD

1. **TS9** (R13) — same as TS1. Pass.
2. **TS10** (R14) — same as TS2 (popup 1st, Company Profile Update 2nd). Pass.
3. **TS11** (R15) — same as TS3. Pass.
4. **TS12** (R16) — same as TS4. Pass.

### D. Firefox — Sub UCD

1. **TS13** (R17) — same as TS5 (Web Socket 1st, popup 2nd). Pass.
2. **TS14** (R18) — same as TS6 (Web Socket → popup → Company Profile Update). Pass.
3. **TS15** (R19) — same as TS7. Pass.
4. **TS16** (R20) — same as TS8. Pass.

## 4. Business rules and system behaviour the TS reveals

1. **English first, 7-second switch:** "Winner Announcement Popup for TNG Campaign Hari Raya 2026 in English is shown first by default ⏎ 3. Interval between English and Chinese is 7 seconds" (Sheet1 R5, Expected Result). Matches the existing bilingual rule in business-rules-from-test-scenarios.md §7 item 1.
2. **Once per login:** "Winner Announcement Popup for TNG Campaign Hari Raya 2026 popup is not displayed whenever redirected back to Homepage" (Sheet1 R7). Matches §7 item 2.
3. **Shown without Insurance permission:** "Winner Announcement Popup for TNG Campaign Hari Raya 2026 is displayed correctly as first popup in Homepage screen ⏎ 2. To ensure UCD is unable to access Insurance Module page" (Sheet1 R8). Matches §7 item 3.
4. **Order on Chrome — popup first:** "is displayed correctly as first popup in Homepage screen" (Sheet1 R5); with a pending profile update "Winner Announcement Popup for TNG Campaign Hari Raya 2026 (1st) ➡️ Company Profile Update popup (2nd)" (Sheet1 R6).
5. **Order on Firefox — Web Socket first:** "Web Socket (1st) ➡️ Winner Announcement Popup for TNG Campaign Hari Raya 2026 (2nd)" (Sheet1 R9); "Web socket (1st) ➡️ Winner Announcement Popup for TNG Campaign Hari Raya 2026 (2nd) ➡️ Company Profile Update popup (3rd)" (Sheet1 R10).
6. **Contradiction with EAINT-8564:** the earlier TNG winners popup "should be the last popup" (EAINT-8564!R8, per business-rules §7 item 4.5). Here the winner popup comes **before** Company Profile Update (Sheet1 R6, R10). Not a conflict under the standing rule that popup order is per campaign (business-rules §7 item 4.6, "[from Faizuddin, 2026-10-16]").
7. **Contradiction with EAINT-9894:** knowledge says "Chrome websocket popup is the first popup after login" (business-rules §7 item 9, EAINT-9894!R4). This TS puts the Web Socket popup first on **Firefox only**; on Chrome the winner popup is "first popup" (Sheet1 R5, R13). [unconfirmed] The Web Socket popup may only show when the reader service is missing or out of date, so a Chrome tester with the service installed would not see it.
8. **Main and Sub UCD behave the same:** TS9–TS16 expected results repeat TS1–TS8 word for word apart from small wording ("popup" added/removed).

## 5. Test data, environments, accounts, setup

1. **Accounts:** a Main UCD and a Sub UCD (column "Main UCD / Sub UCD"). No logins named. **No credentials present.**
2. **Account setup (Pre-Condition column):** "Company Level Insurance Permission ✅ / ❌" and "Company Profile Update ✅ / ❌" (Sheet1 R5–R20). ❌ on Company Profile Update means a pending profile update, so the Company Profile Update popup appears (Sheet1 R6).
3. **Browsers:** Chrome and Firefox. No Edge.
4. **Environment:** not named.
5. **Campaign dates:** not written. [unconfirmed] the popup has a start and end date set on the server.

## 6. Gaps or risks a regression should still cover

1. **No date window tests:** no scenario checks the popup is hidden before its start date or after its end date.
2. **No content check:** no row checks winner names, image, wording or the Chinese version itself — only order, language order and timing.
3. **No close-button / next-dialog check:** the dialog chain opens the next popup on close (flow-ucd-shell.md); not tested directly.
4. **Insurance module dashboard not covered:** earlier campaign tickets (EAINT-9560, EAINT-11925) also tested the Insurance module page; this one does not.
5. **Other popups not combined:** no row with East Coast, CNY, Hari Raya campaign popup or e-Invoice reminder active at the same time. EAINT-9806 suppressed the Hari Raya popup while a winner popup showed (catalogue row 113); this TS does not say whether the Hari Raya 2026 campaign popup (EAINT-9560) was still live or suppressed.
6. **Chrome Web Socket case:** no Chrome row where the Web Socket popup shows (reader missing), so the Chrome order with Web Socket present is untested.
7. **Edge not tested.**
8. **Once-per-login only checked by returning to Homepage:** no logout/login-again or new-tab check.

## Knowledge candidates

1. **TNG Hari Raya 2026 winner popup order (per-campaign example)** for business-rules-from-test-scenarios.md §7 item 4 and flow-ucd-shell.md "Examples of per-campaign orders": "Web socket (1st) ➡️ Winner Announcement Popup for TNG Campaign Hari Raya 2026 (2nd) ➡️ Company Profile Update popup (3rd)" `[from SharePoint TS #115 EAINT-9892, sheet Sheet1, row 10]`; on Chrome "Winner Announcement Popup for TNG Campaign Hari Raya 2026 (1st) ➡️ Company Profile Update popup (2nd)" `[from SharePoint TS #115 EAINT-9892, sheet Sheet1, row 6]`.
2. **Note beside the EAINT-8564 "last popup" line:** later TNG winner popups (EAINT-9892) come before Company Profile Update, so "last popup" was true only for EAINT-8564 `[from SharePoint TS #115 EAINT-9892, sheet Sheet1, rows 6, 10]`.
3. **Qualify business-rules §7 item 9** ("Chrome websocket popup is the first popup after login"): in EAINT-9892 the Web Socket popup is expected first on Firefox only; Chrome rows expect the campaign popup "as first popup in Homepage screen" `[from SharePoint TS #115 EAINT-9892, sheet Sheet1, rows 5, 9]`. Cause [unconfirmed].
4. **Main UCD and Sub UCD see the same campaign popup behaviour** `[from SharePoint TS #115 EAINT-9892, sheet Sheet1, rows 5-20]`.
5. **Catalogue row 115 fix:** the summary cites "Sheet1!R5-R12" for 16 TS; the 16 TS span **Sheet1!R5-R20**, all Pass, QA "Maisarah" `[from SharePoint TS #115 EAINT-9892, sheet Sheet1, rows 3-20]`.
