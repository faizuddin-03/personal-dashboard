# EAINT-8564 — QA Team test script study (2026-10-28)

## 1. Header

1. **Ticket:** EAINT-8564 — "[eAuto] [Insurance] To announce Touch and Go Winner through popup" (sheet EAINT-8564, R1).
2. **Module / portal:** **UCD portal** — Homepage and Insurance module dashboard.
3. **Workbook:** "EAINT-8564 - [eAuto] [Insurance] To announce Touch and Go Winner through popup.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 24/07/2025, 6:04:30 pm.
4. **Sheets:** one — "EAINT-8564".
5. **Scenarios:** **8** (8564_TS1 to 8564_TS8), one row each (R8–R15). TS1–TS6 **P1**, TS7–TS8 **P2**.
6. **Results:** **8 of 8 "PASS"** (Test Result column, R8–R15). No Fail, no blank.
7. **Tester:** QA column reads "Charmain" on every row (R8–R15).
8. **Dates:** **none written in the sheet.** The only date is the file modified date (24/07/2025). Production regression for this ticket is listed as "20250728", Verified "Yes" (`knowledge/production-regression-scope.md:1084`).
9. **Remarks column:** empty on every row.
10. **Note:** the ticket-key format "8564_TS1" uses one digit; Faizuddin's own rule is two digits (TS01). This is the QA Team's sheet, so it is quoted as written.

## 2. What the ticket changed (as the TS shows it)

1. **Adds** a **Touch and Go (TNG) Campaign Winners popup**, bilingual (English and Chinese), on the **UCD Homepage** after login and on the **Insurance module dashboard**.
2. Test objective, verbatim: "To check Insurance Touch and Go Winners Announcement showing correctly in Homepage and Insurance Module Dashboard" (R5).
3. The popup shows to UCDs **with and without** Company Level Insurance Permission on the Homepage (TS5, TS6).
4. The popup was later **removed by EAINT-8637** ("To Remove Touch and Go Winner Announcement Popup in Homepage and Insurance Module Dashboard"; see `_reference/tickets/EAINT-8637/EAINT-8637-qa-team-ts-study.md`). So this popup is **no longer live** [unconfirmed — inferred from the EAINT-8637 title and its PASS results; EAINT-8637 does not name EAINT-8564].

## 3. Scenarios

### A. Homepage, with Insurance permission

1. **8564_TS1** (P1) — Main UCD, "Company Level Insurance Permission✅" (R8). Login → popup on Homepage → check English/Chinese interval → Insurance module → [Home] → browser back → browser forward → popup not shown. Expected: "Campaign Winners popup (should be the last popup)", "English Campaign Winners popup shows first by default", "Interval between English and Chinese popups is 7 seconds", "Close (X) button at the top right of the popup is visible and functions correctly", "Campaign Winners popup does NOT appear when redirected back to Homepage". **PASS**.
2. **8564_TS2** (P1) — Sub UCD, same permission and steps as TS1 (R9). Same expected result. **PASS**.

### B. Insurance module dashboard, with Insurance permission

1. **8564_TS3** (P1) — Main UCD, permission ✅ (R10). Login → Insurance module → popup on dashboard → interval → [Home] → open Insurance dashboard again → browser back → browser forward → popup not shown on dashboard. Expected: "Campaign Winners popup", English first, 7 seconds, Close (X), "Campaign Winners popup does NOT appear when redirected back to Insurance Module Dashboard". **PASS**.
2. **8564_TS4** (P1) — Sub UCD, same as TS3 (R11). **PASS**.

### C. Homepage, without Insurance permission

1. **8564_TS5** (P1) — Main UCD, "Company Level Insurance Permission❌" (R12). Popup on Homepage, interval, "Verify Insurance module is not displayed on top panel button and homepage", then "ANY module" → [Home] → back → forward → popup not shown. Expected: same five points as TS1, including "(should be the last popup)". **PASS**.
2. **8564_TS6** (P1) — Sub UCD, same as TS5 (R13). **PASS**.

### D. Direct URL after permission removed

1. **8564_TS7** (P2) — Main UCD (R14). With permission ✅, open Insurance module and copy the URL; switch the UCD to permission ❌; paste the URL. Expected: "Ensure system prompt Sorry, access denied, user UNABLE to access Insurance module from direct URL". **PASS**.
2. **8564_TS8** (P2) — Sub UCD, same as TS7 (R15). **PASS**.

## 4. Business rules and system behaviour the TS reveals

1. **Last in the popup chain:** "Campaign Winners popup (should be the last popup)" (sheet EAINT-8564, R8, R9, R12, R13). Not stated for the Insurance dashboard rows (R10, R11).
2. **English first:** "English Campaign Winners popup shows first by default" (R8–R13).
3. **Auto-switch every 7 seconds:** "Interval between English and Chinese popups is 7 seconds" (R8–R13).
4. **Close button:** "Close (X) button at the top right of the popup is visible and functions correctly" (R8–R13).
5. **Once per visit, Homepage:** "Campaign Winners popup does NOT appear when redirected back to Homepage" (R8, R9, R12, R13), tested via [Home], browser [⬅️] and browser [➡️].
6. **Once per visit, Insurance dashboard:** "Campaign Winners popup does NOT appear when redirected back to Insurance Module Dashboard" (R10, R11). The dashboard has **its own** popup showing, separate from the Homepage one [unconfirmed — TS3 opens the dashboard after login, so the TS shows the popup there but does not say whether a Homepage view first suppresses it].
7. **Popup not tied to Insurance permission on Homepage:** UCDs without permission still see it (R12, R13).
8. **No permission hides the module:** "Verify Insurance module is not displayed on top panel button and homepage" (R12, R13, step 4).
9. **Direct URL blocked:** "Ensure system prompt Sorry, access denied, user UNABLE to access Insurance module from direct URL" (R14, R15).
10. **Permission is company level:** "Company Level Insurance Permission✅" / "Company Level Insurance Permission❌" (R8, R12).

### Relation to existing knowledge

1. `knowledge/flow-ucd-shell.md:73` and `knowledge/business-rules-from-test-scenarios.md:539` already carry "should be the last popup" from this sheet, R8. **Matches.** Under the "popup order is not fixed" rule (`flow-ucd-shell.md:57-60`), this order is true only for this campaign.
2. Neither file says this popup was **removed by EAINT-8637**. A reader could take it as current behaviour.
3. `business-rules-from-test-scenarios.md:520-523` lists "TNG winners" among bilingual popups but cites only EAINT-10053 and EAINT-11925 for the 7-second / English-first rule. This sheet (R8–R13) is a **third source** for the same rule; it is not cited there.
4. `business-rules-from-test-scenarios.md:529-530` cites "Sorry, access denied" from row 14. **Matches** (R14).
5. `knowledge/cr-test-scenario-catalogue.md:120` gives date "2025-07-24" — that is the **file modified date**, not a test date; the sheet has none. Environment "staging, uat1" matches R3.

## 5. Test data, environments, accounts, setup

1. **Environment:** "Test environment: staging/uat1" (R3). No prod result column.
2. **Accounts:** four UCD types — Main and Sub UCD, each with and without Company Level Insurance Permission (R8–R13).
3. **Setup for TS7/TS8:** the tester must **turn the company's Insurance permission off** between steps 3 and 5 (R14, R15). The sheet does not say where this is done (BO or elsewhere).
4. **No login IDs, passwords or company names** in the sheet. **No credentials present.**
5. **No transaction test data** (vehicles, policies) needed.
6. **Campaign dates:** none given. The sheet does not state a start/end date for the popup.

## 6. Gaps or risks a regression should still cover

1. **Removal check:** the popup was removed by EAINT-8637. Any regression today should assert the popup is **absent**, not present (EAINT-8637 study covers this).
2. **Other popups before it:** TS asserts "last popup" but names no popups before it (Web Socket, Company Profile Update, other campaigns). The chain order was not shown.
3. **No campaign date window** tested (popup before start date / after end date).
4. **Manual refresh** not tested; only [Home], back and forward. EAINT-8637 added a refresh check (R9 of that sheet).
5. **New login / fresh browser** not tested: does the popup show again on the next login or in a new tab? [unconfirmed what "once" means — per session or per login].
6. **Homepage → Insurance dashboard order:** TS1 goes Homepage then Insurance module but does not state whether the dashboard popup shows there. TS3 expects it. Not consistent in wording [unconfirmed].
7. **Insurance Transaction Listing banner** not checked (other campaigns put banners there, `business-rules-from-test-scenarios.md` §7.5).
8. **Closing mid-cycle:** Close (X) is checked, but not closing on the Chinese side, or what happens if not closed (does it loop?).
9. **Step numbering slips:** TS3/TS4 list "3." twice and skip "4." (R10, R11). Cosmetic.
10. **TS7/TS8 label mismatch:** entry point says "(Without Insurance Permission)" while pre-requisite says "with ✅"; the permission changes mid-test. Cosmetic, but easy to misread.

## 7. Sources read

1. `_reference/sharepoint/qa-team-ts/EAINT-8564 - [eAuto] [Insurance] To announce Touch and Go Winner through popup.md` — text copy, cell text only; formatting and images not kept.
2. `_reference/tickets/EAINT-8564/` and `_reference/tickets/Studying/EAINT-8564/` — **did not exist** before this study (no SRD, no notes).
3. `lib/ticketStudies.ts` — **no entry** for EAINT-8564.
4. `knowledge/` grep "8564": `business-rules-from-test-scenarios.md:530, 539`; `cr-test-scenario-catalogue.md:120, 420`; `test-scripts.md:216`; `production-regression-scope.md:1084`; `flow-ucd-shell.md:73`.
5. `knowledge/flow-ucd-shell.md` (lines 50–94), `knowledge/business-rules-from-test-scenarios.md` §7 (lines 515–549).
6. `_reference/tickets/EAINT-8637/EAINT-8637-qa-team-ts-study.md` — the removal ticket's study.
7. Jira ticket and SRD — **not read** (unattended run; not in the repo).

## Knowledge candidates

1. **EAINT-8564 popup is removed.** In `knowledge/flow-ucd-shell.md:73` and `business-rules-from-test-scenarios.md:539`, add that the "should be the last popup" TNG winner popup was removed by EAINT-8637. Source: sheet EAINT-8564, R8 "Campaign Winners popup (should be the last popup)"; EAINT-8637 sheet R5 "To check Insurance Touch and Go Winners Announcement are NOT showing in Homepage and Insurance Module Dashboard".
2. **Third source for the bilingual rule.** Add EAINT-8564 to the citations at `business-rules-from-test-scenarios.md:520-523`. Source: sheet EAINT-8564, R8–R13 "English Campaign Winners popup shows first by default" and "Interval between English and Chinese popups is 7 seconds".
3. **Insurance dashboard has its own popup, once per visit.** Source: sheet EAINT-8564, R10 "Campaign Winners popup does NOT appear when redirected back to Insurance Module Dashboard".
4. **No Insurance permission hides the module button.** Source: sheet EAINT-8564, R12 "Verify Insurance module is not displayed on top panel button and homepage".
5. **Direct-URL permission test pattern:** copy the Insurance URL while permitted, remove company permission, paste → "Sorry, access denied". Source: sheet EAINT-8564, R14.
6. **Catalogue date note:** `cr-test-scenario-catalogue.md:120` "2025-07-24" is the file modified date; the sheet holds no test date. Source: workbook metadata vs sheet EAINT-8564 (no date cell).
