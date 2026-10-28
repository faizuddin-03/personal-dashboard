# EAINT-12589 — study (2026-10-26)

## 1. Header
1. **Title (Jira, verbatim):** [eAuto - BackOffice] Ins Cancellation Balance % - show on STMS & Insurance Cancellation listings and STMS export whenever a value exists
2. **Type:** **Bug** · **Labels:** 261019-261023, October2026, ProductBacklog
3. **Jira status:** **Done** (updated 2026-10-26 10:46)
4. **Priority:** Medium
5. **QA (cf[10041]):** **empty** · Miro card: "QA:" (blank)
6. **BA:** Miro card "BA: Yi Link" · Jira has no BA field set.
7. **Dev:** Boo Jin Siang (reporter and assignee); MR eauto_v2 !4965.
8. **Fix version:** **S34.15-20261026 🌞** (release 2026-10-26).
9. **Deployment (Miro column):** **26TH OCT DEPLOYMENT** — matches fix version.
10. **Test env (Miro):** "Test Env: /uat4".
11. **Est. mandays (Miro):** "1 day (1 QA)".

## 2. Sources read
1. Jira EAINT-12589 (MCP, read 2026-10-26): description, 1 comment, links. **No attachments. No SRD.** Remote links: none.
2. Jira EAINT-12586 (parent feature, Done, S34.14-20261023, QA Siti Nur Azila).
3. Miro card: `EAINT-12589-miro-card.md`.
4. Teams: no hit for 12589 in `_reference/teams/` (export ends 2026-10-16; ticket created 2026-10-23).
5. Knowledge: `knowledge/flow-stms-addons.md` lines 267, 309-310.
6. **SRD: none exists** — Bug ticket, description is the requirement.

## 3. What changes
1. **Portal (Jira, verbatim):** "eAuto BackOffice"
2. **Module (Jira, verbatim):** "\"Ins Cancellation Balance %\" column on STMS Transaction listing and its CSV export; \"Balance %\" column on Insurance Cancellation Transaction listing"
3. **Problem (verbatim):** "The Insurance Cancellation balance column shows \"-\" on the BackOffice STMS and Insurance Cancellation listings (and the STMS CSV export) even when the vehicle has a balance on record."
4. **When blanked (verbatim):** "It is blanked when the Insurance Cancellation case is Failed or Cancelled, and - on the STMS listings and export - also when the vehicle passed the eligibility check but no Insurance Cancellation transaction has been created yet."
5. **Expected (verbatim):** "the balance column shows the balance (whole percent, e.g. \"67%\") whenever one is on record - whatever the Insurance Cancellation status, and even before an Insurance Cancellation transaction exists. It shows \"-\" only when there is no balance at all."
6. **Impact (verbatim):** "Display only - operators lose visibility of the balance. No money, refund or data is changed. Dealer (UCD) pages are not changed and keep their current behaviour."

## 4. New vs existing behaviour
1. **Existing:** "-" for IC status **Failed / Cancelled**, and for **eligibility-only** STMS (no IC transaction).
2. **New:** whole percent (e.g. "67%") whenever a balance exists; "-" only when no balance.
3. **Unchanged:** which rows appear in each listing; **UCD pages**.

## 5. QA scope
1. **Miro card (verbatim):** "Testing Scope: (Automation)" — no further lines.
2. **Jira "Reference for QA" (verbatim):** "use rows that previously showed \"-\" but HAVE a balance (Failed/Cancelled case; eligibility-only STMS) - they must now show the percent on screen and in the CSV. A row with no balance must still show \"-\". Which rows appear in each listing is unchanged, and UCD dealer pages must look exactly as before."
3. Check matrix:
   1. BO **STMS Transaction listing** — column "Ins Cancellation Balance %".
   2. BO **STMS CSV export** — same column.
   3. BO **Insurance Cancellation Transaction listing** — column "Balance %".
   4. Rows: IC **Failed**, IC **Cancelled**, **eligibility-only** (no IC txn), **no balance** ("-"), normal Success/Pending (unchanged).
   5. **UCD** STMS listing + IC Status listing — unchanged.

## 6. Affected regression areas
1. BO STMS listing columns + CSV export (column order from EAINT-12586: before "Ins Cancellation Payment").
2. BO Insurance Cancellation Transaction listing.
3. UCD STMS listing / Insurance Cancellation Status listing (must not change).

## 7. Test data / env needs
1. **staging/uat4**.
2. STMS records with IC status Failed and Cancelled; an eligible STMS with no IC transaction; an STMS with no eligibility balance.
3. eSim Runnerku eligibility response by vehicle prefix (`knowledge/flow-stms-addons.md` line 243) to create eligible / not-eligible vehicles.

## 8. Dependencies / related
1. **EAINT-12586** — added "Ins Cancellation Balance %" column; Done, deployed S34.14-20261023.
2. **EAINT-12022** — Insurance Cancellation base (linked "relates to"), Done.
3. **EAINT-12573 / 12581-12585** — Insurance Cancellation Enhancement (22.10.2026) set `[from flow-stms-addons.md]`.

## 9. Teams decisions
1. **None found** in `_reference/teams/` or `knowledge/teams-decisions-by-ticket.md`. Export ends 2026-10-16, before this ticket existed.

## 10. Open questions / conflicts
1. **QA owner unset** — Jira QA field empty, Miro QA blank, yet status already **Done** (2026-10-26). Who signed it off is not recorded.
2. **Knowledge file conflict:** `knowledge/flow-stms-addons.md` line 267 says 12589 is to "show '-' for Failed, Cancelled or no-transaction cases" — the **opposite** of Jira. Jira wins: show percent when a balance exists.
3. **Rounding:** "whole percent" — round or truncate (e.g. 66.7)? Not stated.
4. **CSV for IC listing:** Jira names the STMS export only; whether the IC listing has its own export is not stated.
5. **Miro "Automation" only** — no manual line; no automation exists yet for BO IC listings `[inference]`.

## 11. Existing repo knowledge / automation to reuse
1. `knowledge/flow-stms-addons.md` §Insurance Cancellation (lines 235-326).
2. Azfar repo: `_reference/codebases/eauto-qa-azfar/cr/EAINT-12022/` (LEDGER, study, SRD v1.2, mockups).
3. `knowledge/esim.md` — Runnerku eligibility setup.
