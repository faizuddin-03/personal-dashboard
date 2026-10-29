# EAINT-9560 — QA Team test script study (2026-10-28)

## Sources read

1. **Text copy of the workbook:** `_reference/sharepoint/qa-team-ts/EAINT-9560 - [eAuto-Insurance] To Display Campaign Popups on Homepage & Insurance Module Dashboard and Display Banner on Insurance Listing for Hari Raya 2026.md` (exported 28/10/2026, 1:23:48 am). Cell text only; formatting, images and formula results are not kept.
2. **`knowledge/flow-ucd-shell.md`** — popup chain, campaign popup rules, localStorage flags.
3. **`knowledge/business-rules-from-test-scenarios.md`** §7 — UCD homepage popups, campaigns, banners.
4. **`knowledge/cr-test-scenario-catalogue.md`** rows 100, 101, 113, 024 — sister campaign TS (CNY 2026, Hari Raya 2026, TNG CNY winner, Merdeka 2026).
5. **`knowledge/production-regression-scope.md`** line 1018.
6. **Not found:** `_reference/tickets/EAINT-9560/` held no earlier files; `_reference/tickets/Studying/EAINT-9560/` does not exist; `lib/ticketStudies.ts` has no EAINT-9560 entry. No SRD, Jira ticket text or HTML capture was read.

## 1. Header

1. **Ticket:** EAINT-9560.
2. **Module / portal:** eAuto **UCD portal** — Homepage, Insurance Module page (dashboard), Insurance Transaction Listing.
3. **Workbook:** "EAINT-9560 - [eAuto-Insurance] To Display Campaign Popups on Homepage & Insurance Module Dashboard and Display Banner on Insurance Listing for Hari Raya 2026.xlsx" — SharePoint library "eAuto - CR Test Scenarios", modified 03/03/2026, 9:18:29 am.
4. **Sheets:** one — "EAINT-9560". Banner row R2: "HARI RAYA 2026 POPUP & BANNER".
5. **Columns (R3):** "TS No | Browser | Main UCD / Sub UCD | Screen | Pre-Condition | Test Scenarios | Expected Result | QA | Test Result | Remarks".
6. **Scenarios:** **30** (EAINT9560_TS1 to EAINT9560_TS30, rows R4–R33).
7. **Results (column I, counted from the rows):** **28 Pass, 2 Pending, 0 Fail, 0 In Progress.**
8. **Progress block (R2–R3, cols P–U):** "Pending" = "2", "Pass" = "28", "TOTAL" = "30", "Completion %" = "0.9333333333333333". "In Progress" and "Fail" are formulas ("COUNTIF(I:I,Q2)", "COUNTIF(I:I,S2)"); their values are not in the text copy.
9. **Tester:** one QA tester, same name on every row (QA column).
10. **Dates in the sheet:** none. Only date-like content is in TS29/TS30 expected results ("6-7 March", "8-31 March").
11. **Deployment:** "| EAINT-9560 | 20260225 | Hari Raya campaign popups | Yes |" `[knowledge/production-regression-scope.md:1018]`.

## 2. What the ticket changed (as the TS shows it)

1. **New Hari Raya 2026 popup** on the UCD **Homepage** after login.
2. **Same popup** on the **Insurance Module page**.
3. **New Hari Raya 2026 banner** on the **Insurance Transaction Listing**.
4. Popup and banner are **bilingual**: English first, switching to Chinese every **7 seconds**.
5. Popup is shown **once**; not again on return to Homepage or Insurance Module page.
6. **Interplay with the TNG CNY Winner List 2026 popup:** Hari Raya popup hidden 6–7 March, back 8–31 March (TS29/TS30, both Pending, "To be included in CNY Winner List").

## 3. Scenarios

Pre-condition shorthand: **Ins** = "Company Level Insurance Permission", **CPU** = "Company Profile Update"; ✅ / ❌ as in the sheet.

### A. Main UCD — Chrome (TS1–TS7)

1. **TS1** — Homepage, Ins ✅ CPU ✅. Expected "Hari Raya 2026 popup is displayed correctly as first popup in Homepage screen", English first, "Interval between English and Chinese is 7 seconds". **Pass**.
2. **TS2** — Insurance Module Page, Ins ✅ CPU ✅. Popup on Insurance Module page; English first; 7 s. **Pass**.
3. **TS3** — Insurance Transaction Listing, Ins ✅ CPU ✅. "Hari Raya 2026 banner is displayed correctly in Insurance Transaction Listing"; English first; 7 s. **Pass**.
4. **TS4** — Homepage, Ins ✅ CPU ❌. "Hari Raya 2026 popup (1st) ➡️ Company Profile Update popup (2nd)". **Pass**.
5. **TS5** — Homepage. "Hari Raya 2026 popup is not displayed whenever redirected back to Homepage". **Pass**.
6. **TS6** — Insurance Module Page. Popup not shown again on redirect to Insurance Module page. **Pass**.
7. **TS7** — Homepage, Ins ❌ CPU ✅. Popup first; "To ensure UCD is unable to access Insurance Module page". **Pass**.

### B. Main UCD — Firefox (TS8–TS14)

1. **TS8** — Homepage. "Web Socket (1st) ➡️ Hari Raya 2026 popup (2nd)"; English first; 7 s. **Pass**.
2. **TS9** — Insurance Module Page. Popup; English first; 7 s. **Pass**.
3. **TS10** — Insurance Transaction Listing. Banner; English first; 7 s. **Pass**.
4. **TS11** — Homepage, CPU ❌. "Web socket (1st) ➡️  Hari Raya 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)". **Pass**.
5. **TS12** — Homepage. Not shown again on return to Homepage. **Pass**.
6. **TS13** — Insurance Module Page. Not shown again on redirect to Insurance Module page. **Pass**.
7. **TS14** — Homepage, Ins ❌. "Web socket (1st) ➡️  Hari Raya 2026 popup (2nd)"; no Insurance Module access. **Pass**.

### C. Sub UCD — Chrome (TS15–TS21)

1. **TS15** — Homepage. Popup first; English first; 7 s. **Pass**.
2. **TS16** — Insurance Module Page. "Hari Raya 2026 popup is displayed correctly as popup in Insurance module page". **Pass**.
3. **TS17** — Insurance Transaction Listing. Banner; English first; 7 s. **Pass**.
4. **TS18** — Homepage, CPU ❌. "Hari Raya 2026 popup (1st) ➡️ Company Profile Update popup (2nd)". **Pass**.
5. **TS19** — Homepage. Not shown again on return to Homepage. **Pass**.
6. **TS20** — Insurance Module Page. Not shown again. **Pass**.
7. **TS21** — Homepage, Ins ❌. Popup first; no Insurance Module access. **Pass**.

### D. Sub UCD — Firefox (TS22–TS28)

1. **TS22** — Homepage. "Web Socket (1st) ➡️ Hari Raya 2026 popup (2nd)". **Pass**.
2. **TS23** — Insurance Module Page. Popup; English first; 7 s. **Pass**.
3. **TS24** — Insurance Transaction Listing. Banner; English first; 7 s. **Pass**.
4. **TS25** — Homepage, CPU ❌. "Web Socket (1st) ➡️ Hari Raya 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)". **Pass**.
5. **TS26** — Homepage. Not shown again on return to Homepage. **Pass**.
6. **TS27** — Insurance Module Page. Not shown again. **Pass**.
7. **TS28** — Homepage, Ins ❌. "Web socket (1st) ➡️  Hari Raya 2026 popup (2nd)"; no Insurance Module access. **Pass**.

### E. Date window vs CNY Winner List (TS29–TS30)

1. **TS29** — Chrome, Main UCD, Homepage. "1. Hari Raya popup is not displayed in Homepage screen from 6-7 March ⏎ 2. CNY Winner List 2026 popup is displayed in homepage screen from 6-7 March". **Pending** — Remarks "To be included in CNY Winner List".
2. **TS30** — Firefox, Main UCD, Homepage. "1. Hari Raya 2026 banner is displayed back correctly from 8-31 March in Insurance Transaction Listing ⏎ 2. CNY Winner List 2026 popup is not displayed". **Pending** — same remark.

## 4. Business rules and system behaviour

1. **Bilingual switch:** "Hari Raya 2026 popup in English is shown first by default" and "Interval between English and Chinese is 7 seconds" `[sheet EAINT-9560, row R4]`. Same wording for the banner `[sheet EAINT-9560, row R6]`.
2. **Chrome: campaign popup is first.** "Hari Raya 2026 popup is displayed correctly as first popup in Homepage screen" `[sheet EAINT-9560, row R4]`.
3. **Firefox: Web Socket popup comes before it.** "Web Socket (1st) ➡️ Hari Raya 2026 popup (2nd)" `[sheet EAINT-9560, row R11]`. So in March 2026 the Web Socket popup showed on **Firefox only** `[unconfirmed — inferred from Chrome rows R4/R7 vs Firefox rows R11/R14]`.
4. **Company Profile Update comes after the campaign popup.** Chrome: "Hari Raya 2026 popup (1st) ➡️ Company Profile Update popup (2nd)" `[sheet EAINT-9560, row R7]`. Firefox: "Web socket (1st) ➡️  Hari Raya 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)" `[sheet EAINT-9560, row R14]`.
5. **Once per login:** "Hari Raya 2026 popup is not displayed whenever redirected back to Homepage" `[sheet EAINT-9560, rows R8, R9]`.
6. **Popup also on the Insurance Module page:** "Hari Raya 2026 popup is displayed correctly as popup in Insurance module page" `[sheet EAINT-9560, row R19]`.
7. **No Insurance permission:** popup still shows; "To ensure UCD is unable to access Insurance Module page" `[sheet EAINT-9560, row R10]`.
8. **Main UCD and Sub UCD behave the same** — sections A/C and B/D carry the same expected results `[sheet EAINT-9560, rows R4–R31]`.
9. **Date window:** "Hari Raya popup is not displayed in Homepage screen from 6-7 March" while "CNY Winner List 2026 popup is displayed in homepage screen from 6-7 March" `[sheet EAINT-9560, row R32]`; Hari Raya returns "from 8-31 March" `[sheet EAINT-9560, row R33]`. Not executed here (Pending).

### Against existing knowledge

1. **Agrees** with `flow-ucd-shell.md` § Campaign popup behaviour (7 s switch, once per login) and § popup order item 5 ("Hari Raya: campaign popup before Company Profile Update").
2. **Gap in the catalogue line:** `cr-test-scenario-catalogue.md` row 101 gives "Web socket → Hari Raya → Company Profile Update (EAINT-9560!R14)" without saying it is the **Firefox** order. Chrome rows (R7, R21) have **no** Web Socket popup.
3. **Ties to `flow-ucd-shell.md` § Campaign popup behaviour item 4** (Firefox → Chrome announcement, EAINT-12180): this TS shows a Firefox-only "Web Socket" popup already existed in March 2026, well before EAINT-12180 `[unconfirmed whether it is the same dialog]`.
4. **Catalogue row 101** says "none named" for the date column and records 30 TS; consistent with this study.

## 5. Test data, environments, accounts, setup

1. **Browsers:** Chrome and Firefox.
2. **User types:** Main UCD and Sub UCD.
3. **Company settings toggled:** "Company Level Insurance Permission" ✅/❌ and "Company Profile Update" ✅/❌.
4. **Environment:** not written in the sheet.
5. **Accounts / credentials:** none in the sheet.
6. **Date-dependent rows** (TS29/TS30) need the system date in 6–7 March and 8–31 March, or the TNG CNY Winner List ticket (EAINT-9806) to cover them.

## 6. Gaps or risks a regression should still cover

1. **TS29 and TS30 never ran here** — Pending, deferred to the CNY Winner List ticket. Check EAINT-9806 results before treating the 6–7 March switch as tested.
2. **Copy-paste errors in expected results** (sheet trusted less as a spec):
   1. TS14 title says "To verify CNY 2026 popup" and expected "CNY 2026 is displayed correctly as second popup" `[row R17]` — leftover from the CNY 2026 sheet.
   2. TS2/TS9 expected say "first popup in Homepage screen" for the Insurance Module page `[rows R5, R12]`.
   3. TS6/TS13/TS20/TS27 expected say "redirected back to Homepage" while the title is the Insurance Module page `[rows R9, R16, R23, R30]`.
   4. TS17/TS24 banner rows say "Hari Raya 2026 popup in English is shown first" `[rows R20, R27]`.
   5. TS30 title is about the Homepage popup but expected result 1 is about the banner on the Insurance Transaction Listing, and numbering repeats "2." `[row R33]`.
3. **Not covered:** banner "once only" behaviour; banner close action; Insurance Module page popup order with Web Socket / Company Profile Update; behaviour after **31 March** (popup/banner switched off); Insurance Transaction Listing with Insurance permission ❌.
4. **Campaign is seasonal** — a 2026 regression of this exact popup is no longer meaningful; reuse the pattern for the next campaign ticket, with that ticket's own order (see memory "Campaign popup order is not fixed").
5. **Automation impact:** while this campaign was live, `homerayacampaign` could be forced true on every load (`flow-ucd-shell.md` § suppression warning), so scripts must dismiss visible popups after each navigation, including the Insurance Module page.

## Knowledge candidates

1. **`knowledge/flow-ucd-shell.md` § popup order item 5** — make the browser split explicit: Chrome "Hari Raya 2026 popup (1st) ➡️ Company Profile Update popup (2nd)" `[from SharePoint TS #101 EAINT-9560, sheet EAINT-9560, row 7]`; Firefox "Web socket (1st) ➡️  Hari Raya 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)" `[same, row 14]`.
2. **`knowledge/flow-ucd-shell.md` § Campaign popup behaviour** — add: a "Web Socket" popup showed on **Firefox only** as early as the Hari Raya 2026 campaign (Chrome rows have none) `[from SharePoint TS #101 EAINT-9560, sheet EAINT-9560, rows 4, 11]`. Helps settle the open `[unconfirmed]` on whether `#dialog-websocket` is a Firefox-only dialog.
3. **`knowledge/business-rules-from-test-scenarios.md` §7** — add: campaign popup also shows on the **Insurance Module page** and not again after redirect there: "Hari Raya 2026 popup is displayed correctly as popup in Insurance module page" `[from SharePoint TS #101 EAINT-9560, sheet EAINT-9560, row 19]`.
4. **`knowledge/business-rules-from-test-scenarios.md` §7** — add: overlapping campaigns are handled by **date window**; Hari Raya popup hidden "from 6-7 March" while "CNY Winner List 2026 popup is displayed", back "from 8-31 March" `[from SharePoint TS #101 EAINT-9560, sheet EAINT-9560, rows 32–33; status Pending]`.
5. **`knowledge/cr-test-scenario-catalogue.md` row 101** — note result counts "28 Pass, 2 Pending" and that the R14 order is Firefox-only.
