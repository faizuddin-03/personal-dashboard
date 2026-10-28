# EAINT-11925 — QA Team test script study (2026-10-27)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-11925 - [eAuto-Insurance] To Display Campaign Popups on Homepage & Insurance Module Dashboard and Display Banner on Insurance Listing for Merdeka 2026.md` (text copy taken 27/10/2026, 8:31:01 pm). Cell text only; formatting, colours and images are not in the copy.
2. **Ticket folders:** `_reference/tickets/EAINT-11925/` and `_reference/tickets/Studying/EAINT-11925/` held no files before this study. No SRD, Jira text or evidence was available.
3. **lib/ticketStudies.ts:** no entry for EAINT-11925.
4. **knowledge/:** `flow-ucd-shell.md` (lines 43-138), `business-rules-from-test-scenarios.md` §7 (lines 518-547), `cr-test-scenario-catalogue.md` (rows 116, 363), `flow-insurance-purchase.md` (lines 55, 768), `README.md`.
5. **Not read:** the original .xlsx (no images, colours or comments); the Jira ticket; the SRD.

## 1. Header

1. **Ticket:** EAINT-11925.
2. **Module / portal:** eAuto **UCD portal** — Homepage, **Insurance module** page, **Insurance Transaction Listing**.
3. **Workbook:** "EAINT-11925 - [eAuto-Insurance] To Display Campaign Popups on Homepage & Insurance Module Dashboard and Display Banner on Insurance Listing for Merdeka 2026.xlsx", library "eAuto - CR Test Scenarios", modified 17/07/2026, 5:17:12 pm.
4. **Sheets:**
   1. **"EAINT-11925"** — the executed sheet. **15 scenarios** (EAINT11925_TS1 to TS15).
   2. **"Sheet2"** — a longer **30-scenario** version (TS1 to TS30), **never executed**.
5. **Results (sheet EAINT-11925):** **15 Pass, 0 Fail, 0 Pending.** Every row R4-R18 has "Pass" in Test Result. The progress block (R9) holds a typed "15" for Pass and "15" for TOTAL, completion "1" (100%).
6. **Results (Sheet2):** all 30 rows "Pending", QA column blank. Progress block (R30) holds a typed "30" for Pending and "30" for TOTAL.
7. **Tester:** QA column "Maisarah" on all 15 rows (team QA engineer).
8. **Dates:** none written in the sheet. Only the file modified date (17/07/2026) is known.
9. **Environment:** **not stated** in the sheet. [unconfirmed] staging at the time.

## 2. What the ticket changed, as the TS shows it

1. A **Merdeka 2026 campaign popup** on the UCD **Homepage** after login.
2. The same **Merdeka 2026 popup** on the **Insurance module page**.
3. A **Merdeka 2026 banner** on the **Insurance Transaction Listing**.
4. All three are **bilingual**: English first, switching to Chinese every **7 seconds**.
5. The popup shows **once per login**, not again on return to Homepage / Insurance module.
6. The popup and banner **stop after 31 August** (sheet EAINT-11925, R18).

## 3. Scenarios (sheet EAINT-11925, executed)

Pre-condition shorthand: **Ins ✅/❌** = "Company Level Insurance Permission"; **CPU ✅/❌** = "Company Profile Update".

### A. Chrome, Main UCD

1. **TS1** (R4) — Homepage, Ins ✅ CPU ✅ — "Merdeka 2026 popup is displayed correctly as first popup in Homepage screen"; English first; 7 s interval. **Pass**.
2. **TS2** (R5) — Insurance Module Page, Ins ✅ CPU ✅ — same three expected lines as TS1 (still says "in Homepage screen"). **Pass**.
3. **TS3** (R6) — Insurance Transaction Listing — "Merdeka 2026 banner is displayed correctly in Insurance Transaction Listing"; "Merdeka 2026 banner in English is shown first by default"; 7 s interval. **Pass**.
4. **TS4** (R7) — Homepage, Ins ✅ **CPU ❌** — "Merdeka 2026 popup (1st) ➡️ Company Profile Update popup (2nd)". **Pass**.
5. **TS5** (R8) — Homepage — "Merdeka 2026 popup is not displayed whenever redirected back to Homepage". **Pass**.
6. **TS6** (R9) — Insurance Module Page — "only displayed once and not displayed when UCD redirects to Insurance Module page". **Pass**.
7. **TS7** (R10) — Homepage, **Ins ❌** CPU ✅ — "Merdeka 2026 is displayed correctly as first popup in Homepage screen"; "To ensure UCD is unable to access Insurance Module page". **Pass**.

### B. Firefox, Sub UCD

8. **TS8** (R11) — Homepage — "Web Socket (1st) ➡️ Merdeka 2026 popup (2nd)"; English first; 7 s. **Pass**.
9. **TS9** (R12) — Insurance Module Page — "Merdeka 2026 popup is displayed correctly as popup in Insurance module page"; English first; 7 s. **Pass**.
10. **TS10** (R13) — Insurance Transaction Listing — banner displayed; English first; 7 s. **Pass**.
11. **TS11** (R14) — Homepage, **CPU ❌** — "Web Socket (1st) ➡️ Merdeka 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)". **Pass**.
12. **TS12** (R15) — Homepage — not shown again on redirect to Homepage. **Pass**.
13. **TS13** (R16) — Insurance Module Page — not shown again on redirect to Insurance Module page. **Pass**.
14. **TS14** (R17) — Homepage, **Ins ❌** — "Web socket (1st) ➡️  Merdeka 2026 popup (2nd)"; "To ensure UCD is unable to access Insurance Module page". **Pass**.

### C. End date

15. **TS15** (R18) — Chrome, Main UCD, Homepage — "Merdeka popup is not displayed in Homepage screen after 31st August". **Pass**. Remark: "Ask dev to provide,  ⏎ date setting screenshot for prod".

### D. Sheet2 (draft, not executed)

1. Same scenarios split into **4 blocks**: Chrome Main UCD (TS1-7), Firefox Main UCD (TS8-14), Chrome Sub UCD (TS15-21), Firefox Sub UCD (TS22-28).
2. **TS29** (R32) — end date, same as executed TS15.
3. **TS30** (R33) — Firefox, Main UCD, "Insurance Module Page & Insurance Transaction Listing" — "1. Merdeka 2026 popup and banner is not displayed after 31st August". Scenario text mentions "after CNY Winner List popup is enable/hide".
4. **Copy-paste leftovers** from a CNY script: TS14 (R17) and TS21 (R24) say "To verify CNY 2026 popup is displayed" and "CNY 2026 is displayed correctly as … popup".

## 4. Business rules and system behaviour the TS reveals

1. **Bilingual switch** — "Merdeka 2026 popup in English is shown first by default" and "Interval between English and Chinese is 7 seconds" (sheet EAINT-11925, R4). Same for the banner: "Merdeka 2026 banner in English is shown first by default" (R6).
2. **Main UCD on Chrome: Merdeka is the first popup** — "Merdeka 2026 popup is displayed correctly as first popup in Homepage screen" (sheet EAINT-11925, R4).
3. **Sub UCD on Firefox: Web Socket popup comes first** — "Web Socket (1st) ➡️ Merdeka 2026 popup (2nd)" (sheet EAINT-11925, R11).
4. **Company Profile Update popup comes after Merdeka** — "Merdeka 2026 popup (1st) ➡️ Company Profile Update popup (2nd)" (sheet EAINT-11925, R7); "Web Socket (1st) ➡️ Merdeka 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)" (R14).
5. **Once per login** — "Merdeka 2026 popup is not displayed whenever redirected back to Homepage" (sheet EAINT-11925, R8, R9, R15, R16).
6. **No Insurance permission: popup still shows, module blocked** — "To ensure UCD is unable to access Insurance Module page" (sheet EAINT-11925, R10, R17).
7. **End date** — "Merdeka popup is not displayed in Homepage screen after 31st August" (sheet EAINT-11925, R18). The end date was **not tested by waiting**: remark "Ask dev to provide,  ⏎ date setting screenshot for prod" (R18). [unconfirmed] the end date is a config value the dev set per environment.
8. **Web Socket popup is browser-driven, not Sub-UCD-driven** [unconfirmed]. The executed sheet ties Firefox to Sub UCD, so the two cannot be told apart. Sheet2 (not executed) expects Web Socket first for **Firefox Main UCD** (R11) and Merdeka first for **Chrome Sub UCD** (R18), which points to Firefox as the trigger. This fits knowledge: `dialog-websocket` is the "Chrome-migration announcement" (`flow-ucd-shell.md` line 104).

### Against existing knowledge

1. **Agrees** with the popup chain order from prod code: "websocket reminder, East Coast, Insurance-cancellation/LKM-refund poster, Merdeka, profile update, e-Invoice reminder, CNY, Raya" (`flow-insurance-purchase.md` line 768).
2. **Agrees** with the "order is not fixed across campaigns" rule (`flow-ucd-shell.md` lines 57-60). The orders above hold for Merdeka 2026 only.
3. **Small quote mismatch:** `flow-ucd-shell.md` line 65 and `business-rules-from-test-scenarios.md` line 533 quote "Web socket (1st) ➡️ Merdeka 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)" against sheet EAINT-11925 row 14. That row reads "Web **Socket** (1st) ➡️ Merdeka 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)". The lowercase "Web socket" with a double space is **Sheet2 R14**. Meaning unchanged; citation wording off.
4. **Adds** what knowledge lacks: the Merdeka **end date (31 August)** and that the end-date check relied on a **dev screenshot**, not a live check.
5. **Banner vs localStorage flags:** the TS does not cover closing the banner. Knowledge says the `homemerdekacampaign` flag does **not** suppress the banner on the listing (`flow-insurance-purchase.md` line 55). No conflict.

## 5. Test data, environments, accounts, setup

1. **Accounts:** one **Main UCD** and one **Sub UCD** login. No login IDs or passwords in the sheet — **no credentials present**.
2. **Account setup needed:**
   1. Company with **Insurance permission ON** and profile **up to date** (most rows).
   2. Company with **Company Profile Update pending** (TS4, TS11).
   3. Company with **Insurance permission OFF** (TS7, TS14).
3. **Browsers:** Chrome (Main UCD) and Firefox (Sub UCD).
4. **Environment:** not stated.
5. **Date control:** end-date check via dev-supplied "date setting screenshot for prod" (R18).

## 6. Gaps or risks a regression should still cover

1. **Browser vs UCD type mixed up.** Executed sheet never ran Chrome Sub UCD or Firefox Main UCD. Sheet2's 30-row matrix covers this but stayed Pending.
2. **End date never seen live.** Pass rested on a dev screenshot. Today (2026-10-27) is after 31 August: a regression can confirm the **Merdeka popup and banner are gone** on Homepage, Insurance module and listing.
3. **Start date** not tested (popup absent before the campaign starts).
4. **No permission + listing:** no row checks the banner, or listing access, for a UCD without Insurance permission.
5. **Banner close / rotation loop** not tested: closing the banner, whether it comes back on refresh, Chinese → English loop.
6. **Other popups in the chain** not tested together: East Coast popup, e-Invoice reminder, Raya/CNY flags left on from earlier campaigns.
7. **Firefox popup changed since.** EAINT-12180 replaced the Firefox announcement ("Announcement 公告"). The "Web Socket (1st)" order here may no longer match production [unconfirmed].
8. **Copy-paste errors in expected results** a re-run should not copy:
   1. TS2 (R5) expects "first popup in Homepage screen" on the Insurance Module page.
   2. TS6 / TS13 (R9, R16) test the Insurance Module page but expect "not displayed whenever redirected back to Homepage".
   3. TS10 (R13) checks the banner but line 2 says "Merdeka 2026 popup in English is shown first by default".
   4. Sheet2 TS14 / TS21 (R17, R24) say "CNY 2026".
9. **Automation risk:** the Merdeka dialog shares a duplicated close-button id with Raya (`flow-ucd-shell.md` line 147). Any automation run during a future campaign must use the `:visible`-filtered `dismissBanners()`.

## Knowledge candidates

1. **Merdeka 2026 end date.** "Merdeka popup is not displayed in Homepage screen after 31st August" — `[from SharePoint TS EAINT-11925, sheet EAINT-11925, row 18]`. Target: `business-rules-from-test-scenarios.md` §7 and `flow-ucd-shell.md` § Campaign popup behaviour.
2. **Campaign end dates are verified via dev config screenshot**, not live. "Ask dev to provide,  ⏎ date setting screenshot for prod" — `[from SharePoint TS EAINT-11925, sheet EAINT-11925, row 18, Remarks]`. Target: `business-rules-from-test-scenarios.md` §7.
3. **Citation fix:** in `flow-ucd-shell.md` line 65 and `business-rules-from-test-scenarios.md` line 533, either change the quote to "Web Socket (1st) ➡️ Merdeka 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)" (sheet EAINT-11925, row 14) or change the citation to sheet Sheet2, row 14.
4. **Web Socket popup trigger is the browser (Firefox)**, not Sub UCD — `[unconfirmed]`, from comparing sheet EAINT-11925 R4/R11 with Sheet2 R11/R18. Target: `flow-ucd-shell.md` near the `dialog-websocket` row. Verify live before adding as fact.
5. **Merdeka popup also appears on the Insurance module page**, not only Homepage — "Merdeka 2026 popup is displayed correctly as popup in Insurance module page" `[from SharePoint TS EAINT-11925, sheet EAINT-11925, row 12]`. Target: `flow-ucd-shell.md` § Campaign popup behaviour.
