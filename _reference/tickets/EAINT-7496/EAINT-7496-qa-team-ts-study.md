# EAINT-7496 — QA Team test script study (2026-10-27)

## Sources read

1. **Text copy** of the workbook: `_reference/sharepoint/qa-team-ts/EAINT-7496 - Download Payment Document TH, BMK. eLKM, eVOC, SSM, JomCheck.md` (exported 27/10/2026, 9:11:45 pm). Cell text only — **colours, images and comments are not kept**. The red/green checkbox colours are known only from cell text.
2. `knowledge/business-rules-from-test-scenarios.md` §3 (lines 622-637) — already holds a summary of this TS.
3. `knowledge/cr-test-scenario-catalogue.md` rows 212 and 407 (catalogue entry #055).
4. `knowledge/flow-company-profile-einvoice.md` — "Flow: UCD payment reports and downloads" (lines 208-253).
5. `knowledge/flow-bmk.md` line 43; `knowledge/production-regression-scope.md` line 966.
6. **Not found:** `_reference/tickets/EAINT-7496/` (no prior files), `_reference/tickets/Studying/EAINT-7496/`, and no entry in `lib/ticketStudies.ts`.
7. **Not read:** the original .xlsx, the Jira ticket and any SRD. No SRD is in the repo for this ticket.

## 1. Header

1. **Ticket:** EAINT-7496 — "Download Payment Document TH, BMK. eLKM, eVOC, SSM, JomCheck".
2. **Module / portal:** **UCD portal › Reports › Download Payment Document(s)**.
3. **Workbook:** "EAINT-7496 - Download Payment Document TH, BMK. eLKM, eVOC, SSM, JomCheck.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 06/05/2026, 11:48:25 am.
4. **Sheets (3):**
   1. **Filter** — 4 field checks (7496_F_TS1 to F_TS4).
   2. **EAINT-7496 - Scenario** — 13 scenarios (7496_TS1 to TS13), 46 step rows.
   3. **Scenario** — a document matrix, 31 data rows, no result column.
5. **Scenarios:** **17** with a result (4 Filter + 13 Scenario).
6. **Results:** **all Pass** — 4/4 Filter rows, 46/46 Scenario step rows. No Fail, no blank result.
7. **Tester:** the "QA" column is **blank on every row**. The catalogue names a tester (`knowledge/cr-test-scenario-catalogue.md` row 212), but the sheet text does not.
8. **Dates:** none written in the sheet. Test data is **April 2026**. Production deploy **20260506**, listed as "UCD report (zero data)" (`knowledge/production-regression-scope.md` line 966).
9. **Environment:** not named in the sheet.

## 2. What the ticket changed, as the TS shows it

1. **Six new transaction types** on Download Payment Document: **Transfer History, BMK, eLKM, eVOC, SSM, JomCheck**. The earlier version (EAINT-8514) covered STMS, eSTM and APT only.
2. **Transaction Type is now 9 checkboxes** in two groups:
   1. **Red group:** STMS, eSTM, APT.
   2. **Green group:** Transfer History, BMK, eLKM, eVOC, SSM, JomCheck.
   3. One group can be ticked at a time.
3. **Zip name** is "payment_documents_{UCD_Company_ID}_YYYY-MM-DD_to_YYYY-MM-DD" (EAINT-7496 - Scenario, R6).
4. **PDF name** inside the zip is "{Document_Code}_{Transcation_Type}_{Type_of_Invoice}.pdf" (EAINT-7496 - Scenario, R7).
5. **Zip content** is limited to Invoice and e-Invoice: "Confirmed: Only Invoice & e-Invoice to be downloaded for EVERY Transaction Type" (EAINT-7496 - Scenario, R7, remark).

## 3. Scenarios

### A. Filter sheet

1. **7496_F_TS1** — Payment Month default. "Payment Month will default to the current month." (R2) — Pass.
2. **7496_F_TS2** — Payment Year default and range. "Payment Year will default to the current year. … The dropdown option will display past year until the current year only" (R3) — Pass.
3. **7496_F_TS3** — Transaction Type groups. "UCD can only multiple select STMS,APT,eSTM (red colour) as a group while the green becomes disabled. OR multiple select on the green ones and the red becomes disabled." (R4) — Pass.
4. **7496_F_TS4** — Generate output. Period = "All weeks in April", Total Transaction per week, Action = "Download hyperlink", "* If no transaction made in the week, column remains blank" (R5) — Pass.

### B. Red group — STMS / eSTM / APT (valid TIN, main UCD)

1. **7496_TS1** — STMS + eSTM + APT together. Zip has "Invoice & e-Invoice PDFs from eSTM, STMS & APT" (R7) — Pass.
2. **7496_TS2** — STMS only. Example file "EA-IV-0426-0000531_STMS_e-Invoice" (R11) — Pass.
3. **7496_TS3** — eSTM only. Example "EA-IV-0426-0000528_eSTM_e-Invoice" (R15) — Pass.
4. **7496_TS4** — APT only. Example "EA-IV-0426-0000579_APT_e-Invoice" (R19) — Pass.

### C. Green group — one type each (valid TIN, main UCD)

1. **7496_TS5** — Transfer History. Example "EA-IV-0426-0000701_OTH_e-Invoice" (R23) — Pass.
2. **7496_TS6** — BMK. Example "EA-IV-0426-0000599_BMK_Invoice" (R27) — Pass.
3. **7496_TS7** — eLKM. Compared with the "eSTM details page where eLKM is purchased"; example "EA-IV-0426-0000690_eLKM_Invoice" (R31) — Pass.
4. **7496_TS8** — eVOC. Compared with the "eSTM details page where eVOC is purchased"; example "EA-IV-0426-0000689_eVOC_Invoice" (R35) — Pass.
5. **7496_TS9** — SSM. "Ensure contents of zip file have SSM Invoice & SSM e-Invoice PDFs from SSM"; example "EA-IV-0426-0000626_SSM_Invoice" (R39) — Pass.
6. **7496_TS10** — JomCheck. Compared with the "JomCheck details page"; example "EA-IV-0426-0000550_JomCheck_Invoice" (R43) — Pass.

### D. Negative / permission / TIN

1. **7496_TS11** — UCD **without** SSM purchase permission. "SSM checkbox will be displayed but no data will appear if UCD ticks on the SSM Checkbox" (R47); Total Transaction "0 transaction", Action "Blank" (R48) — Pass.
2. **7496_TS12** — **Invalid TIN**, red group. "Ensure contents of zip file have only Invoice PDFs from eSTM, STMS & APT" (R54) — Pass.
3. **7496_TS13** — **Invalid TIN**, all six green types. "Ensure contents of zip file have only Invoice PDFs from Transfer History + BMK + eLKM + eVOC + SSM + JomCheck" (R60) — Pass.

### E. "Scenario" sheet (document matrix)

1. Per type and seller category, which documents exist: **Invoice, e-Invoice, JPJ Official Receipt, Slip Pengesahan TH, Slip Pengesahan, SSM Document, SSM Invoice, SSM e-Invoice, JomCheck Report** (Scenario, R3).
2. Split into "VALID TIN NUMBER" (R4-R19) and "INVALID TIN NUMBER" (R20-R35).
3. Header note: "*TBC if will be included together with STMS/eSTM/APT" (Scenario, R2).
4. No Pass/Fail. Read it as a planning table, not as executed tests [unconfirmed].

## 4. Business rules and system behaviour

1. **Past weeks only.** "* UCD can only download payment document for past weeks. Current & future weeks are unavailable for UCD to download" (EAINT-7496 - Scenario, R3, remark).
2. **Two exclusive groups, multi-select inside a group.** "UCD can only multiple select STMS,APT,eSTM (red colour) as a group while the green becomes disabled. OR multiple select on the green ones and the red becomes disabled." (Filter, R4). Green types combine freely: TS5 "Able to select together with options: - BMK - eLKM - eVOC - SSM - JomCheck ⏎ Options [STMS/APT/eSTM] will be disabled." (EAINT-7496 - Scenario, R21).
3. **Year range.** "The dropdown option will display past year until the current year only" (Filter, R3).
4. **Zip name.** "* Current system behaviour, downloaded zip file name is payment_documents_{UCD_Company_ID}_YYYY-MM-DD_to_YYYY-MM-DD ⏎ e.g: payment_documents_1110050_2026-04-05_to_2026-04-11" (EAINT-7496 - Scenario, R6, remark).
5. **PDF name.** "* Current system behaviour, downloaded individual file is named {Document_Code}_{Transcation_Type}_{Type_of_Invoice} ⏎ e.g: EA-IV-0426-0000528_eSTM_e-Invoice" (EAINT-7496 - Scenario, R7, remark).
6. **Invoice and e-Invoice only.** "* TBC (by Aishah) - if JPJ Official Receipt will be included in the STMS, eSTM and APT zip file ⏎ Confirmed: Only Invoice & e-Invoice to be downloaded for EVERY Transaction Type" (EAINT-7496 - Scenario, R7, remark).
7. **Transfer History file code is "OTH", not "TH".** Example "EA-IV-0426-0000701_OTH_e-Invoice" (EAINT-7496 - Scenario, R23).
8. **eLKM and eVOC documents come from the eSTM details page.** "…downloaded from eSTM details page where eLKM is purchased" (R31); "…where eVOC is purchased" (R35).
9. **SSM documents come from STMS and eSTM.** "…downloaded from STMS & eSTM details page where SSM is purchased" (EAINT-7496 - Scenario, R39).
10. **No SSM permission still shows the SSM box.** "SSM checkbox will be displayed but no data will appear if UCD ticks on the SSM Checkbox" (EAINT-7496 - Scenario, R47); "0 transaction ⏎ * UCD have no SSM transaction as UCD doesn't have the permission to purchase SSM" (R48).
11. **Invalid TIN = no e-Invoice.** "Ensure contents of zip file have only Invoice PDFs" (R54, R60). The matrix agrees: e-INVOICE is "false" on every invalid-TIN row (Scenario, R21-R35).
12. **SSM under invalid TIN** keeps SSM Document and SSM Invoice but not SSM e-Invoice: "false | false | false | false | false | true | true | false | false" (Scenario, R33-R34).
13. **Count wording differs.** Red group counts "transaction approved" (R5, R9, R13); APT and green types count "transaction made" (R17, R21 onward) [unconfirmed whether the system really counts differently].
14. **Week boundary.** The example "2026-04-05_to_2026-04-11" runs Sunday to Saturday (R6). Weeks are likely Sunday-start [unconfirmed].
15. **Document code** "EA-IV-0426-…" likely carries month-year "0426" = April 2026 [unconfirmed].

### Where this differs from current knowledge

1. `knowledge/flow-company-profile-einvoice.md` line 216 says "Totals = eSTM + STMS + APT". That is **8514 behaviour**; after 7496 totals cover the six green types too.
2. `knowledge/cr-test-scenario-catalogue.md` row 212 says "STMS/APT/eSTM selectable together; others exclusive". The TS shows the **green types are also selectable together** (Filter R4; EAINT-7496 - Scenario R21-R41, R58). "Others exclusive" is wrong if read as "one green at a time".
3. `knowledge/flow-company-profile-einvoice.md` line 225 mentions "The invalid/blank TIN template". This TS shows invalid TIN drops the **e-Invoice** from the zip — not stated there.
4. The "Scenario" matrix marks JPJ Official Receipt, Slip Pengesahan, SSM Document and JomCheck Report as "true" for some types. That conflicts with "Only Invoice & e-Invoice … for EVERY Transaction Type" (R7). The R7 remark is the later, confirmed rule; the matrix reads as document availability, not zip content [unconfirmed].

### Inconsistencies inside the sheet

1. **TS12 example contradicts its own rule.** Expects "only Invoice PDFs" but the example is "EA-IV-0426-0000528_eSTM_e-Invoice" (R54).
2. **TS13 same issue.** "only Invoice PDFs" but example "EA-IV-0426-0000528_SSM_e-Invoice" (R60).
3. **TS9 SSM** expects "SSM Invoice & SSM e-Invoice", yet the example name ends "_SSM_Invoice" — no sample of the SSM e-Invoice file name (R39).
4. **TS5 Transfer History** compares with the "STMS details page" (R23); no Transfer History details page named.
5. **TS11** expects "0 transaction" (R48), while Filter R5 says empty weeks stay "blank".
6. **TS12 section header** reads "Download Payment Document - STMS + eSTM + APT Transaction" (R49) — it does not say invalid TIN.
7. **TS11 step numbers** jump "7." then "4. Click the Generate button" (R48).

## 5. Test data, environments, accounts, setup

1. **Accounts:** "active Main UCD Account. UCD must have valid TIN Number & permission to Purchase SSM Document" (EAINT-7496 - Scenario, R3); a main UCD "that does not have the permission to Purchase SSM Document" (R45); a main UCD "that have Invalid TIN number" (R50, R56).
2. **No credentials** in the sheet text.
3. **Filter values:** Payment Month "April", Year "2026" in every scenario.
4. **Sample company ID:** "1110050" (zip example, R6).
5. **Data needed beforehand:** STMS, eSTM, APT, Transfer History, BMK, eSTM with eLKM, eSTM with eVOC, STMS/eSTM with SSM, and JomCheck transactions in April 2026. Each step notes "Dependent on whether your UCD have created … transaction(s) within selected month".
6. **Seller categories used in the matrix:** "MyKad / MyPR" and "Syarikat" (Scenario, R5-R6).
7. **Environment:** not named.

## 6. Gaps or risks a regression should still cover

1. **Current and future weeks** — the past-weeks-only rule is a remark (R3), not a tested step.
2. **Sub-user** — only Main UCD accounts are used.
3. **Blank TIN** — only valid and invalid TIN are tested. EAINT-8514 covered blank TIN (`knowledge/flow-company-profile-einvoice.md` line 244).
4. **Mixed green selections** other than "all six" (TS13) — e.g. BMK + JomCheck only.
5. **Weeks crossing a month edge** — how the first and last partial weeks of the month are labelled and filled.
6. **Year dropdown lower bound** — "past year" is vague; the earliest year is not stated.
7. **SSM e-Invoice file name** and **invalid-TIN file names** — sheet examples contradict the rule (§4 inconsistencies 1-3).
8. **Same transaction in two types** — e.g. an eSTM with eLKM ticked under both eSTM and eLKM; no duplication check exists in the TS [unconfirmed whether possible, since groups are exclusive].
9. **Prod deploy note "zero data"** (`knowledge/production-regression-scope.md` line 966) — prod check was done with no data, so real zip content was not seen in production [unconfirmed reading of "zero data"].
10. **Transfer History document source** — compared with STMS page only.

## Knowledge candidates

1. **Green group multi-select.** Transfer History, BMK, eLKM, eVOC, SSM, JomCheck can be ticked together; STMS/eSTM/APT disabled while any green is ticked. Source: "multiple select on the green ones and the red becomes disabled" (Filter, R4). Fixes `knowledge/cr-test-scenario-catalogue.md` row 212 "others exclusive".
2. **Totals after 7496** cover all nine types, not only eSTM + STMS + APT. Source: "Total number of Transfer History + BMK + eLKM + eVOC + SSM + JomCheck transaction approved in the respective week" (EAINT-7496 - Scenario, R58). Update `knowledge/flow-company-profile-einvoice.md` line 216.
3. **Invalid TIN zip = Invoice only, no e-Invoice.** Source: "Ensure contents of zip file have only Invoice PDFs" (EAINT-7496 - Scenario, R54, R60).
4. **Transfer History file code is "OTH".** Source: "EA-IV-0426-0000701_OTH_e-Invoice" (EAINT-7496 - Scenario, R23).
5. **eLKM/eVOC documents match the eSTM details page; SSM matches STMS and eSTM details pages.** Source: R31, R35, R39.
6. **No SSM permission:** SSM checkbox still shown, result "0 transaction", Action blank. Source: R47-R48.
7. **Week example Sunday-Saturday** ("2026-04-05_to_2026-04-11", R6) [unconfirmed as a rule].
