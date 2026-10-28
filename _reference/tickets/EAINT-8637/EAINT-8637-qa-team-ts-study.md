# EAINT-8637 — QA Team test script study (2026-10-27)

## 1. Header

1. **Ticket:** EAINT-8637 — "[eAuto-Insurance] To Remove Touch and Go Winner Announcement Popup in Homepage and Insurance Module Dashboard" (sheet EAINT-8637, R1).
2. **Module / portal:** **UCD portal** — Homepage and Insurance module dashboard.
3. **Workbook:** "EAINT-8637 - [eAuto-Insurance] To Remove Touch and Go Winner Announcement Popup in Homepage and Insurance Module Dashboard.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 08/09/2026, 9:14:15 am.
4. **Sheets:** one — "EAINT-8637".
5. **Scenarios:** **4** (8637_TS1 to 8637_TS4), all **P1**, spread over 14 step rows (R8–R21).
6. **Results:** two result columns (header R7: "QA | Test Result | QA | Test Result (Prod - 11/8/2025)").
   1. **Staging/preprod1:** 14 of 14 rows "PASS", tester May (all rows).
   2. **Prod:** 14 of 14 rows "PASS"; tester Nick for TS1–TS2 (R8–R15), Charmain for TS3–TS4 (R16–R21).
   3. **Prod date** written as "11/8/2025" (R7). Day/month order not stated; likely 11 Aug 2025, since the popup was added by EAINT-8564 (TS dated 2025-07-24, prod regression 20250728 per `knowledge/production-regression-scope.md:1084`) [unconfirmed].
7. **Remarks column:** empty on every row.

## 2. What the ticket changed (as the TS shows it)

1. **Removes** the **Touch and Go (TNG) Campaign Winner announcement popup** (English and Chinese) from the **UCD Homepage** and the **Insurance module dashboard**.
2. Test objective, verbatim: "To check Insurance Touch and Go Winners Announcement are NOT showing in Homepage and Insurance Module Dashboard" (R5).
3. It undoes **EAINT-8564** ("[eAuto] [Insurance] To announce Touch and Go Winner through popup", catalogue #068) [unconfirmed — inferred from titles; the TS does not name EAINT-8564].

## 3. Scenarios

### A. With Insurance permission

1. **8637_TS1** — Main UCD, Insurance permission ✅, Company/Business Profile Setup ✅. Checks Homepage after login (R8), after manual refresh (R9), on Insurance module (R10), and after [Home] / browser back / browser forward (R11). Expected: "Ensure TNG Campaign Winner (English & Chinese) popup is NOT showing."
2. **8637_TS2** — Sub UCD, Insurance permission ✅, Company/Business Profile Setup ❌. Same four checks (R12–R15). Expected: "Ensure: 1. Company/Business Profile Update shows correctly 2. TNG Campaign Winner (English & Chinese) popup is NOT showing." (R12, R13, R15); R14 (Insurance module) expects only the popup not showing.

### B. Without Insurance permission

1. **8637_TS3** — Main UCD, Insurance permission ❌. Homepage after login (R16): popup NOT showing. Direct URL to Insurance module (R17): "Ensure system prompt "Sorry, access denied", user UNABLE to access Insurance module from direct URL". Any module → [Home] → back → forward (R18): popup NOT showing.
2. **8637_TS4** — Sub UCD, Insurance permission ❌. Same three checks as TS3 (R19–R21), same expected results.

## 4. Business rules and system behaviour the TS reveals

1. **No TNG winner popup anywhere** for any UCD type: "Ensure TNG Campaign Winner (English & Chinese) popup is NOT showing." (sheet EAINT-8637, R8–R11, R14, R16, R18–R19, R21).
2. **Company Profile Update popup still shows** for a Sub UCD whose profile is not set up: "Company/Business Profile Update shows correctly" (sheet EAINT-8637, R12, R13, R15). So removing the TNG popup must not remove the profile popup.
3. **Insurance permission gate unchanged:** without Company Level Insurance Permission, direct URL gives "Sorry, access denied" (sheet EAINT-8637, R17, R20).
4. **Permission is company level:** pre-requisite wording "Company Level Insurance Permission✅" / "Company Level Insurance Permission❌" (R8, R16).
5. **Navigation paths tested:** "Manually refresh the page" (R9), "Click [Home] to redirect back to Homepage", "Click browser [⬅️] to access Insurance module", "Click browser [➡️] to redirect back to Homepage" (R11). These are the same re-entry paths used by the campaign popup "once per login" checks in `knowledge/flow-ucd-shell.md` §"Campaign popup behaviour".

### Relation to existing knowledge

1. `knowledge/flow-ucd-shell.md:73` and `knowledge/business-rules-from-test-scenarios.md:539` still say TNG winners popup "should be the last popup" (from EAINT-8564). **EAINT-8637 removed that popup**, so that line describes a past campaign only. It is not a contradiction under the "popup order is not fixed" rule (`flow-ucd-shell.md:57-60`), but the files do not say the EAINT-8564 popup was removed.
2. Later TNG winner popups exist: **EAINT-9806** (CNY 2026) and **EAINT-9892** (Hari Raya 2026) (`knowledge/cr-test-scenario-catalogue.md:124-125`). So TNG winner popups are **seasonal: added per campaign, then removed** [unconfirmed — inferred from catalogue titles].
3. `knowledge/cr-test-scenario-catalogue.md:121` records tester "May Chin Mei Theng" and date "2026-09-08". The date is the **file modified date**, not the test date; the sheet's only date is the prod column "11/8/2025".

## 5. Test data, environments, accounts, setup

1. **Environment:** "Test environment: staging/preprod1" (R3); prod verification column (R7).
2. **Accounts:** four UCD types — Main UCD with Insurance permission and profile set up; Sub UCD with Insurance permission and profile **not** set up; Main UCD without Insurance permission; Sub UCD without Insurance permission (R8, R12, R16, R19).
3. **No login IDs, passwords or company names** in the sheet. No credentials present.
4. **No test data** (vehicles, policies) needed.

## 6. Gaps or risks a regression should still cover

1. **Other popups not checked:** the TS asserts only the TNG popup is absent. It does not check that the **Web Socket, East Coast, or any active campaign popup** still shows in its place, or that the popup chain does not stall after removal.
2. **Main UCD profile popup:** the "profile update shows correctly" check exists only for Sub UCD (TS2). A Main UCD with profile ❌ is not covered.
3. **Insurance module for Sub UCD:** R14 drops the profile-popup check that R12, R13 and R15 carry. Small inconsistency; likely fine [unconfirmed].
4. **Leftover localStorage flag:** a browser that saw the EAINT-8564 popup keeps its flag. The TS does not test a **fresh browser / cleared storage** — the case where a leftover popup trigger would show [unconfirmed].
5. **Insurance Transaction Listing banners** (campaign banners, `business-rules-from-test-scenarios.md` §7.5) are not checked; only the dashboard is.
6. **Language:** no check with the UI in Chinese/other language.
7. **Step numbering skips 5** in TS3/TS4 (R18, R21: "4. … 6. … 7. … 8."). Cosmetic, but a step may be missing [unconfirmed].
8. **Prod date order** "11/8/2025" is ambiguous (D/M or M/D).

## 7. Sources read

1. `_reference/sharepoint/qa-team-ts/EAINT-8637 - [eAuto-Insurance] To Remove Touch and Go Winner Announcement Popup in Homepage and Insurance Module Dashboard.md` — text copy, cell text only; formatting and images not kept.
2. `_reference/tickets/EAINT-8637/` and `_reference/tickets/Studying/EAINT-8637/` — **do not exist** (no SRD, no notes).
3. `lib/ticketStudies.ts` — **no entry** for EAINT-8637.
4. `knowledge/` grep "8637": `cr-test-scenario-catalogue.md:121, 409` only.
5. `knowledge/flow-ucd-shell.md` (lines 50–99), `knowledge/business-rules-from-test-scenarios.md` §7 (lines 518–549), `knowledge/production-regression-scope.md:1084`.
6. Jira ticket and SRD — **not read** (unattended run; not in the repo).

## Knowledge candidates

1. **TNG winner popup (EAINT-8564) removed by EAINT-8637.** Add to `knowledge/flow-ucd-shell.md` next to line 73 and `business-rules-from-test-scenarios.md` next to line 539: the "should be the last popup" rule applies to EAINT-8564 only; EAINT-8637 removed it from Homepage and Insurance dashboard. Source: sheet EAINT-8637, R5 "To check Insurance Touch and Go Winners Announcement are NOT showing in Homepage and Insurance Module Dashboard"; prod PASS column "Test Result (Prod - 11/8/2025)" (R7).
2. **Removal TS pattern for campaign popups:** 4 UCD types (Main/Sub × Insurance permission ✅/❌) × Homepage login, refresh, Insurance module, [Home]/back/forward; no-permission users also get direct URL "Sorry, access denied". Source: sheet EAINT-8637, R8–R21.
3. **Company Profile Update popup must survive a campaign popup removal** for a Sub UCD with profile not set up: "Company/Business Profile Update shows correctly". Source: sheet EAINT-8637, R12.
4. **Catalogue date fix:** `cr-test-scenario-catalogue.md:121` date "2026-09-08" is the file modified date; the sheet's prod test date is "11/8/2025" (R7). Source: workbook metadata vs sheet EAINT-8637, R7.
5. **TNG winner popups are seasonal** (EAINT-8564 added, EAINT-8637 removed, EAINT-9806 / EAINT-9892 added again for CNY / Hari Raya 2026) [unconfirmed]. Source: `cr-test-scenario-catalogue.md:120-125` titles.
