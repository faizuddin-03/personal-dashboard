# EAINT-10053 — QA Team test script study (2026-10-28)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-10053- [eAuto-Insurance] To Display Campaign Popup on Homepage for Hari Raya 2026 from 6 to 7 March 2026.md` (text copy dated "28/10/2026, 1:22:27 am"; "Cell text only, row by row; formatting and images are not kept.").
2. **Ticket folders:** `_reference/tickets/EAINT-10053/` and `_reference/tickets/Studying/EAINT-10053/` held no files before this study.
3. **lib/ticketStudies.ts:** no entry for EAINT-10053.
4. **knowledge/:** `cr-test-scenario-catalogue.md` line 114 (catalogue row 005) and line 357 (file path); `flow-ucd-shell.md` lines 43-128 (dialog chain, per-campaign orders, localStorage flags) and lines 323-332 (duplicate close-button trap); `business-rules-from-test-scenarios.md` lines 519-535.
5. **Other repo files citing the ticket:** `lib/eautoFlows/modules/ucd-portal.ts` lines 273, 283, 286, 299; `_reference/tickets/EAINT-9806/EAINT-9806-qa-team-ts-study.md` lines 74, 108 (date conflict).
6. **Not read:** Jira ticket, SRD, and the original .xlsx (formatting, colours, dropdowns, images, evidence). Not available to this unattended run.

## 1. Header

1. **Ticket:** EAINT-10053 — "[eAuto-Insurance] To Display Campaign Popup on Homepage for Hari Raya 2026 from 6 to 7 March 2026".
2. **Module / portal:** UCD portal, **Homepage** login popup chain. The **Screen** column is blank on every row; "Homepage" comes from the scenario text.
3. **Workbook:** "EAINT-10053- [eAuto-Insurance] To Display Campaign Popup on Homepage for Hari Raya 2026 from 6 to 7 March 2026.xlsx", library "eAuto - CR Test Scenarios", modified 05/03/2026, 1:07:18 pm. Catalogue editor: "Maisarah Nuraliyaa Binti Masrom" (`cr-test-scenario-catalogue.md` line 114).
4. **Sheets:** one — "EAINT-10053".
5. **Scenarios:** **16** rows (R4-R19). Ids EAINT10053_TS1 to EAINT10053_TS15, plus R19, which is **also labelled "EAINT10053_TS1"**. It is really TS16 (see §4 sheet errors).
6. **Results:** all 16 rows "**Pass**". Progress block (R1-R3): Pass "16", TOTAL "16", Completion % "1" (100%). Pass and TOTAL are typed numbers. Pending, In Progress and Fail are COUNTIF formulas; their cached values are not in the text copy.
7. **Tester:** QA column = "Maisarah" on every row. **Dates:** none in the sheet; only the file modified date (05/03/2026, one day before the 6 March start).
8. **Columns:** "TS No | Browser | Main UCD / Sub UCD | Screen | Pre-Condition | Test Scenarios | Expected Result | QA | Test Result | Remarks" (R3). Remarks is blank on every row.

## 2. What the ticket changed, as the TS shows it

1. **New popup:** a **Hari Raya 2026 campaign popup** on the UCD Homepage after successful login.
2. **Display window:** "from 6 to 7 March 2026" (workbook title only; no row tests a date).
3. **Bilingual:** English first, then Chinese, "Interval between English and Chinese is 7 seconds" (R4).
4. **Popup order:** first on Chrome; second on Firefox, after the Web Socket popup; always before the Company Profile Update popup (R5, R8, R9).
5. **Once per login:** not shown again when the UCD is sent back to Homepage (R6).
6. **No insurance permission:** popup still shows; Insurance Module stays blocked (R7).
7. **Title says "eAuto-Insurance"** but no row tests the Insurance Module dashboard or Insurance Transaction Listing.

## 3. Scenarios

**A. Main UCD — Chrome (Hari Raya popup first)**

1. **TS1** (Insurance ✅, Profile ✅) — popup on login. Expected: "1. Hari Raya 2026 popup is displayed correctly as first popup in Homepage screen ⏎ 2. Hari Raya 2026 popup in English is shown first by default ⏎ 3. Interval between English and Chinese is 7 seconds".
2. **TS2** (Insurance ✅, Profile ❌) — order "Hari Raya 2026 popup (1st) ➡️ Company Profile Update popup (2nd)"; English first; 7 s.
3. **TS3** (Insurance ✅, Profile ✅) — shown once. Expected: "1. Hari Raya 2026 popup is not displayed whenever redirected back to Homepage".
4. **TS4** (Insurance ❌, Profile ✅) — "1. Hari Raya 2026 is displayed correctly as first popup in Homepage screen ⏎ 2. To ensure UCD is unable to access Insurance Module page".

**B. Main UCD — Firefox (Hari Raya popup second, after Web Socket)**

1. **TS5** (Insurance ✅, Profile ✅) — "Web Socket (1st) ➡️ Hari Raya 2026 popup (2nd)"; English first; 7 s.
2. **TS6** (Insurance ✅, Profile ❌) — "Web socket (1st) ➡️  Hari Raya 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)"; English first; 7 s.
3. **TS7** (Insurance ✅, Profile ✅) — shown once; not on return to Homepage.
4. **TS8** (Insurance ❌, Profile ✅) — "1. CNY 2026 is displayed correctly as second popup in Homepage screen ⏎ Web socket (1st) ➡️  Hari Raya 2026 popup (2nd) ⏎ 2. To ensure UCD is unable to access Insurance Module page". Mixes CNY and Hari Raya (copy-paste).

**C. Sub UCD — Chrome**

1. **TS9-TS12** — same four checks and expected results as TS1-TS4.

**D. Sub UCD — Firefox**

1. **TS13-TS15** — same as TS5-TS7.
2. **R19 ("EAINT10053_TS1", really TS16)** (Insurance ❌, Profile ✅) — "Web socket (1st) ➡️  Hari Raya 2026 popup (2nd)"; "To ensure UCD is unable to access Insurance Module page". Correct Hari Raya wording, unlike TS8.

## 4. Business rules and system behaviour the TS reveals

1. **English first, 7-second switch:** "Hari Raya 2026 popup in English is shown first by default" and "Interval between English and Chinese is 7 seconds" (sheet EAINT-10053, R4).
2. **Chrome order:** "Hari Raya 2026 popup (1st) ➡️ Company Profile Update popup (2nd)" (sheet EAINT-10053, R5).
3. **Firefox order:** "Web socket (1st) ➡️  Hari Raya 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)" (sheet EAINT-10053, R9).
4. **Web Socket popup only on Firefox rows:** Chrome rows (R4-R7, R12-R15) never list it; Firefox rows (R8-R11, R16-R19) always list it first. Same pattern as EAINT-9806. [unconfirmed] mechanism.
5. **Once per login:** "Hari Raya 2026 popup is not displayed whenever redirected back to Homepage" (sheet EAINT-10053, R6).
6. **No insurance permission still sees the popup:** with "Company Level Insurance Permission ❌", "Hari Raya 2026 is displayed correctly as first popup in Homepage screen" and "To ensure UCD is unable to access Insurance Module page" (sheet EAINT-10053, R7).
7. **Company Profile Update ❌ adds a popup:** the Profile ❌ rows add "Company Profile Update popup" as the last item in the chain (R5, R9, R13, R17).
8. **Main and Sub UCD behave the same:** TS9-TS16 repeat TS1-TS8 with the same expected results (except the TS8 CNY slip).

**Where this matches or differs from knowledge/:**

1. **Matches** `flow-ucd-shell.md` lines 64, 85-87 and `business-rules-from-test-scenarios.md` lines 519-532. Those lines already cite this TS (rows 4, 6, 7, 8). Row numbers there match the text copy.
2. **Order vs code capture:** the 2026-08-18 capture array puts `"#profile-updates-dialog"` before `"#dialog-raya-campaign"` (`flow-ucd-shell.md` lines 51-54). This TS puts Hari Raya **before** Company Profile Update. Not a conflict — `flow-ucd-shell.md` lines 57-60 say order is per campaign.
3. **Date conflict with EAINT-9806:** this title says Hari Raya shows "from 6 to 7 March 2026". The EAINT-9806 TS (same tester, modified 05/03/2026, 2:12:18 pm, about one hour later) says "Hari Raya popup is not displayed in Homepage screen from 6-7 March" and "Hari Raya 2026 popup is displayed back correctly from 8-31 March in Insurance Transaction Listing" (`EAINT-9806-qa-team-ts-study.md` lines 61-62). [unconfirmed] Which window went live, or whether one ticket replaced the other, needs a Jira or SRD check.
4. **Not in knowledge yet:** the Firefox order with Profile ❌ for Hari Raya (R9) and the no-permission Firefox case (R11/R19).

**Sheet errors seen:**

1. **R19 labelled "EAINT10053_TS1"** — duplicate id; should be TS16.
2. **TS8 (R11)** — test scenario says "To verify CNY 2026 popup is displayed  ⏎ correctly" and expected "CNY 2026 is displayed correctly as second popup", but the order line names Hari Raya. [unconfirmed] Copied from a CNY ticket (likely EAINT-9559).
3. **Screen column blank** on all 16 rows.

## 5. Test data, environments, accounts, setup

1. **Browsers:** Chrome and Firefox (versions not stated).
2. **Users:** Main UCD and Sub UCD. No login IDs or company names. **No credentials present.**
3. **Pre-conditions** (two flags per row): "Company Level Insurance Permission ✅/❌" and "Company Profile Update ✅/❌".
4. **Environment:** not named in the sheet.
5. **Dates:** the window is 6-7 March 2026, but the file was last saved 5 March. How the tester showed the popup before the window (config, date change, or test flag) is not written.

## 6. Gaps or risks a regression should still cover

1. **Window edges:** no row checks before 6 March, after 7 March, or the midnight switch-off.
2. **Date conflict:** resolve the 6-7 March vs 8-31 March question against EAINT-9806 before reusing either TS.
3. **Close button:** no row closes the popup or checks the next one opens. Known trap: duplicate `#dialog-campaign-close-btn`, where Raya's hidden copy masks a visible one (`flow-ucd-shell.md` lines 323-332).
4. **Other popups:** East Coast, e-Invoice reminder, CNY and Merdeka are not in any order row.
5. **Insurance pages:** title says "eAuto-Insurance", but no row tests the Insurance dashboard or listing. EAINT-9806 TS19 expects Hari Raya "in Insurance Transaction Listing".
6. **Language check gaps:** the no-permission rows (TS4, TS8, TS12, TS16) skip the English-first and 7-second checks.
7. **Once-per-login scope:** only "redirected back to Homepage" is tested; no browser back, refresh or logout/login.
8. **Content:** no check of the image, text, or Chinese wording.
9. **Evidence:** all rows Pass; the text copy holds no screenshots or remarks to confirm it.

## Knowledge candidates

1. **Hari Raya 2026 Firefox order with Profile pending** — "Web socket (1st) ➡️  Hari Raya 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)". Source: SharePoint TS #005 EAINT-10053, sheet EAINT-10053, row 9. Target: `flow-ucd-shell.md` per-campaign order list (lines 61-73).
2. **Hari Raya 2026 Chrome order** — "Hari Raya 2026 popup (1st) ➡️ Company Profile Update popup (2nd)". Source: SharePoint TS #005 EAINT-10053, sheet EAINT-10053, row 5. Target: `flow-ucd-shell.md` line 71 (currently cites only EAINT-9560).
3. **Web Socket popup appears only on Firefox rows** in campaign TS. Source: SharePoint TS #005 EAINT-10053, rows 8-11 and 16-19 vs rows 4-7 and 12-15. [unconfirmed] mechanism. Target: `flow-ucd-shell.md`.
4. **Date conflict to resolve** — EAINT-10053 title: "from 6 to 7 March 2026"; EAINT-9806 row 4: "Hari Raya popup is not displayed in Homepage screen from 6-7 March". Needs Jira/SRD check. Target: `cr-test-scenario-catalogue.md` note on row 005.
5. **Catalogue correction** — row 005 says "EAINT-10053:16" ids; the sheet has 15 unique ids plus a duplicate "EAINT10053_TS1" at row 19. Source: sheet EAINT-10053, R4 and R19. Target: `cr-test-scenario-catalogue.md` line 114.
