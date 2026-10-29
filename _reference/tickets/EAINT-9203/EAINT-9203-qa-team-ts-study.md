# EAINT-9203 — QA Team test script study (2026-10-28)

## Sources read

1. **TS text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9203 - Restrict UCD from Resubmitting JomCheck When Payment Is Completed and Tx Status is Failed.md` (copy dated "28/10/2026, 9:38:48 am"). Cell text only — colours, formatting and images not available.
2. **Jira capture:** `_reference/tickets/Studying/EAINT-9203/EAINT-9203-jira.md` (captured 27/10/2026).
3. **Knowledge:** `knowledge/flow-jomcheck.md` (§2 item 3–5 area, §3 item 3, §9g, §9h item 7), `knowledge/business-rules-from-test-scenarios.md` (item 5), `knowledge/cr-test-scenario-catalogue.md` (row 093).
4. **lib/ticketStudies.ts:** no EAINT-9203 entry.
5. **Not read:** the SRD (`SRD_EAINT-9203_..._V1.0_20251121.docx` / `.pdf`). It is listed as a Jira attachment only; no local copy exists in `_reference/tickets/EAINT-9203/` or `_reference/tickets/Studying/EAINT-9203/`. Nothing below comes from the SRD.

## 1. Header

1. **Ticket:** EAINT-9203 — Jira summary "🔴[eAuto-JomCheck] Restrict UCD from Resubmitting JomCheck When Payment Is Completed and Tx Status is Failed" `[Jira capture, item 1]`.
2. **Status:** "Done". **Fix version:** "S24.1-20251203🌞 (2025-12-03)". Dev comment (2025-12-04): "This ticket has been patched to Production on 3 December 2025 around 8.51AM." `[Jira capture, items 2, 4; Comments]`
3. **Module / portal:** JomCheck — **UCD** JomCheck Listing and **BackOffice** JomCheck Listing.
4. **Workbook:** "EAINT-9203 - Restrict UCD from Resubmitting JomCheck When Payment Is Completed and Tx Status is Failed.xlsx", library "eAuto - CR Test Scenarios", modified 03/12/2025, 9:27:10 am.
5. **Sheets (2):**
   1. **"9203 TS v2 (May)"** — the executed sheet. 16 staging scenarios (9203_TS1–TS16, 19 rows; TS1, TS8, TS16 each span two rows) + 10 production scenarios (9203_PROD_TS1–PROD_TS10).
   2. **"9203 TS v1 (Zuhaira)"** — first draft. 10 scenarios (9203_TS1–TS10). No results recorded.
6. **Results:**
   1. v2 staging: **19 / 19 rows PASS** (16 / 16 scenarios).
   2. v2 production: **10 / 10 PASS**.
   3. v1: Test Result and QA columns empty; the priority ("p1"/"p2") sits in the last column instead `[sheet 9203 TS v1 (Zuhaira), rows 8-17]`.
7. **Tester:** QA column "Zuhaira" on every v2 staging row `[sheet 9203 TS v2 (May), rows 8-26]`. Jira QA field: "Zuhaira Aina Binti Sabtu" `[Jira capture, item 3]`. Sheet name says "(May)" — likely the v2 author or reviewer `[unconfirmed]`.
8. **Dates:** none written in the sheet. Jira "ETA for Testing (cf 10057): 2025-12-01", "Exp. Deploy Date (cf 10087): 2025-12-03" `[Jira capture, item 7]`.

## 2. What the ticket changed, as the TS shows it

1. **Before:** UCD could resubmit a JomCheck transaction that was paid but Failed `[unconfirmed — inferred from the ticket title; SRD not read]`.
2. **After:** for **Payment = OK, Tx Status = Failed**, the "Resubmit" action is hidden on **UCD** and kept on **BackOffice**: "the 'Resubmit' action is NOT showing for UCD but remain showing for BO user" `[sheet 9203 TS v2 (May), row 8, Test Objective]`.
3. **Every other status combination:** Resubmit hidden on both UCD and BO (rows 10-15, 18-24).
4. **Scope of the check:** v2 checks the **listing** only ("UCD - Jomcheck Listing", "BackOffice - JomCheck Listing"). v1 also named the details page: "UCD - 'Resubmit' action not showing in both listing and details page" `[sheet 9203 TS v1 (Zuhaira), row 8]`.

## 3. Scenarios

### 3a. Staging — newly created transactions (sheet "9203 TS v2 (May)")

1. **9203_TS1 (P1)** — Payment OK / Tx Failed / LHDN "-". Expected: UCD "Ensure 'Resubmit' action is NOT showing"; BO "Ensure 'Resubmit' action is showing" `[row 8]`. Part 2: BO clicks Resubmit, "Transaction resubmitted successfully" → both listings "Payment Status = OK", "Tx Status = Approved", Resubmit NOT showing `[row 9]`. PASS.
2. **9203_TS2 (P2)** — OK / Approved / LHDN "-" (pending LHDN response). Hidden on both `[row 10]`. PASS.
3. **9203_TS3 (P2)** — OK / Approved / LHDN OK. Hidden on both `[row 11]`. PASS.
4. **9203_TS4 (P2)** — OK / Approved / LHDN Failed. Hidden on both `[row 12]`. PASS.
5. **9203_TS5 (P2)** — Payment Failed / Tx Failed / LHDN "-". Hidden on both `[row 13]`. PASS.
6. **9203_TS6 (P2)** — Payment "-" / Pending, made by "Search with invalid Vehicle Number". Hidden on both `[row 14]`. PASS.
7. **9203_TS7 (P2)** — Payment "-" / New, made when the JomCheck API is down. Hidden on both `[row 15]`. PASS.

### 3b. Staging — existing transactions

1. **9203_TS8 (P1)** — OK / Failed / LHDN "- / N/A". UCD hidden, BO showing `[row 16]`. Part 2: BO resubmits, "Transaction resubmitted failed" → both "Tx Status = Failed"; UCD hidden; BO "Ensure 'Resubmit' action remain showing" `[row 17]`. PASS.
2. **9203_TS9 (P2)** — OK / Approved / LHDN "-". Hidden on both `[row 18]`. PASS.
3. **9203_TS10 (P2)** — OK / Approved / LHDN OK. Hidden on both `[row 19]`. PASS.
4. **9203_TS11 (P2)** — OK / Approved / LHDN Failed. Hidden on both `[row 20]`. PASS.
5. **9203_TS12 (P2)** — Payment "Any", Tx "Approved / Failed / Pending / New", LHDN "N/A". Hidden on both `[row 21]`. PASS.
6. **9203_TS13 (P2)** — Failed / Failed / "-". Hidden on both `[row 22]`. PASS.
7. **9203_TS14 (P2)** — "-" / Pending / "-". Hidden on both `[row 23]`. Test Scenario cell holds only "i". PASS.
8. **9203_TS15 (P2)** — "-" / New / "-". Hidden on both `[row 24]`. PASS.
9. **9203_TS16 (P1)** — OK / Failed / LHDN "N/A". Same steps and results as TS8 (BO resubmit fails, BO keeps Resubmit) `[rows 25-26]`. PASS.

### 3c. Production regression (same sheet, "Production regression scope", R30)

1. **9203_PROD_TS1 (P2)** — new Pending via invalid vehicle number. Hidden on both `[row 32]`. PASS.
2. **9203_PROD_TS2 (P1)** — existing OK / Failed / "-". UCD hidden, BO showing `[row 33]`. PASS.
3. **9203_PROD_TS3 (P1)** — existing OK / Failed / "N/A". UCD hidden, BO showing `[row 34]`. PASS.
4. **9203_PROD_TS4–TS6 (P2)** — existing OK / Approved with LHDN "-", OK, Failed. Hidden on both `[rows 35-37]`. PASS.
5. **9203_PROD_TS7 (P2)** — existing LHDN "N/A", any Tx Status. Hidden on both `[row 38]`. PASS.
6. **9203_PROD_TS8–TS10 (P2)** — existing Failed/Failed, Pending, New. Hidden on both `[rows 39-41]`. PASS.
7. **No BO Resubmit click in production.** The production rows check visibility only; no row clicks Resubmit.

### 3d. v1 draft (sheet "9203 TS v1 (Zuhaira)") — superseded

1. **TS1–TS5 newly created, TS6–TS10 existing** — same status pairs as v2, minus "Approved / LHDN -", "New", and "LHDN N/A" `[rows 8-17]`.
2. Expected results add the **details page** for UCD (see §2 item 4).

## 4. Business rules and system behaviour the TS reveals

1. **Resubmit visibility matrix** (all quotes sheet "9203 TS v2 (May)"):

   | Payment | Tx Status | LHDN | UCD Resubmit | BO Resubmit | Row |
   |---|---|---|---|---|---|
   | OK | Failed | - / N/A | hidden | **shown** | 8, 16, 25 |
   | OK | Approved | - / OK / Failed | hidden | hidden | 10-12, 18-20 |
   | Failed | Failed | - | hidden | hidden | 13, 22 |
   | - | Pending | - | hidden | hidden | 14, 23 |
   | - | New | - | hidden | hidden | 15, 24 |
   | Any | any | N/A | hidden | hidden | 21 |

2. **Successful BO resubmit → Approved, Resubmit gone:** "Transaction resubmitted successfully" → "Tx Status = Approved" … "Ensure 'Resubmit' action is NOT showing" `[row 9]`.
3. **Failed BO resubmit → stays Failed, BO keeps Resubmit:** "Transaction resubmitted failed" → "Tx Status = Failed" … "Ensure 'Resubmit' action remain showing" `[rows 17, 26]`. So BO can retry repeatedly.
4. **Pending status source:** "Search with invalid Vehicle Number, Tx Status = Pending" `[row 14]`.
5. **New status source (API down):** "Jomcheck API is NOT available, Tx Status = New" with popup "Jomcheck API is temporarily unavailable now, please try again in 10 minutes." `[row 15]`.
6. **Payment Failed → Tx Failed:** "Proceed with payment but payment failed, Tx Status = Failed, Payment Status = Failed" `[row 13]`.
7. **Payment OK can still end Failed:** "Proceed with payment successfully but Transaction Status = Failed" `[row 8]`.
8. **LHDN "N/A" exists on old records** with any Tx Status (Approved/Failed/Pending/New) `[row 21]`. Production row 38 narrows the payment column: "Any / Failed for Tx Status = Failed".

### 4a. Where this matches or contradicts knowledge/

1. **Matches** `knowledge/flow-jomcheck.md` §3 item 3 and `knowledge/business-rules-from-test-scenarios.md` item 5 — the v2 rules and the v1 "is showing" title typo are already recorded.
2. **Matches** `knowledge/flow-jomcheck.md` §9g item 2: BO Resubmit only on "Payment "OK", Tx Status "Failed", LHDN Response Status "-"" rows. This TS adds that LHDN "N/A" + OK/Failed also shows it on BO `[rows 16, 25; PROD row 34]`.
3. **Contradiction — API-down status.** `knowledge/flow-jomcheck.md` §3 item 4 (from EAINT-6475): "API down: "Jomcheck API is temporarily unavailable now, please try again in 10 minutes." → Tx Failed". This TS (row 15) records the same popup with "Tx Status = New". Which status a current API-down produces is `[unconfirmed]`; the difference may be a later change between tickets.
4. **Details page:** §9g item 1 says BO Resubmit "is NOT on the Transaction Details page that "View" opens". v2 does not test the details page on either portal; v1 expected UCD "not showing in both listing and details page" `[v1 row 8]`.
5. **Stale note in knowledge:** §9g item 5 says "After the click: not captured [unconfirmed]", while §9h item 7 already records the prompts "Sure to resubmit?" and "Succesfully resubmit." (2026-10-19). Not from this TS; flagged for tidy-up.

## 5. Test data, environments, accounts

1. **Environment:** "staging/uat2" `[sheet 9203 TS v2 (May), row 3]`; v1 environment blank. Production rows R30-R41.
2. **Production test data** `[sheet 9203 TS v2 (May), Test Data column, rows 32-41]`:
   1. PROD_TS1: "UCD: TEST001XX ⏎ Backoffice: TEST001XX" (vehicle number or login — not stated `[unconfirmed]`).
   2. PROD_TS2: BO "J5N0060787", "J5N0056289". PROD_TS3: BO "J4N0020204", "J4N0020159".
   3. PROD_TS4: BO "J500054088", "J5N0057756". PROD_TS5: BO "J5N0060771", "J5N0056321". PROD_TS6: BO "J500056154", "J500056148".
   4. PROD_TS7: UCD/BO "New - VKR7356", "Failed - ABC124 (Payment failed)", "Pending - WA1934L"; BO "Approved - J520026879, J520026848".
   5. PROD_TS8: "J5N0057763" (both). PROD_TS9: "BJM8933" (both). PROD_TS10: "VEH5862" (both).
   6. UCD "No test data" for PROD_TS2–TS6 — **UCD side of the paid + Failed rule was not checked in production.**
3. **Staging test data:** none recorded.
4. **Credentials:** none in the sheet.

## 6. Gaps and risks a regression should still cover

1. **Details page:** v2 checks listings only. Confirm UCD's JomCheck details page also hides Resubmit for OK / Failed (v1 expected it).
2. **UCD direct call:** hiding the link does not prove the server rejects a UCD resubmit request `[unconfirmed]`.
3. **BO roles:** only one BO role is implied. §9g item 4: other roles `[unconfirmed]`.
4. **Production UCD paid + Failed:** no UCD data for the core P1 rule in production (PROD_TS2/TS3).
5. **Documents after resubmit:** no TS checks Invoice / e-Invoice after a BO resubmit. Known issue EAINT-12554 ("JomCheck Invoice still shows 1 line after resubmitting an old failed transaction") in `flow-jomcheck.md` §11e item 4.
6. **Repeated BO retries:** TS8/TS16 show a failed resubmit keeps Resubmit; no TS covers a second retry or payment double-charge.
7. **Sheet defects:** TS14 Test Scenario is "i"; TS11 steps jump "1." to "3."; TS16 duplicates TS8 apart from LHDN "N/A".
8. **API-down status** (New vs Failed) — see §4a item 3.

## Knowledge candidates

1. **BO Resubmit also shows for LHDN "N/A".** Payment OK + Tx Failed + LHDN "N/A" → UCD hidden, BO shown. Source: sheet "9203 TS v2 (May)", rows 16, 25 ("- / N/A", "N/A"), production row 34. Target: `knowledge/flow-jomcheck.md` §9g item 2.
2. **Failed BO resubmit keeps the row Failed and keeps BO Resubmit.** "Transaction resubmitted failed" → "Tx Status = Failed" → "Ensure 'Resubmit' action remain showing". Source: sheet "9203 TS v2 (May)", rows 17, 26. Target: `knowledge/flow-jomcheck.md` §3 item 3.
3. **API-down status conflict.** EAINT-9203 row 15: "Jomcheck API is NOT available, Tx Status = New"; flow-jomcheck §3 item 4 (EAINT-6475) says Tx Failed. Add as `[unconfirmed]` conflict to verify. Source: sheet "9203 TS v2 (May)", row 15.
4. **Pending is produced by an invalid vehicle number** — "Search with invalid Vehicle Number, Tx Status = Pending". Source: sheet "9203 TS v2 (May)", row 14. Already implied by §3 item 3 ("Vehicle not found … Tx Pending"); confirms it.
5. **Deployment record:** "patched to Production on 3 December 2025 around 8.51AM", fix version "S24.1-20251203". Source: Jira EAINT-9203, comment by the developer, 2025-12-04. Target: `knowledge/cr-test-scenario-catalogue.md` row 093.
6. **Tidy-up:** `flow-jomcheck.md` §9g item 5 ("After the click: not captured") is outdated by §9h item 7.
