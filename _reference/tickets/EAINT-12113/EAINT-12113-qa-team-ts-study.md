# EAINT-12113 — QA Team test script study (2026-10-27)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-12113-[eAuto-BackOffice] Unable to Get SSM Data in Recon Li.md` (cell text only; formatting, colours and images not kept).
2. **Jira capture:** `_reference/tickets/Studying/EAINT-12113/EAINT-12113-jira.md` (captured 27/10/2026, 5:46:17 pm).
3. **Knowledge:** `knowledge/cr-test-scenario-catalogue.md` rows 241 and 369; `knowledge/business-rules-from-test-scenarios.md` item 9 (line 752); `knowledge/flow-ssm.md` lines 75 and 83; `knowledge/flow-bo-shell.md` §3 route table and "Reconciliation Summary Listing — EAINT-12055 SRD v1.0"; `knowledge/environments-history.md` lines 58 and 63; `knowledge/production-regression-scope.md` lines 886 and 894.
4. **`lib/ticketStudies.ts`:** no entry for EAINT-12113.
5. **Not read:** the three Jira image attachments by the developer (`image-20260817-025130.png`, `-025147.png`, `-025202.png`) — not in the repo. No SRD exists for this ticket in the repo; the ticket is a Bug with a Jira-description spec only.

## 1. Header

1. **Ticket:** EAINT-12113 — "🐞[eAuto-BackOffice] Unable to Get SSM Data in Recon Listing when SSM Payment Date & Approved Date are Different" [Jira capture, Summary].
2. **Type / status:** "Bug · **Status:** Done · **Priority:** Medium"; fix version "S32.7-20260817 🌚 (2026-08-17)" [Jira capture, fields 2 and 4].
3. **Portal / module:** "eAuto BackOffice" / "eAuto Reconciliation Summary Listing" [Jira description, rows 1–2]. BO route: `/<env>/view/jpj/report/consolidated-reconcile/eauto-report.jsp` [knowledge/flow-bo-shell.md line 274].
4. **Workbook:** "EAINT-12113-[eAuto-BackOffice] Unable to Get SSM Data in Recon Li.xlsx", library "eAuto - CR Test Scenarios", modified 07/08/2026, 3:40:59 pm.
5. **Sheets:** one — "TS - EAINT-12113".
6. **Scenarios:** **6** (RECONLS_TS01 – RECONLS_TS06), rows R3–R8, plus a notes row R10. The catalogue records "7" rows [knowledge/cr-test-scenario-catalogue.md line 241] — that count includes a header or notes row [unconfirmed].
7. **Results:** **none recorded.** The sheet has no Pass/Fail, Status or Actual column.
8. **Tester / dates:** not written in the sheet. Catalogue lists "Siti Nur Azila Binti Mohamed | 2026-08-07" [knowledge/cr-test-scenario-catalogue.md line 241]; Jira QA field "Siti Nur Azila" [Jira capture, field 3]. Sample dates in the sheet are 03–05 Aug 2026 (placeholders, see §5).

## 2. What the ticket changed, as the TS shows it

1. **Problem:** "Unable to retrieve SSM data in the Recon Listing when the SSM payment date and approved date fall on different dates." [Jira description, row 3].
2. **Request:** "To retrieve data in the Recon Listing even when the payment date and approved date are different, for the following modules:  - JomCheck - SSM - Insurance" [Jira description, row 4].
3. **Developer notes per module** [Jira comments, zhan.choon, 2026-08-17 10:51–10:52]:
   1. JomCheck: "This is Jomcheck changing query behaviour".
   2. SSM: "This is SSM changing query behaviour to get the snapshot after being approved."
   3. Insurance: "This is Insurance changing to use jpjAcceptedAt after transactions being approved".
4. **As the TS frames it:** each module gets a **same-day baseline** (no regression) and a **+2 day gap** case where the eAuto-side record must appear under its **Approved Date** while the bank-side record appears under its **Payment Date**.

## 3. Scenarios

### A. JomCheck

1. **RECONLS_TS01** — same day, 03-Aug 10:00 AM paid / 10:05 AM approved. Expected: "Single matched entry - no discrepancy. Confirms fix does not break existing same-day flow." [sheet TS - EAINT-12113, R3].
2. **RECONLS_TS02** — 03-Aug 11:40 PM paid / 05-Aug 09:15 AM approved. Expected: "Expect 2 mismatch entries with same Payment Ref No. & amount: bank-only on payment date, system-only on approved date. Reviewer pairs and clears both." [R4].

### B. SSM

1. **RECONLS_TS03** — same day baseline; same expected text as TS01 [R5].
2. **RECONLS_TS04** — +2 day gap; same expected text as TS02 [R6].

### C. Insurance

1. **RECONLS_TS05** — same day baseline; same expected text as TS01 [R7].
2. **RECONLS_TS06** — +2 day gap; same expected text as TS02 [R8].

**Common to all six:** Kod Hasil "-", Refund Required "No", Summary "Displayed?" "✓", "Auto Upload to JPJ Hasil Portal?" "No", "Email to Finance" "No" [R3–R8].

## 4. Business rules and system behaviour the TS reveals

1. **Scope is three modules only:** "Ticket EAINT-12113 covers JomCheck, SSM and Insurance modules only." [sheet TS - EAINT-12113, R10, note 3].
2. **Two sides of the listing:** "\"Displayed? (Payment Date)\" = bank-side entry visible in listing under payment date; \"Displayed? (Approved Date)\" = eAuto-side entry visible under approved date." [R10, note 2].
3. **Same-day case has only the bank-side column checked:** "Displayed? (Approved Date)" = "N/A" on TS01/03/05 [R3, R5, R7] — one combined matched line [unconfirmed reading].
4. **Gap case shows two lines** before the fix to EAINT-12055: "bank-only on payment date, system-only on approved date. Reviewer pairs and clears both." [R4, R6, R8]. Pairing key is "same Payment Ref No. & amount" [R4].
5. **Kod Hasil "-"** for JomCheck, SSM and Insurance [R3–R8]. Matches the BO rule "'-' for non-JPJ" [knowledge/flow-bo-shell.md line 486].
6. **No auto upload, no Finance email** for these types: "Auto Upload to ⏎ JPJ Hasil Portal?" = "No", "Email to Finance" = "No" [R3–R8].
7. **Still shown in the Summary tab:** "Reconciliation Summary — Displayed?" = "✓" [R3–R8]. This conflicts with the Charmain-repo note that Kod Hasil "-" rows appear on the "Listing tab only, never Summary" [knowledge/flow-bo-shell.md line 519] [unconfirmed which is right].
8. **Late-night payment** (11:40 PM) is used as the gap trigger [R4, R6, R8] — tests the day boundary.

### Contradictions with knowledge/

1. **EAINT-12055 removes matched pairs.** Deployed the same night (20260817) [knowledge/production-regression-scope.md lines 884, 886]. Its SRD: "Once a payment and an approved transaction have been successfully matched, the system shall remove both records from the reconciliation listing" [knowledge/flow-bo-shell.md line 513]. So the TS02/04/06 expectation "Expect 2 mismatch entries … Reviewer pairs and clears both" is **pre-12055 behaviour**. After both deploys the +2 day pair should be removed automatically [unconfirmed on screen].
2. **Summary vs Listing tab** for Kod Hasil "-" — see §4 item 7.
3. **flow-ssm.md line 75** says "Check Payment Breakdown Report and Reconciliation include SSM". The TS does not touch the Payment Breakdown Report; the Jira ticket names only "eAuto Reconciliation Summary Listing" [Jira description, row 2].

## 5. Test data, environments, accounts, setup

1. **Placeholders only:** "Dates/amounts/reference numbers above are placeholders — replace with actual staging data before execution." [R10, note 1]. Amounts are "XX.XX", refs "REF-001" … "REF-006" [R3–R8].
2. **Environment:** "staging" per the sheet note [R10, note 1]. Deploy history: uat3 on 2026-08-05 [knowledge/environments-history.md line 58]; uat4 on 2026-08-17 [line 63].
3. **Preconditions per row:** "JPJ Final ⏎ Submission" ✓ and "RHB ⏎ Payment" ✓ [R3–R8] — an approved transaction plus an RHB statement line with the matching Payment Ref No.
4. **Accounts / credentials:** none in the sheet.
5. **Production regression:** both deploy rows mark automation "No" [knowledge/production-regression-scope.md lines 886, 894].

## 6. Gaps or risks a regression should still cover

1. **Post-12055 expectation not written.** Re-assert the +2 day case: pair matched and removed, not two lines [§4 contradiction 1].
2. **Cross-month gap** (e.g. paid 31st, approved 1st) — not in this TS; the 12055 SRD calls it out [knowledge/flow-bo-shell.md line 512].
3. **Mismatches still visible:** approved with no payment, payment with no approval, different amounts — none covered here.
4. **Gap of other lengths** (1 day, weekend, >7 days) — only +2 days tested.
5. **Other modules untouched:** STMS, eSTM, APT, BMK, eLKM, eDereg Pre-Checking — no regression rows to prove the query change did not alter them.
6. **Export and filter by date range** — the TS checks the grid only.
7. **Insurance source date:** the fix uses "jpjAcceptedAt" [Jira comment, 2026-08-17 10:52:13]; no row checks what happens when that field is empty (Insurance not yet JPJ-accepted) [unconfirmed risk].
8. **SSM snapshot:** "get the snapshot after being approved" [Jira comment, 2026-08-17 10:52:01] — no row checks an SSM approved after a resubmission.
9. **No execution evidence** — sheet holds no Pass/Fail; results are not provable from SharePoint alone.

## Knowledge candidates

1. **flow-bo-shell.md (Reconciliation section):** JomCheck, SSM and Insurance recon rows use the Approved Date for the eAuto side after EAINT-12113. Source: "Displayed? (Approved Date) = eAuto-side entry visible under approved date" [SharePoint TS EAINT-12113, sheet TS - EAINT-12113, R10, note 2]; fix version S32.7-20260817 [Jira EAINT-12113].
2. **flow-bo-shell.md / eauto-insurance.md:** Insurance recon approved date comes from `jpjAcceptedAt`. Source: "This is Insurance changing to use jpjAcceptedAt after transactions being approved" [Jira EAINT-12113, comment zhan.choon, 2026-08-17 10:52:13].
3. **flow-ssm.md:** SSM recon reads "the snapshot after being approved" [Jira EAINT-12113, comment zhan.choon, 2026-08-17 10:52:01]. Also correct line 75 — the ticket names only the Reconciliation Summary Listing, not the Payment Breakdown Report [Jira description, row 2].
4. **flow-jomcheck.md:** JomCheck recon "changing query behaviour" for different payment/approved dates [Jira EAINT-12113, comment zhan.choon, 2026-08-17 10:51:45]; Kod Hasil "-" [sheet TS - EAINT-12113, R3].
5. **flow-bo-shell.md conflict note:** TS shows Summary "Displayed?" "✓" for Kod Hasil "-" rows [sheet TS - EAINT-12113, R3–R8] vs Charmain-repo "Listing tab only, never Summary" [flow-bo-shell.md line 519]. Tag [unconfirmed] until checked on staging.
6. **business-rules-from-test-scenarios.md item 9:** add that the TS's "two mismatch entries, reviewer clears both" expectation predates EAINT-12055 (same 20260817 deploy), which removes matched pairs automatically [knowledge/flow-bo-shell.md line 513] [unconfirmed on screen].
