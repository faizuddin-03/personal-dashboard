# EAINT-8514 — QA Team test script study (2026-10-28)

## Sources read

1. **Text copy** of the workbook: `_reference/sharepoint/qa-team-ts/EAINT-8514 - Download Payment Document.md` (exported 28/10/2026, 9:53:07 am). Cell text only — **colours, images and comments are not kept**.
2. `knowledge/flow-company-profile-einvoice.md` lines 213-252 — "UCD › Reports › Download Payment Document (EAINT-8514, EAINT-7496)" entry, cross-module effects, cronjobs, rules, QA scope, ticket history.
3. `knowledge/business-rules-from-test-scenarios.md` §9 item 3 (lines 622-637).
4. `knowledge/cr-test-scenario-catalogue.md` rows 213 and 413 (catalogue entry #061).
5. `knowledge/production-regression-scope.md` line 1058 (§11.3 precedent index).
6. `_reference/tickets/EAINT-7496/EAINT-7496-qa-team-ts-study.md` — the later CR that extends this page.
7. `_reference/miro/miro-eauto-qa-resource-planning-full-2026-10-26-part1.md` line 319 (planning card "CCB-46 / EAINT-8514") and `-part2.md` lines 483, 494 (daily allocation).
8. `lib/eautoFlows/modules/company-profile-einvoice.ts` lines 361-413 (same facts as the flow file).
9. **Not found:** `_reference/tickets/EAINT-8514/` (no prior files), `_reference/tickets/Studying/EAINT-8514/`, no entry in `lib/ticketStudies.ts`.
10. **Not read:** the original .xlsx, the Jira ticket and any SRD. No SRD for this ticket is in the repo.

## 1. Header

1. **Ticket:** EAINT-8514 — "Download Payment Document". Miro card: "CCB-46 / EAINT-8514 - Download Payment Document" (Miro part1, line 319).
2. **Module / portal:** **UCD portal › Reports › Download Payment Document**. Back Office is used only to fix TIN (TS3 R11, TS4 R17).
3. **Workbook:** "EAINT-8514 - Download Payment Document.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 10/10/2025, 11:21:09 am.
4. **Sheets (1):** "EAINT-8514 Test Scenarios" — 25 step rows (R2-R26).
5. **Scenarios:** **6** (8514_TS1 to 8514_TS6).
6. **Results:**
   1. **Pass: 4 scenarios** — TS1, TS3, TS4, TS5 (18 step rows).
   2. **N/A: 2 scenarios** — TS2, TS6 (7 step rows).
   3. **Fail: 0.** No blank result.
7. **Tester:** QA column reads "Azfar" on TS1 rows only (R2-R4). Blank on R5-R26. Miro lists "QA: Nick, Azfar" (part1, line 319).
8. **Dates:** none written in the sheet. Test data is **2025** (May, July, current month). Miro: "To deploy on: 13th Oct" (part1, line 319); testing "9th October … EAINT-8514 (Testing) - Nick, Azfar" (part2, line 494). Production deploy **20251013**, labelled "e-Invoice batch cron", verified "No" (`knowledge/production-regression-scope.md` line 1058).
9. **Environment:** staging, from the note "as staging the cronjob was disabled before this" (R20-R22).

## 2. What the ticket changed, as the TS shows it

1. **New UCD report page** — Reports › Download Payment Document. UCD picks **Payment Month** and **Year**, then clicks **Generate** (TS1 R2).
2. **Weekly result rows** — columns **Period**, **Total Transaction** ("Total of eSTM + STMS + APT transactions in respective week"), **Action** ("Download") (R2).
3. **Zip per week** named "{UCD Company ID}-YYYYMMDD-YYYYMMDD" (R3).
4. **Zip content** — Invoice and e-Invoice PDFs from **eSTM, STMS and APT** only, each named "{Transaction No.}_YYYYMMDD.pdf" (R4).
5. **On-demand build** — the design moved from a cronjob to the Generate button: "*Updates: ⏎ - No longer using cronjob ⏎ - Clicking [Generate] will generate latest set of documents" (R2, Note).
6. **Template split by date** — July 2025 onward shows the "new template" Invoice (R4); May 2025 shows the "old template" (R22).

## 3. Scenarios

### A. Past month, valid data

1. **8514_TS1** — July 2025, Generate, download each week, open zip. Expects "All weeks in July" (R2); zip "{UCD Company ID}-YYYYMMDD-YYYYMMDD" (R3); "Invoice PDF will display with new template" (R4) — **Pass**.

### B. Current month, new transactions

1. **8514_TS2** — new eSTM, STMS, APT transactions, MyKad / MyPR and Company, **valid TIN**. Expects "All weeks up until week before current week in current month" (R5) — **N/A**. No reason written for N/A.
2. **8514_TS3** — new transactions with **invalid or blank TIN**. Before fix: "Ensure contents of zip file have Invoice PDFs from eSTM, STMS & APT" (R10). After BO TIN fix and cronjob resubmit: "Ensure contents of zip file have Invoice & e-Invoice PDFs from eSTM, STMS & APT" (R13) — **Pass**.

### C. Existing data from before the deploy

1. **8514_TS4** — month with "existing completed & Approved transactions but with invalid or blank TIN" (R14). Same before/after pattern as TS3: Invoice only (R16), then Invoice & e-Invoice after resubmit (R19) — **Pass**.
2. **8514_TS5** — May 2025. "Invoice PDF will display with old template" (R22) — **Pass**, "based on patched data" (R20-R22, Note).

### D. All months

1. **8514_TS6** — Payment Month "Month" (all months of 2025). Expects "All weeks from each month up until current month for year of 2025" (R23); new template after July 2025 (R25); "Invoice PDF will remain with old template" before July 2025 (R26) — **N/A**. Behaviour left unchanged by decision (see §4 item 7).

## 4. Business rules and system behaviour

1. **Generate builds the files.** "No longer using cronjob ⏎ - Clicking [Generate] will generate latest set of documents" (R2, Note).
2. **Current week cannot be downloaded.** "Current week should not allow UCD to download payment document" (R5, Note; repeated R8, Note).
3. **Scope is three types.** "Total of eSTM + STMS + APT transactions in respective week" (R2 and every Generate row).
4. **Zip name.** "{UCD Company ID}-YYYYMMDD-YYYYMMDD ⏎ ⏎ *First YYYYMMDD based on the selected week starting range ⏎ *Second YYYYMMDD based on the selected week ending range" (R3).
5. **PDF name.** "{Transaction No.}_YYYYMMDD.pdf ⏎ ⏎ *YYYYMMDD based on date of the transaction" (R4).
6. **PDFs equal the details page.** "verify it is the same document with respect to the Invoice PDF & e-Invoice PDF downloaded from eSTM / STMS / APT details page" (R4).
7. **"Month" option is frozen.** "Confirmed with BA & PL, to remain 'Month' unchanged and PL will highlight to PO for 'Month' will only generate transactions from cronjob from January to June. ⏎ ⏎ As July 2025 onwards are based on realtime, will not include as result for 'Month'" (R23, Note).
8. **Invalid or blank TIN = Invoice only.** "Ensure contents of zip file have Invoice PDFs from eSTM, STMS & APT" (R10, R16) — no e-Invoice.
9. **TIN fix adds the e-Invoice.** "Proceed to Backoffice and update to valid TIN ⏎ 8. Wait for cronjob to resubmit transaction for e-Invoice submission" (R11), then "Invoice & e-Invoice PDFs" (R13). The e-Invoice resubmit is still a **cronjob**; only the zip build moved to Generate.
10. **Template by period.** New template for July 2025 (R4) and "after July 2025" (R25); "old template" for May (R22) and "before July 2025" (R26). Miro gives a **17 June** cutoff: "Invoice PDF Verify existing transactions before e-Invoice deployed - before Invoice cutoff date (on staging); before 17th June" (part1, line 319).
11. **Staging had no pre-July data.** "based on patched data, as staging the cronjob was disabled before this so unable to download any invoice for those transactions before july" (R20, Note).
12. **Dev help needed at first.** "Requires dev to help generate to see the report on listing" (R2, Note) — written before the "Updates" line in the same cell.
13. **Earlier design (Miro).** "Remain cronjob scheduled for each Monday 1 AM to generate for preceding 7 days Cronjob run at 28 July 2025 1 AM - Transactions between 22 to 28 July 2025" (part1, line 319). The R2 note overrides this [unconfirmed which reached production].
14. **Week length.** Miro example "22 to 28 July 2025" is Tuesday to Monday; EAINT-7496 example "2026-04-05_to_2026-04-11" is Sunday to Saturday. Week boundary may have changed with the Generate design [unconfirmed].

### Inconsistencies inside the sheet

1. **TS3 vs its own note.** Expected "All weeks up until current week in current month" (R8, R11) while the note says "Current week should not allow UCD to download payment document" (R8). TS2 says "up until week before current week" (R5). TS3 is Pass with the wider wording.
2. **TS5 date range.** Month "May" but Date Range "Any week within June" (R20-R22).
3. **Compare target differs.** TS1 and TS5 compare "Invoice PDF & e-Invoice PDF" (R4, R22); TS2-TS4 compare only "e-Invoice PDF" (R7, R10, R13, R16, R19), even where the zip holds Invoice PDFs only (R10, R16).
4. **Same file name for two PDFs.** Invoice and e-Invoice both follow "{Transaction No.}_YYYYMMDD.pdf" (R26: "Each Invoice PDF & e-Invoice PDF should have the following format"). Two files in one zip cannot share a name [unconfirmed how the system split them]. EAINT-7496 later uses "{Document_Code}_{Transcation_Type}_{Type_of_Invoice}".
5. **TS4 step 9** says "Select Current Month of resubmitted e-Invoice transactions" (R17), but its Month column is "Selected month with existing invalid/blank TIN transactions".
6. **TS6 step 4** downloads "for 'June 2025'" (R24), then steps 5-6 open zips "after July 2025" and "before July 2025" (R25-R26).

### Where this differs from current knowledge

1. `knowledge/flow-company-profile-einvoice.md` line 225: "The invalid/blank TIN template is used where it applies." The TS shows **invalid/blank TIN removes the e-Invoice** from the zip (R10, R16). The new/old **template** split is by **date** (July 2025), not by TIN (R4, R22, R25-R26).
2. `knowledge/flow-company-profile-einvoice.md` line 229: weekly zip cronjob "None now". Correct for the zip build (R2 note), but the **e-Invoice resubmit cronjob** after a TIN fix still exists (R11, R17) and is not listed under Cronjobs.
3. `knowledge/flow-company-profile-einvoice.md` line 239 cites the old zip name to "[ts: EAINT-8514 TS2]". TS2 is **N/A**; the Pass source is TS1 R3.
4. `knowledge/flow-company-profile-einvoice.md` line 252 dates EAINT-8514 "2025-07". Deploy was **20251013** (`production-regression-scope.md` line 1058; Miro "To deploy on: 13th Oct"). July 2025 is the test-data month and the old cronjob start [unconfirmed].
5. `knowledge/production-regression-scope.md` line 1058 labels it "e-Invoice batch cron". By deploy time the TS says "No longer using cronjob" (R2).
6. `knowledge/flow-company-profile-einvoice.md` line 216 says "past weeks only". TS3 Pass wording "up until current week" (R8) conflicts; the notes (R5, R8) and EAINT-7496 agree with past weeks only.
7. The **"Month" (all months) option** and its January-June limit (R23) are **not in knowledge/** at all.

## 5. Test data, environments, accounts, setup

1. **Environment:** staging (R20-R22 note).
2. **Accounts:** a UCD account with eSTM / STMS / APT transactions. Main or sub UCD not stated. **No credentials** in the sheet.
3. **Back Office** access to "update to valid TIN" (R11, R17).
4. **Filter values:** July 2025 (TS1), current month 2025 (TS2-TS3), a month with existing invalid/blank-TIN approved transactions (TS4), May 2025 (TS5), "Month" + 2025 (TS6).
5. **Transactions to create:** "one (new) transaction each MyKad / MyPR & Company from eSTM, STMS, APT" with valid TIN (R5) and with "invalid or blank TIN" (R8).
6. **Data patch:** pre-July 2025 data was patched because the staging cronjob had been disabled (R20).
7. **Dependency:** every zip step says "Dependent on whether your UCD have created eSTM / STMS / APT transaction(s) within selected month".

## 6. Gaps or risks a regression should still cover

1. **Valid TIN in current month (TS2) was never run** — N/A with no reason.
2. **"Month" option (TS6) was never run** — only a decision note. Behaviour for July 2025 onward under "Month" is untested.
3. **Current-week block** is a note, not a tested step; TS3 Pass wording contradicts it.
4. **Blank vs invalid TIN** are tested together; no separate blank-TIN run is recorded.
5. **Zip file-name collision** between Invoice and e-Invoice (§4 inconsistency 4).
6. **Weeks crossing a month edge** — labels and contents of partial first/last weeks.
7. **17 June vs July 2025 template cutoff** — transactions between 17 June and 30 June 2025 are not covered.
8. **Sub UCD** and multi-company UCD — not covered.
9. **Production check** was "No" (`production-regression-scope.md` line 1058).
10. **Superseded by EAINT-7496** — zip and PDF names, transaction types and filters changed later. Any regression must use 7496 rules, keeping 8514 only for the TIN and template rules that 7496 did not restate.

## Knowledge candidates

1. **Invalid/blank TIN zip = Invoice only; e-Invoice added after BO TIN fix + resubmit cronjob.** Source: "Ensure contents of zip file have Invoice PDFs from eSTM, STMS & APT" (EAINT-8514 Test Scenarios, R10, R16); "Proceed to Backoffice and update to valid TIN ⏎ 8. Wait for cronjob to resubmit transaction for e-Invoice submission" (R11). Fixes `knowledge/flow-company-profile-einvoice.md` line 225.
2. **Invoice template split by date.** New template July 2025 onward, old before. Source: "Invoice PDF will display with new template" (R4); "Invoice PDF will display with old template" (R22, May 2025); Miro cutoff "before 17th June" (part1, line 319) [unconfirmed which date is exact].
3. **"Month" (all months) option frozen to cronjob data January-June 2025.** Source: "Confirmed with BA & PL, to remain 'Month' unchanged … 'Month' will only generate transactions from cronjob from January to June" (R23, Note).
4. **e-Invoice resubmit cronjob** belongs under Cronjobs in `knowledge/flow-company-profile-einvoice.md` (R11, R17).
5. **Correct the EAINT-8514 date** in `knowledge/flow-company-profile-einvoice.md` line 252 to deploy **20251013**. Source: `knowledge/production-regression-scope.md` line 1058; Miro "To deploy on: 13th Oct" (part1, line 319).
6. **Re-point the old zip-name citation** from TS2 (N/A) to TS1 R3 (Pass) in `knowledge/flow-company-profile-einvoice.md` line 239.
