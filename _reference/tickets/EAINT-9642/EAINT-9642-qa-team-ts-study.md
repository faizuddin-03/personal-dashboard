# EAINT-9642 — QA Team test script study (2026-10-27)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9642-🔴[eAuto] To display JPJ Official Receipt number.md` (captured 27/10/2026, 9:02:26 pm). Cell text only; formatting, colours and images not kept.
2. **Knowledge files (grep EAINT-9642):** `knowledge/cr-test-scenario-catalogue.md` rows 260 and 461; `knowledge/business-rules-from-test-scenarios.md` item 12 (lines 761-764); `knowledge/flow-stms.md` lines 85 and 151; `knowledge/production-regression-scope.md` line 958.
3. **Context files:** `knowledge/flow-platform.md` "Flow: JPJ enquiry, final submission and Official Receipt (shared rules)"; `knowledge/flow-bmk.md` (JPJ Reports line 42).
4. **Not found:** `_reference/tickets/EAINT-9642/` (no files before this study), `_reference/tickets/Studying/EAINT-9642/` (does not exist), `lib/ticketStudies.ts` (no EAINT-9642 entry).
5. **Not read:** the Jira ticket and any SRD. This run had no Jira access; the ticket description, fix version and SRD wording are unknown.

## 1. Header

1. **Ticket:** EAINT-9642, "🔴[eAuto] To display JPJ Official Receipt number" (JPJ Reports!R2).
2. **Module / portal:** BackOffice **JPJ Reports** transaction listings, plus **JPJ Hasil** listings. JPJ Hasil sheet module names are in Malay, e.g. "Senarai Transaksi STMS, APT dan eSTM eAuto" (JPJ Hasil!R4).
3. **Workbook:** "EAINT-9642-🔴[eAuto] To display JPJ Official Receipt number.xlsx", library "eAuto - CR Test Scenarios", modified 20/05/2026, 9:47:03 am.
4. **Sheets:** 2 — "JPJ Reports" (10 scenarios) and "JPJ Hasil" (10 scenarios).
5. **Scenarios:** **20** total.
6. **Results:** **20 Pass, 0 Fail** (Test Result column, both sheets).
7. **Tester and dates:** not written in the sheet. The catalogue names the tester as a QA engineer (Maisarah Nuraliyaa Binti Masrom) and date 2026-05-20 (`knowledge/cr-test-scenario-catalogue.md` row 260) — taken from SharePoint metadata, not the sheet.

## 2. What the ticket changed, as the TS shows it

1. **New column "NO. RESIT JPJ"** in the BO JPJ Reports transaction listings and their **Excel export** (JPJ Reports!R4-R13).
2. **New column "NO. RESIT"** in the JPJ Hasil listings and export (JPJ Hasil!R4-R13).
3. The column carries the **JPJ Official Receipt number**; expected "JPJ Official Receipt number displayed is accurate" (both sheets, Expected Result, every row).
4. **Listings covered:** "STMS, APT and eSTM Transaction Listing" (tick boxes STMS, APT, eSTM, eHAK), "eAuto BMK, HTM and eLKM Transaction Listing" (BMK, HTM, eLKM), "eAuto eDereg Pre-Checking Transaction Listing" (eDereg Pre-Checking).
5. [unconfirmed] The receipt number comes from the JPJ Official Receipt delivered by email under EAINT-9204 (`knowledge/flow-platform.md` line 206). The TS does not say where the number comes from.

## 3. Scenarios

All rows share the same three checks: column shows in listing, column shows in exported Excel, number is accurate.

### a. Sheet "JPJ Reports" — column "NO. RESIT JPJ"

1. **JPJR_TS1** (R4) — STMS, APT and eSTM listing, tick **STMS**. Expected: "\"NO. RESIT JPJ\" is displayed in the listing", "\"NO. RESIT JPJ\" is displayed in exported excel", "JPJ Official Receipt number displayed is accurate". **Pass**.
2. **JPJR_TS2** (R5) — same listing, tick **APT**. Same expected. **Pass**.
3. **JPJR_TS3** (R6) — same listing, tick **eSTM**. Same expected. **Pass**.
4. **JPJR_TS4** (R7) — same listing, tick **eHAK**. Same expected. **Pass**.
5. **JPJR_TS5** (R8) — same listing, tick "STMS, APT, eSTM and eHAK" (**all four**). Same expected. **Pass**.
6. **JPJR_TS6** (R9) — BMK, HTM and eLKM listing, tick **BMK**. Same expected. **Pass**.
7. **JPJR_TS7** (R10) — same listing, tick **HTM**. Same expected. **Pass**.
8. **JPJR_TS8** (R11) — same listing, tick **eLKM**. Same expected. **Pass**.
9. **JPJR_TS9** (R12) — same listing, tick "BMK, HTM, eLKM" (**all three**). Same expected. **Pass**.
10. **JPJR_TS10** (R13) — eDereg Pre-Checking listing, tick **eDereg Pre-Checking**. Same expected. **Pass**.

### b. Sheet "JPJ Hasil" — column "NO. RESIT"

1. **JPJH_TS1** (R4) — "Senarai Transaksi STMS, APT dan eSTM eAuto", tick **STMS**. Expected: "\"NO. RESIT\" is displayed in the listing", "\"NO. RESIT\" is displayed in exported excel", "JPJ Official Receipt number displayed is accurate". **Pass**.
2. **JPJH_TS2** (R5) — same, tick **APT**. **Pass**.
3. **JPJH_TS3** (R6) — same, tick **eSTM**. **Pass**.
4. **JPJH_TS4** (R7) — same, tick **eHAK**. **Pass**.
5. **JPJH_TS5** (R8) — same, tick **all four**. **Pass**.
6. **JPJH_TS6** (R9) — "Senarai Transaksi BMK, HTM dan eLKM eAuto", tick **BMK**. **Pass**.
7. **JPJH_TS7** (R10) — same, tick **HTM**. **Pass**.
8. **JPJH_TS8** (R11) — same, tick **eLKM**. **Pass**.
9. **JPJH_TS9** (R12) — same, tick **all three**. **Pass**.
10. **JPJH_TS10** (R13) — "Senarai Transaksi eDereg Pre-Checking", tick **eDereg Pre-Checking**. **Pass**.

## 4. Business rules and system behaviour the TS reveals

1. **Column name differs by portal:** "NO. RESIT JPJ" in JPJ Reports (JPJ Reports!R4-R13, Test Scenarios) and "NO. RESIT" in JPJ Hasil (JPJ Hasil!R4-R13, Test Scenarios).
2. **Report flow (both sheets):** "1. Go to BO > eAuto STMS, APT and eSTM Transaction Listing ⏎ 2. Insert date \"Payment From\" and \"Payment To\" ⏎ 3. Tick checkbox STMS ⏎ 4. Click \"Generate Now\" button ⏎ 5. Click \"Export\" button" (JPJ Reports!R4, Test Steps). The filter is by **payment date**, then **Generate Now**, then **Export**.
3. **eHAK is a tick box on the STMS, APT and eSTM listing:** "Tick checkbox eHAK" (JPJ Reports!R7). The combined run ticks "STMS, APT, eSTM and eHAK" (JPJ Reports!R8). Not recorded in any knowledge file before this study.
4. **BMK, HTM and eLKM share one listing** with three tick boxes: "Tick checkbox BMK, HTM, eLKM" (JPJ Reports!R12).
5. **eDereg Pre-Checking has its own listing:** "Go to BO > eAuto eDereg Pre-Checking Transaction Listing" (JPJ Reports!R13).
6. **Old data was checked:** remarks split each scenario into four data ages, e.g. "JPJR_TS1.1 - latest ✅ ⏎ JPJR_TS1.2 - middle ✅ ⏎ JPJR_TS1.3 - oldest ⏎ JPJR_TS1.4 - SIT ✅" (JPJ Reports!R4, Remarks). [unconfirmed] "latest / middle / oldest" are transaction dates across the history, and "SIT" is data created during SIT.

## 5. Test data, environments, accounts, setup

1. **Environment:** only "SIT" appears, in the Remarks sub-cases (e.g. "JPJR_TS5.4 - SIT ✅", JPJ Reports!R8). No staging/uat name in the sheet. The catalogue tags the environment "sit" (`knowledge/cr-test-scenario-catalogue.md` row 260).
2. **Test data:** existing transactions in four groups — latest, middle, oldest, SIT (JPJ Reports Remarks). No vehicle numbers, transaction numbers or receipt numbers are written.
3. **Accounts:** none named. **No credentials** in the sheet.
4. **Access:** JPJ Reports is "SuperAdmin only" (`knowledge/flow-stms.md` line 289, from EAINT-10038). The TS does not name the BO role used.

## 6. Gaps and risks a regression should still cover

1. **Unticked sub-cases despite overall Pass.** These Remarks lines have no ✅: "JPJR_TS1.3 - oldest" (R4), "JPJR_TS2.4 - SIT" (R5), "JPJR_TS3.4 - SIT" (R6), "JPJR_TS4.4 - SIT" (R7), "JPJR_TS6.4 - SIT" (R9), "JPJR_TS7.4 - SIT" (R10), "JPJR_TS8.4 - SIT" (R11), "JPJR_TS9.4 - SIT" (R12), "JPJR_TS10.4 - SIT" (R13). [unconfirmed] Either no data existed or the tick was missed.
2. **JPJ Hasil sheet has no Remarks** (JPJ Hasil!R4-R13). No record of which data ages were checked there.
3. **JPJ Hasil steps look copy-pasted.** Every JPJ Hasil row says "Go to BO > eAuto STMS, APT and eSTM Transaction Listing", even for BMK (JPJ Hasil!R9) and eDereg Pre-Checking (JPJ Hasil!R13). The steps never name the JPJ Hasil portal. A regression should write the real JPJ Hasil path.
4. **"Accurate" is not defined.** No row says what the number is compared against (receipt PDF, JPJ email, DB). A regression should compare against the JPJ Official Receipt PDF on Transaction Details.
5. **No negative case:** transaction **without** a received receipt (cell blank? "-"?), and Failed/Cancelled transactions. Relevant because receipts can be lost when the mailbox poll is throttled (`knowledge/flow-platform.md` line 216, EAINT-12222).
6. **No column position or export file check:** order of the new column, header text in the Excel, and file name are not recorded.
7. **Modules missing:** Transfer History is covered by EAINT-9204 receipts (`knowledge/flow-platform.md` line 206) but has no listing in this TS. [unconfirmed] whether TH appears in a JPJ Report.
8. **PDF downloads** of JPJ Hasil reports are not tested (a separate PDF mismatch bug existed: EAINT-11823, `knowledge/cr-test-scenario-catalogue.md` line 249).

## 7. Fit with existing knowledge

1. **Consistent** with `knowledge/business-rules-from-test-scenarios.md` item 12 and `knowledge/flow-stms.md` line 85 (column names "NO. RESIT JPJ" / "NO. RESIT").
2. **Narrow in flow-stms.md:** line 151 says "NO. RESIT JPJ column in BO reports" — the TS shows the change also covers APT, eSTM, eHAK, BMK, HTM, eLKM and eDereg Pre-Checking listings, not only STMS.
3. **Not yet in** `knowledge/flow-bmk.md`, `knowledge/flow-apt.md`, `knowledge/flow-estm.md`, `knowledge/flow-edereg.md` ticket histories.

## Knowledge candidates

1. **eHAK is a tick box on BO "STMS, APT and eSTM Transaction Listing" (JPJ Reports)** — "Tick checkbox eHAK" `[from SharePoint TS EAINT-9642, sheet JPJ Reports, row 7]`. Target: `knowledge/flow-stms.md` or a JPJ Reports section.
2. **JPJ Reports run steps:** "Insert date \"Payment From\" and \"Payment To\"" → tick module → "Generate Now" → "Export" `[from SharePoint TS EAINT-9642, sheet JPJ Reports, row 4]`. Target: BO reports notes in `knowledge/eauto-portals.md` or flow files.
3. **Three JPJ Reports listings:** "STMS, APT and eSTM Transaction Listing", "eAuto BMK, HTM and eLKM Transaction Listing", "eAuto eDereg Pre-Checking Transaction Listing" `[from SharePoint TS EAINT-9642, sheet JPJ Reports, rows 4, 9, 13]`.
4. **Ticket history line for EAINT-9642 (2026-05)** in `flow-apt.md`, `flow-estm.md`, `flow-bmk.md`, `flow-edereg.md`: "NO. RESIT JPJ" (JPJ Reports) / "NO. RESIT" (JPJ Hasil) column in listing and export `[from SharePoint TS EAINT-9642, sheets JPJ Reports and JPJ Hasil, rows 4-13]`.
5. **JPJ Hasil module names (Malay):** "Senarai Transaksi STMS, APT dan eSTM eAuto", "Senarai Transaksi BMK, HTM dan eLKM eAuto", "Senarai Transaksi eDereg Pre-Checking" `[from SharePoint TS EAINT-9642, sheet JPJ Hasil, rows 4, 9, 13]`.
6. **Regression gap to record:** no TS covers a transaction with no JPJ Official Receipt yet (blank-cell behaviour) `[inferred from SharePoint TS EAINT-9642, both sheets]` [unconfirmed].
