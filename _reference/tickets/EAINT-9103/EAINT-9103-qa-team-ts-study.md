# EAINT-9103 — QA Team test script study (2026-10-28)

Written unattended by the SharePoint Scribe. Read-only study; no knowledge/, lib/ or app/ file was changed.

## Sources read

1. **TS text copy** — `_reference/sharepoint/qa-team-ts/EAINT-9103- eAuto Services Portal - To update user interface by enhancing its design & to include the display of JomCheck & Insurance.md` (text copy dated "28/10/2026, 9:28:00 am"; "Cell text only, row by row; formatting and images are not kept."). Read in full, all 9 sheets.
2. **Not available:** the .xlsx itself (merged cells, colours and images not seen); no SRD; no Jira ticket read (no Jira access in this run).
3. **Ticket folders:** `_reference/tickets/EAINT-9103/` and `_reference/tickets/Studying/EAINT-9103/` did not exist before this study.
4. **`lib/ticketStudies.ts`:** no EAINT-9103 entry.
5. **knowledge/ hits for "9103":** `business-rules-from-test-scenarios.md` rows 862-871 (§ Service Portal items 4-7), `cr-test-scenario-catalogue.md` row 443 (TS #091), `production-regression-scope.md` row 1031.
6. **Context files:** `knowledge/flow-estm.md` (rows 722-730), `knowledge/esim.md` (rows 590-593), `knowledge/flow-jomcheck.md` (rows 34-49), `knowledge/flow-service-portal-shell.md` (rows 63-64, 158).

## 1. Header

1. **Ticket:** EAINT-9103.
2. **Portal / module:** eAuto **Services Portal** (bank / credit company portal) → **Ownership Claim Listing** and **Ownership Claim Details**. Also touches UCD + BO eSTM Details and the BO eSTM Transaction Listing **[Hak Milik]** hyperlink.
3. **Workbook:** "EAINT-9103- eAuto Services Portal - To update user interface by enhancing its design & to include the display of JomCheck & Insurance.xlsx", library "eAuto - CR Test Scenarios", modified 07/01/2026, 10:45:43 am.
4. **Sheets (9):**
   1. "E2E Flow (Azfar)" — early draft, 8 scenarios, all "Not Started", no QA name. Not counted in Overall Progress.
   2. "Overall Progress" — summary counts + visibility rule.
   3. "E2E Flow (latest changes)" — 4 E2E + 4 existing-transaction scenarios (16 rows).
   4. "E2E Flow" — 9 scenarios (TS1-TS5 happy, TS6-TS9 negative; 37 rows).
   5. "Jomcheck Special Handling" — 4 scenarios.
   6. "Transaction Tagging Logic" — 6 scenarios.
   7. "Existing Transaction" — 8 scenarios.
   8. "Func. Test (Listing page)" — 8 TS ids, 21 rows.
   9. "Sheet1" — decision tables for BBHM / Hak Milik / cronjobs.
5. **Result counts (Overall Progress, cached values):**
   1. "E2E Flow (latest changes)" — Pass "16", Count "16" (row 5).
   2. "E2E FLow TS" — Pass "37" (row 6).
   3. "JomCheck Report TS" — Pass "4" (row 7).
   4. "Transaction Tagging Logic" — Pass "6" (row 8).
   5. "Existing Transaction TS" — Pass "8" (row 9).
   6. "Functional TS (Listing Page)" — Pass "10" (row 10).
   7. "Total Count per Status" — "65", "Total Completion" "1" (row 11). The total formula is "SUM(C6:C10)", so it **excludes** the 16 rows of "E2E Flow (latest changes)".
   8. **No Fail** recorded anywhere. All result cells read "Pass" except the Azfar draft sheet ("Not Started").
6. **Count mismatch:** "Func. Test (Listing page)" has **21 rows** marked Pass, but Overall Progress counts "10". Cause [unconfirmed] — likely merged Result cells or a stale cached value.
7. **Tester:** every QA cell reads "Teck Yung" (except the Azfar draft, blank).
8. **Dates in the sheet:**
   1. "Retested on 29/11/2025" (Func. Test, row 21).
   2. "EAINT-8699: Assume deployment date = 19.11.2025" (Sheet1, row 2).
   3. "Yet to be deployed (as of 13.11.2025) (EAINT-8699 / EAUTO-595)" (Sheet1, row 23).
9. **Production deployment:** "| EAINT-9103 | 20251210 | Service Portal redesign | Part |" (`knowledge/production-regression-scope.md` row 1031).

## 2. What the ticket changed (as the TS shows it)

1. **New listing columns** on the Services Portal listing: **Jom Check** and **Insurance**. "The 'Jom Check ' column should appear to the right of 'eSTM approved date' and show " Yes "." and "The 'Insurance' column should appear to the right of 'eVOC' and show " Yes "." (E2E Flow (Azfar), row 3).
2. **New details tabs:** **Butir-butir Hak Milik**, **JomCheck** and **Insurance** tabs on the Ownership Claim Details page, each with a download. Tabs are hidden when there is no record.
3. **Bulk ZIP download** via "[Download files (n)]" — "eauto_service_portal.zip", one folder per transaction "{VehicleNo}_{BuyerID}" (E2E Flow (latest changes), row 4).
4. **Insurance download buttons by insurer** — "Print button removed and replaced based on insurer type" (E2E Flow (latest changes), row 8).
5. **Excel export** of the listing — "eauto_service_portal-yymmddhhmm.xlsx" (E2E Flow (latest changes), row 19).
6. **New filters** — JomCheck, Insurance, Hak Milik dropdowns; [Reset]; export audit log (Func. Test (Listing page), rows 3-23).
7. **Existing transactions** approved before deployment also gain JomCheck / Insurance when they match (Existing Transaction sheet).
8. Ticket title wording: "To update user interface by enhancing its design" — the **design / layout changes are not tested** as separate rows; only "Button position (doc top right corner)" is checked (E2E Flow (latest changes), rows 6-8).

## 3. Scenarios

### 3a. E2E Flow (latest changes) — new transactions

1. **9103_E2E_TS1** — eSTM + eVOC + BBHM + JomCheck + Insurance (Takaful), "Hak Milik = E". Expected: listing Jom Check "Yes", Insurance "Yes"; ZIP holds BBHM, JomCheck and insurance files; tabs + downloads correct; 12 Insurance tab fields "taken from Insurance Transaction Details page." Pass (rows 3-9).
2. **9103_E2E_TS2** — eSTM + eVOC + BBHM + JomCheck (no insurance), FIS Amount 20.00. Expected: Jom Check "Yes", Insurance " -"; ZIP holds BBHM + JomCheck. Pass (rows 11-15).

### 3b. E2E Flow (latest changes) — existing transactions

1. **9103_EX_TS1** — existing eSTM + BBHM with existing Insurance (Lonpac). Expected: ZIP with BBHM + Lonpac's two insurance files; "Show ALL Butir-butir Hak Milik, JomCheck and Insurance tabs". Pass, note "UC6638" (row 19).
2. **9103_EX_TS2** — existing eSTM + BBHM with existing Insurance (Chubb), no JomCheck. Pass (row 20).
3. **9103_EX_TS3** — existing eSTM + BBHM with existing JomCheck, no Insurance. Pass, note "EAKGN76" (row 21).
4. **9103_EX_TS4** — existing eSTM + BBHM, **new** Insurance (Tokio Marine) bought after deployment. Expected: listing + ZIP + all tabs updated. Pass (row 23).

### 3c. E2E Flow — happy path

1. **9103_E2E_TS1** — Individual, eSTM + eVOC + BBHM + JomCheck + Insurance (Takaful), BBHM bought in eSTM flow, "Hak Milik = E". Pass, note "Redo with Lonpac" (rows 3-9).
2. **9103_E2E_TS2** — Company, eSTM + eVOC + SSM + Insurance (Lonpac) + JomCheck, BBHM made by clicking BO **[Hak Milik]** hyperlink, "Hak Milik = E". Pass (rows 10-16).
3. **9103_E2E_TS3** — Individual, eSTM + eLKM + eVOC + JomCheck, BBHM made by "Cronjob 8523", "Hak Milik = E". Expected Insurance " - " and "Insurance tab are NOT displayed and hidden". Pass (rows 17-22).
4. **9103_E2E_TS4** — Individual, eSTM + 69E Insurance (Tokio Marine), FIS Revenue Code blank, "Cronjob 8699", "Hak Milik = J". Expected: "[Hak Milik] hyperlink remain hidden", UCD & BO "[Butir-butir Hak Milik] is NOT displayed", listing Jom Check " - ", Insurance "Yes", JomCheck tab hidden. Pass (rows 23-29).
5. **9103_E2E_TS5** — Individual, eSTM + eLKM + eVOC, BBHM by "Cronjob 8699", "Hak Milik = E". Expected Jom Check " - ", Insurance " - ", both tabs hidden. Pass (rows 30-35).

### 3d. E2E Flow — negative

1. **9103_E2E_TS6** — Insurance with "JPJ Status = Failed, Payment = OK, Tx Status = Insurance Created". Expected: "Show only Butir-butir Hak Milik and JomCheck tabs". Pass (row 41).
2. **9103_E2E_TS7** — JomCheck "Payment = OK, Tx Status = Failed (Failed to retrieve report)" + good insurance. Expected: "Show only Butir-butir Hak Milik and Insurance tabs". Pass (row 42).
3. **9103_E2E_TS8** — eSTM with response code 00, [Hak Milik] click gives "Update failed. Please retry.". Expected: "eSTM transaction with Status = Approved and without Butir-butir Hak Milik is NOT listed in the listing". Pass (row 43).
4. **9103_E2E_TS9** — JomCheck "Tx Status = Approved but eInvoice Status = Failed". Expected: JomCheck still shown ("Show only Butir-butir Hak Milik and JomCheck tabs"). Pass (row 44).

### 3e. Jomcheck Special Handling (one chain on the same vehicle)

1. **9103_JC_TS1** — JomCheck "Payment = Failed, Tx Status = Failed". Expected: "Show only Butir-butir Hak Milik tab, JomCheck tab is HIDDEN". Pass (row 3).
2. **9103_JC_TS2** — first approved JomCheck. Expected: BBHM + JomCheck tabs. Pass (row 4).
3. **9103_JC_TS3** — another JomCheck, "Tx Status = Failed (Failed to retrieve report)". Expected: "{Vehicle_No}_jomcheck.pdf > PREVIOUS Jomcheck". Pass (row 5).
4. **9103_JC_TS4** — another approved JomCheck + Insurance. Expected: "{Vehicle_No}_jomcheck.pdf > LATEST Jomcheck". Pass, with note "Differences are not separable since all the jomcheck documents are the same for staging. Can only verify that the jomcheck is still having "Yes" status and the jomcheck tab is displayed" (row 6).

### 3f. Transaction Tagging Logic

1. **9103_TL_TS1** — Company A Main UCD creates eSTM + eVOC. Expected: BBHM tab only. Pass (row 3).
2. **9103_TL_TS2** — Company A **Sub UCD** buys JomCheck, same vehicle. Expected: "Should show under the SAME eSTM Transaction in 9103_TL_TS1, ensure only one transaction with the same VN is shown in the listing page". Pass (row 4).
3. **9103_TL_TS3** — Company A Sub UCD buys Insurance. Expected: all three tabs on the same row. Pass (row 5).
4. **9103_TL_TS4** — Company A Main UCD creates eSTM (FIS Amount 20.00). Pass (row 6).
5. **9103_TL_TS5** — **Company B** Main UCD buys JomCheck on same vehicle. Expected: "The JomCheck and Insurance transactions should NOT show under the eSTM Transaction in 9103_TL_TS4 … WITHOUT JOMCHECK and INSURANCE". Pass (row 7).
6. **9103_TL_TS6** — Company B Sub UCD creates eSTM + eVOC "WITHOUT Hak Milik" + insurance. Same expected as TL_TS5. Pass (row 8).

### 3g. Existing Transaction (approved before 9103 deployment)

1. **9103_EX_TS1** — existing BBHM (E) with existing JomCheck + Insurance → all tabs. Pass (row 3).
2. **9103_EX_TS2** — existing JomCheck, no Insurance → BBHM + JomCheck tabs. Pass, note "On Hold … TY098765234 … WBBB055" (row 4).
3. **9103_EX_TS3** — existing Insurance, no JomCheck → BBHM + Insurance tabs. Pass (row 5).
4. **9103_EX_TS4** — existing BBHM (J), no JomCheck / Insurance → BBHM tab only. Pass (row 6).
5. **9103_EX_TS5** — existing BBHM (J) + **new** JomCheck + Insurance → all tabs. Pass, note "TY44455" (row 12).
6. **9103_EX_TS6** — existing BBHM (E), new JomCheck + existing Insurance. Pass (row 13).
7. **9103_EX_TS7** — existing + new JomCheck, no Insurance → "LATEST" JomCheck. Pass, note "Need Dev to help patch to see difference … ON HOLD" (row 14).
8. **9103_EX_TS8** — existing JomCheck + new Insurance → all tabs. Pass (row 15).

### 3h. Func. Test (Listing page)

1. **9103_SNF_TS1** — JomCheck dropdown All / Yes / -. Pass (rows 3-5).
2. **9103_SNF_TS2** — Insurance dropdown All / Yes / -. Pass (rows 6-8).
3. **9103_SNF_TS3** — Hak Milik dropdown All / E / J. Pass (rows 9-11).
4. **9103_SNF_TS4** — 5 multi-filter combos + export. Expected: "Both listing page and exported file display records matching the search & filter conditions". Pass (rows 12-16).
5. **9103_SNF_TS5** — [View] for Hak Milik E and J. Pass (rows 17-18).
6. **9103_SNF_TS6** — [Download] 1, 5 and 50 files. Pass; row 21 note "Only 49 files are saved into the file explorer when saving 50 files … Retested on 29/11/2025" (rows 19-21).
7. **9103_SNF_TS7** — [Reset] "Clears all filters". Pass (row 22).
8. **9103_SNF_TS8** — export audit trail. Expected: "The log should capture the User ID and the date & time of the activity". Pass (row 23).

### 3i. E2E Flow (Azfar) — draft, not run

1. **9103_E2E_TS01 – TS08** — same themes as 3c/3d (all combos of JomCheck / Insurance; three "NOT listed" negatives). All "Not Started" (rows 3-44). Superseded by "E2E Flow" [unconfirmed].

## 4. Business rules and system behaviour

1. **Matching rule (core).** "Only if fulfil of these conditions, JomCheck & Insurance records will appear in the respective Credit Company Service Portal" — "1. JomCheck - UCD + Vehicle Plate No similar to the corresponding eSTM trx that appears in the Service Portal" and "2. Insurance - UCD + Vehicle Plate No + New Owner IC similar to the corresponding eSTM trx that appears in the Service Portal" (Overall Progress, rows 16-18).
2. **"UCD" means the UCD company**, not the single user. Same-company Sub UCD purchases attach to the Main UCD's eSTM (Transaction Tagging Logic, rows 4-5); another company's purchases do not (rows 7-8).
3. **No BBHM = not listed.** "eSTM transaction with Status = Approved and without Butir-butir Hak Milik is NOT listed in the listing" (E2E Flow, row 43).
4. **BO [Hak Milik] hyperlink condition.** "Condition for BBHM hyperlink to appear on BO eSTM Trx Listing: 1. FIS Revenue Code must have value 2. BBHM is not generated yet" (Sheet1, row 15).
5. **[Hak Milik] click with STMS response 00** → "Error prompted "Update failed. Please retry."" (E2E Flow, row 43). The BBHM is generated after switching STMS Enquiry to **4K** (E2E Flow, row 10).
6. **BBHM generated only with 4K** — Sheet1 side table: "0.00 | 4K | Y" vs "0.00 | Other than 4K | N" (Sheet1, rows 3, 6).
7. **Hak Milik E vs J (portal column).** Sheet1 decision table: FIS Revenue Code "Have value" → "(f) Hak Milik" "E"; FIS Revenue Code "Empty", "Yes (by cj)" → "J" (Sheet1, rows 6, 8). Filter meaning: "E" = "Display records for UCD that purchased Butir-butir Hak Milik from eAuto"; "J" = "… from JPJ" (Func. Test, rows 10-11).
8. **BBHM button by Hak Milik.** Sheet1 columns "(g) UCD" / "(h) BO" under "Display BBHM Button": "Yes | Yes" for E rows, "No | No" for J rows (Sheet1, rows 6-8). E2E_TS4 (J): "[Butir-butir Hak Milik] is NOT displayed" in UCD & BO (E2E Flow, row 23).
9. **Cronjobs** (Sheet1, rows 21-26):
   1. "Existing (EAINT-8523 / EAUTO-546) Running Time: Hourly 8:30AM - 11:30PM Duration: 8 days from eSTM Approved date".
   2. "(EAINT-8699 / EAUTO-595) Running Time: 9AM, 12PM, 3PM, 6PM, 9PM Duration: 3 days from eSTM Approved date". With FIS Revenue Code empty: Hak Milik "J / Empty Note: Please refer to Listing Tab".
10. **Existing-transaction scope** (Sheet1, rows 10-13): "1. Transaction created from 1st Jan 2023 onwards", "2. Transaction with JPJ Approved 72 hours before the deployment", "(Pickup by 8699 cronjob)", "*m&m transaction type".
11. **ZIP content and file names** (E2E Flow (latest changes), row 4):
    1. "Butir-butir Hak Milik: Butir_{VehicleNo}.pdf".
    2. "Jom Check: {VehicleNo}_jomcheck.pdf".
    3. "For Chubb, Tokio Marine & Takaful > {vehicleno}_insurance.pdf".
    4. "For Lonpac: - Certificate Of Insurance > {vehicleno}_insurance.pdf - Policy Schedule > {vehicleno}_insurance_1.pdf".
12. **Insurance tab buttons** — "Chubb & Tokio Marine > Download Policy", "Takaful > Download E-Certificate", "Lonpac > Certificate Of Insurance + Policy Schedule"; "Button position (doc top right corner)" (E2E Flow (latest changes), row 8).
13. **JomCheck tab frame** — "Frame showing correctly and can be scrolled." and "Frame allows document to be Downloaded or Printed > Save as PDF." (E2E Flow (latest changes), row 7).
14. **Insurance tab fields** — Insurance Details: "Date Issued", "Insurance Company", "Insurance Plan", "E-Certificate No. / Policy No.", "Submission Status to JPJ", "Gross Premium"; Vehicle Details: 12 fields "Vehicle No" … "Year of Manufacturer"; "Ensure that these fields are taken from Insurance Transaction Details page." (E2E Flow (latest changes), row 9).
15. **Insurance with JPJ Status Failed is not shown**, even with "Tx Status = Insurance Created" (E2E Flow, row 41).
16. **JomCheck shown only when Tx Status = Approved.** Payment failed → tab hidden (Jomcheck Special Handling, row 3); "Failed to retrieve report" → not shown (E2E Flow, row 42); "eInvoice Status = Failed" does **not** block it (E2E Flow, row 44).
17. **Latest approved JomCheck wins;** a later failed one keeps the "PREVIOUS" one (Jomcheck Special Handling, rows 5-6).
18. **Empty value shows " - "** in Jom Check / Insurance columns (E2E Flow, row 17).
19. **Export audit** — "The log should capture the User ID and the date & time of the activity" (Func. Test, row 23).
20. **Hak Milik J and BBHM on UCD/BO** — tester note: "Hak Milk = j would show bbhm on UCD and BO side (Expected behaviour)" (Existing Transaction, row 14). This **contradicts** rule 8 above — see § 6.

## 5. Test data, environments, accounts, setup

1. **Accounts:** "Note: Test using both eAuto Ops and Credit Company accounts." (Overall Progress, row 12). UCD: Main UCD + Sub UCDs of Company A and Company B (Transaction Tagging Logic, rows 3-8). **No credentials** in the sheet.
2. **eSim setup:**
   1. "STMS Enquiry Respond" — response code "4K" or "00".
   2. "eSTM Enquiry Respond" — "Set FIS Revenue Code to 2354071" (or "blank"); "Set FIS Amount to" "0.00", "20.00" or "50.00".
   (E2E Flow, rows 3, 23, 41).
3. **Insurers used:** Takaful, Lonpac, Tokio Marine (69E), Chubb. Insurance bought "after Step 5" of eSTM or via "[GET A FREE QUOTE]".
4. **Environments:** "staging/preprod1" (for existing-transaction data, Existing Transaction, row 3); staging named in JC_TS4 note.
5. **Vehicle numbers in notes:** "QAA7789E", "UC6638", "EAKGN76", "TY098765234", "WBBB055", "TY44455", "TY0009999123", "NH8201", "TY098762323543", "TY3334445555", "TY111122222", "TY09876123456", "TY90001", "TY5678912", "TY4445555566". Staging data from late 2025; likely aged out [unconfirmed].
6. **Existing-data prep:** find an eSTM with "eSTM Approved Date = Before 9103 Deployment" and check "eSTM XML Log > WITH FIS Revenue Code + Amount" (Existing Transaction, row 3).

## 6. Gaps and risks for regression

1. **Hak Milik J + BBHM button contradiction.** E2E_TS4 expects "[Butir-butir Hak Milik] is NOT displayed" for J (E2E Flow, row 23), but the EX_TS7 note says J "would show bbhm on UCD and BO side (Expected behaviour)" (Existing Transaction, row 14). Behaviour on prod is unknown.
2. **Filter text looks copy-pasted wrong.** JomCheck "Yes" → "Displays records with eLKM"; Insurance "Yes" → "Displays records with eVOC" (Func. Test, rows 4, 7). Real filter logic is not proven by the written expected result [unconfirmed].
3. **Print vs download buttons.** Latest sheet says "Print button removed" for Insurance (E2E Flow (latest changes), row 8), but Existing Transaction and Tagging sheets still expect "Show [Print] button … BBHM, JomCheck & Insurance PDF". Which is right per insurer is unclear.
4. **Lonpac two-file ZIP** only covered in one existing-data row (E2E Flow (latest changes), row 19). Older sheets expect a single "{VehicleNo}_insurance.pdf" even for Lonpac (E2E Flow, row 11).
5. **50-file download saved 49** — "Only 49 files are saved into the file explorer when saving 50 files" still marked Pass (Func. Test, row 21). Possible real defect at max page size.
6. **LATEST vs PREVIOUS JomCheck never truly proven** on staging (Jomcheck Special Handling, row 6; Existing Transaction, row 14 "Need Dev to help patch").
7. **Internal inconsistencies** in expected results:
   1. EX_TS6 says "Show only Butir-butir Hak Milik and JomCheck tabs" but lists the Insurance file too (Existing Transaction, row 13).
   2. EX_TS2 objective "Hak Milik = E" but steps "WITHOUT FIS Revenue Code" and expected "Hak Milik = J" (Existing Transaction, row 4).
   3. Latest-sheet EX_TS1 objective "WITHOUT JOMCHECK" but pre-requisite "WITH existing JomCheck transaction" (row 19).
8. **Not covered:**
   1. Insurance matching on **New Owner IC** — no scenario with same UCD + plate but a different buyer IC.
   2. **Company buyer** for the insurance IC rule (only one Company row, E2E Flow row 10).
   3. Excel export **column content** for Jom Check / Insurance.
   4. **Permission / role** checks for credit-company users (who may see the tabs).
   5. Insurance cancelled / refunded / endorsed after it was shown.
   6. **Cronjob 8699** window edge (after 3 days) and 8523 (after 8 days).
   7. UI "design enhancement" layout itself.
9. **Overall Progress total ignores the latest-changes sheet** and miscounts Func. Test (10 vs 21 rows). Pass totals are not a reliable completion record.

## Knowledge candidates

1. **Ownership Claim flow doc is missing.** `knowledge/flow-service-portal-shell.md` rows 63-64 say "no flow doc yet" for Ownership Claim Enquiry / Listing. Candidate: new `knowledge/flow-service-portal-ownership-claim.md` from § 2-4 above. Source: this TS, all sheets.
2. **Correct the Hak Milik E/J meaning.** `knowledge/flow-estm.md` rows 727-729 and `knowledge/esim.md` rows 590-592 say J = bought from JPJ by the cronjob because of **4K**. This TS sets 4K for E scenarios too ("Set prefix's response code to 4K" … "Hak Milik = E", E2E Flow (latest changes), row 3) and ties E/J to the **FIS Revenue Code**: "Have value" → "E", "Empty" → "J" (Sheet1, rows 6, 8). 4K decides whether BBHM is generated at all (Sheet1, row 3-6 side table). Source: SharePoint TS #091 EAINT-9103, Sheet1.
3. **Error text wording.** flow-estm row 724 quotes EAINT-8523: "Upload failed. Please retry."; this TS quotes "Update failed. Please retry." (E2E Flow, row 43). One of them is a typo; check live [unconfirmed].
4. **BO [Hak Milik] hyperlink condition** — "1. FIS Revenue Code must have value 2. BBHM is not generated yet" (Sheet1, row 15). Add to flow-estm.
5. **Cronjob schedules** — 8523 "Hourly 8:30AM - 11:30PM", "8 days from eSTM Approved date"; 8699 "9AM, 12PM, 3PM, 6PM, 9PM", "3 days from eSTM Approved date" (Sheet1, rows 21-26). Add to flow-estm.
6. **Tagging rule** — same UCD company (Main or Sub) links JomCheck/Insurance to the eSTM row; another company does not (Transaction Tagging Logic, rows 4-8). Add to flow-jomcheck and the new Ownership Claim doc.
7. **Visibility filters** — Insurance with JPJ Status Failed not shown (E2E Flow, row 41); JomCheck needs Tx Status Approved, eInvoice Failed still shown (rows 42, 44); latest approved JomCheck wins (Jomcheck Special Handling, rows 5-6). Add to flow-jomcheck / eauto-insurance.
8. **Small fix in business-rules-from-test-scenarios.md item 4** (row 862-863): it says 'Insurance' column "after it"; TS says "to the right of 'eVOC'" (E2E Flow (Azfar), row 3).
9. **Insurance download file names per insurer** incl. Lonpac's "_insurance_1.pdf" (E2E Flow (latest changes), row 4). Add to eauto-insurance.md.
10. **Export file name** "eauto_service_portal-yymmddhhmm.xlsx" and audit log of User ID + date/time (E2E Flow (latest changes), row 19; Func. Test, row 23).
11. **Quirk:** staging JomCheck PDFs are all identical, so LATEST vs PREVIOUS cannot be told apart by content (Jomcheck Special Handling, row 6). Add to quirks.md.
