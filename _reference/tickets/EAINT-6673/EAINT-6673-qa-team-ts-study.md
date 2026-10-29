# EAINT-6673 — QA Team test script study (2026-10-28)

## Sources read

1. **Text copy of the workbook:** `_reference/sharepoint/qa-team-ts/EAINT-6673 - [eAuto-Insurance] To update Insurance Invoice to Official Receipt.md` (first study: copy generated 28/10/2026, 1:33:47 am; re-read: copy generated "28/10/2026, 9:13:41 am", line 1). Cell text only; cell colours, images and the original xlsx were **not** read. The colour key survives only as emoji in the "Change type" column.
2. **Ticket folders:** `_reference/tickets/EAINT-6673/` held nothing before this study. `_reference/tickets/Studying/EAINT-6673/` does not exist.
3. **lib/ticketStudies.ts:** no entry for EAINT-6673.
4. **knowledge/:** `business-rules-from-test-scenarios.md` §6.4 (lines 456-463), `flow-insurance-purchase.md` (lines 601-605), `cr-test-scenario-catalogue.md` (rows 051 and 125), `production-regression-scope.md` (line 1122), `flow-estm.md` (lines 703, 801-802).
5. **Not read:** the SRD ("SRD v1.5" is cited in the sheet but no copy was found), the Jira ticket, and the older "[OUTDATED] EAINT-6673 - [eAuto] [Insurance] Official Receipt.xlsx" (catalogue #125; no text copy in `_reference/sharepoint/qa-team-ts/`). Facts from #125 below come only through `knowledge/`.

## 1. Header

1. **Ticket:** EAINT-6673 — "[eAuto-Insurance] To update Insurance Invoice to Official Receipt".
2. **Module / portal:** eAuto Insurance. **UCD** Insurance Details page, **BO** Insurance Details page, **UCD** eSTM Details page (FUNCT TEST TABLE, R36 Remarks: "Page affected: 1. Insurance details page (UCD & BO) 2. eSTM detais page (UCD)").
3. **Workbook:** "EAINT-6673 - [eAuto-Insurance] To update Insurance Invoice to Official Receipt.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 20/02/2026, 9:51:43 am.
4. **Sheets:** "FUNCT TEST TABLE ", "E2E TS", "Prod regression".
5. **Scenario count:** **31** total.
   1. FUNCT TEST TABLE: **20** field/control rows (1a-1r = 18, plus the button row R36 and the file-name row R37).
   2. E2E TS: **7** (EAINT6673_TS1-TS7).
   3. Prod regression: **4** (TS1-TS4).
6. **Results recorded:**
   1. E2E TS: **7 Pass, 0 Fail** (column "Test Result").
   2. Prod regression: **4 PASS, 0 Fail**.
   3. FUNCT TEST TABLE: **17 of 20** rows carry a ✅ tick. **No tick** on 1c Payment Reference No. (R15), 1l Total Net Premium (R26), 1m Amount Paid (R27).
7. **Testers named in the sheet:** two QA engineers in the "QA" column (Zuhaira, Nick). The catalogue lists the workbook owner as another QA engineer (`cr-test-scenario-catalogue.md` row 051).
8. **Dates in the sheet:** none for test execution. Date bands only (see §3).
9. **Environment:** "Test environment: staging/??" (FUNCT TEST TABLE, R1). Not settled in the sheet.

## Changes since last study (2026-10-28)

1. **Method:** the earlier text copy was overwritten, so no file diff was possible. Every row of the new copy was checked against the quotes, ticks, results and references in this study.
2. **Workbook modified date unchanged:** still "20/02/2026, 9:51:43 am" per the task brief. The SharePoint change is likely only a re-export [unconfirmed].
3. **New scenarios:** none. **Removed scenarios:** none. Still 20 + 7 + 4 = **31**.
4. **Changed scenarios:** none found. Steps, expected results and QA names in E2E TS R4-R12 and Prod regression R6-R9 match this study.
5. **Result changes:** none. E2E TS still **7 Pass**; Prod regression still **4 PASS**; FUNCT TEST TABLE still has no tick on R15, R26, R27.
6. **Details missed in the first study** (present in the sheet, not new):
   1. **Step numbering gaps:** TS1 goes from "13. Proceed with insurance purchase until complete" to "15. Complete eSTM Transaction until Step 6" (E2E TS, R4). TS2 goes from "4. Redirect to Insurance Quotation Page Step 1" to "6. Select Tokio Marine" (E2E TS, R5). No step looks lost [unconfirmed].
   2. **TS6 old-button check conflicts with the rule:** step 5 says "Select Takaful (TPFT)" but step 7 expects "UCD/BO insurance Details page: [Invoice]" (E2E TS, R10). The rule says "ii. Other Insurers - Print Invoice" (FUNCT TEST TABLE, R36). Added to §6 item 6.
   3. **Record refs sit in an unlabelled column:** "B61003783" (R7) and "B61003787" (R9) follow "Test Result"; the header has no column for them (E2E TS, R2).
   4. **Prod regression has two header rows:** R4 "Expected Result" and R5 "UCD & BO insurance details page" (Prod regression, R4-R5).

## 2. What the ticket changed, as the TS shows it

1. The insurance **Invoice** document becomes an **Official Receipt** with new labels, new fields and a new layout. Objective: "To ensure the Insurance Invoice is updated to Official Receipt with correct labels, format, and file name" (FUNCT TEST TABLE, R2).
2. **Renamed labels** (🟦): Invoice No → RECEIPT NO., Date → DATE OF ISSUE, Ref No → PAYMENT REFERENCE NO., Customer Name → PAYMENT FROM, Vehicle No → VEHICLE REGISTRATION NO., Total Sales → TOTAL NET PREMIUM and AMOUNT PAID, Invoice → OFFICIAL RECEIPT (R13-R15, R17, R22, R26-R27, R34).
3. **New fields** (🟩): INSURED'S NAME, INSURED'S ADDRESS, INSURER, COVER NOTE/ POLICY NO., VEHICLE MAKE & MODEL, POLICY PERIOD, OUTSTANDING (IF ANY), ISSUED BY:, Important Notes & Disclaimer (R18-R21, R23-R24, R28, R30-R31).
4. **Unchanged** (⚪️): Agency Details block — "As per existing" (R32).
5. **Buttons standardised** for all insurers: "[Receipt] button - UCD & BO Insurance details page" and "[Insurance Receipt] button - UCD eSTM details page", with "Notes: Standardize button name for All Insurers" (R36).
6. **File name:** "Invoice.pdf" → "Receipt_VehicleNo.pdf ⏎ E.g.: Receipt_WA1234.pdf" (R37).
7. **Old records stay as Invoice** — transactions before 1 January 2026 keep the old button, file name and layout (E2E TS, R12; Prod regression, R6-R7).

## 3. Scenarios

### 3a. FUNCT TEST TABLE — receipt fields (from SRD v1.5 Tables 1-3, 1o-1r, Table 2.2.2)

1. **1a Receipt No.** — format "{OR}{MMYY}{0001}", sample "OR-0425-0001"; running number "will be reset by each month starting from 0001" (R13). ✅
2. **1b Date of Issue** — "{ddMMMMyyyy}", sample "2025-04-15", "Display date only" (R14). ✅
3. **1c Payment Reference No.** — "{yymmdd}{0120}{0001}-{vehicle_no}", sample "25041501200003-WMN7304" (R15). **No tick.**
4. **1d Payment From** — "Uppercase Text - {Full Name}", dealer (UCD) that paid, "Retrieved from eSTM - Step 3 / BO" (R17). ✅ "Alphabet" only.
5. **1e Insured's Name** — vehicle owner, individual or company, "Retrieved from eSTM - Step 1" (R18). ✅ "Alphabet" only.
6. **1f Insured's Address** — comma rules, four address scenarios, "Retrieved from eSTM - Step 2" (R19). ✅ Scenarios 1-4.
7. **1g Insurer** — uppercase insurance company name (R20). ✅ Takaful, Lonpac, TMIM, Chubb.
8. **1h Cover Note / Policy No.** — uppercase, sample "TMCA5781560" (R21). ✅
9. **1i Vehicle Registration No.** — uppercase, "Add space between alphabet and ⏎ number", e.g. "BJE 8817", "VAK 1234 W" (R22). ✅
10. **1j Vehicle Make & Model** — uppercase, from Insurance Details page dropdown or "input if OTHERS" (R23). ✅
11. **1k Policy Period** — "{ddMMMMyyyy} to {ddMMMMyyyy}", sample "17 APRIL 2025 to 16 APRIL 2026" (R24). ✅
12. **1l Total Net Premium** — "Currency (RM0.00)", "Display same amount as Amount Paid" (R26). **No tick.**
13. **1m Amount Paid** — "Currency (RM0.00)", "Display same amount as Total Net Premium" (R27). **No tick.**
14. **1n Outstanding (if any)** — "Outstanding = Total Net Premium - Amount Paid", "if 0 > NIL" (R28). ✅ "Nil" only.
15. **1o Issued By:** — "Uppercase Text & Bold (Agency Company Name)" (R30). ✅ both agencies.
16. **1p Important Notes & Disclaimer** — static text block (R31). ✅
17. **1q Agency Details** — name, BRN, address "As per existing" (R32). ✅ both agencies.
18. **1r Official Receipt** — document title, "Refer to file name" (R34). ✅
19. **R36 Buttons** — [Receipt] on UCD/BO Insurance Details, [Insurance Receipt] on UCD eSTM Details. ✅ "Takaful Comp" only.
20. **R37 File name** — "Receipt_VehicleNo.pdf". ✅

### 3b. E2E TS — "Transactions From 21st January 2026 onwards" (R3)

1. **EAINT6673_TS1 / EAINT9564_TS1** — Bintang Prospek, Takaful (Comprehensive), MyKad, Main UCD (East Coast). Entry: insurance after **successful eSTM Step 5 payment**; also checks insurer priority order (shared with EAINT-9564). Expected: [Receipt] on Insurance Details (UCD & BO), [Insurance Receipt] on eSTM Details (UCD), "Receipt_VehicleNo.pdf", new template (R4). **Pass.**
2. **EAINT6673_TS2** — Pemaju Eksklusif, Tokio Marine (Bike), MyPR, Sub UCD. Entry: insurance after **VEL000069E at eSTM Step 5 (Xstar)**; before deployment stop at "Step 3 status = Payment Failed"; after deployment "Resubmit" from Insurance Transaction Listing, "Land on Insurance page at Step 3" (R5). Expected: same as TS1. **Pass.**

### 3c. E2E TS — "Transactions Between 1st January 2026 – 20th January 2026" (R6)

1. **EAINT6673_TS3** — Bintang Prospek, Chubb, Company, Main UCD. Entry: **insurance banner** on eSTM Details, "[Get Free Quote for {vn}]". Bought **before** deployment, invoice checked; **after** deployment the same record must show "Official Receipt (replaced the old Insurance Invoice)" (R7). Ref B61003783. **Pass.**
2. **EAINT6673_TS4** — Pemaju Eksklusif, Lonpac, MyKad, Sub UCD. eSTM approved before deployment; after deployment "Insurance > Get a Free Quote", "Category = Individual", "[Show My Result]", buy Lonpac (R8). **Pass.**
3. **EAINT6673_TS5** — Bintang Prospek, Takaful (TPFT), MyPR, Main UCD. 69E (Non-Xstar); before deployment stop at "Step 3 status = Pending Payment"; after deployment Resubmit from Insurance Transaction Listing, lands at Step 3, complete (R9). Ref B61003787. **Pass.**
4. **EAINT6673_TS6** — Pemaju Eksklusif, labelled "Lonpac" but step 5 says "Select Takaful (TPFT)"; MyKad, Sub UCD. 69E (Non-Xstar); before deployment buy insurance to "Insurance Created", verify old buttons "[Insurance Invoice]" (eSTM Details) and "[Invoice]" (Insurance Details), "save and continue later"; after deployment "Resubmit" from **eSTM listing**, approve, verify receipt (R10). **Pass.**

### 3d. E2E TS — "Transactions Before 1st January 2026" (R11)

1. **EAINT6673_TS7** — Pemaju Eksklusif, Tokio Marine (Car), Main UCD, existing record PKF861. Expected: eSTM Details "button label is remained as [Insurance Invoice]"; Insurance Details "remained as [Invoice] / [Print Invoice]"; file "remained as Invoice.pdf"; old layout (R12). **Pass.**

### 3e. Prod regression (UCD & BO insurance details page)

1. **TS1** — paid before 1 Jan, Lonpac, B5D007296: "show [Invoice] button" (R6). PASS.
2. **TS2** — paid before 1 Jan, other than Lonpac, B5D007298: "show [Print Invoice] button" (R7). PASS.
3. **TS3** — paid 2 Jan ("No successfull trx on 1st Jan"), B61007314 / B61007308: "show [Receipt] button", Official Receipt downloads (R8). PASS.
4. **TS4** — paid 21 Jan, B61007532 / B61007528: "show [Receipt] button" (R9). PASS.

## 4. Business rules and system behaviour

1. **Cut-off date is 1 January 2026, applied backwards.** Records paid 1-20 Jan 2026 were issued as invoices before deployment and show the Official Receipt after it: "Download and verify Official Receipt (replaced the old Insurance Invoice) on both UCD & BO" (E2E TS, R7). Prod regression TS3 confirms a 2 Jan payment shows "[Receipt]" (Prod regression, R8). Deployment date near 21 Jan 2026 [unconfirmed — inferred from the band "From 21st January 2026 onwards", E2E TS, R3].
2. **Old button names differ by page and insurer.**
   1. Insurance Details (UCD & BO): "Notes: Button Name for old transactions ⏎ i. Lonpac - Invoice ⏎ ii. Other Insurers - Print Invoice" (FUNCT TEST TABLE, R36; E2E TS, R7, R12).
   2. eSTM Details (UCD): "i. Lonpac - Insurance Invoice ⏎ ii. Other Insurers - Insurance Invoice" (E2E TS, R12).
3. **New button names:** "[Receipt] button - UCD & BO Insurance details page ⏎ [Insurance Receipt] button - UCD eSTM details page" (FUNCT TEST TABLE, R36).
4. **File name:** "Receipt_VehicleNo.pdf ⏎ E.g.: Receipt_WA1234.pdf"; old file "Invoice.pdf" (FUNCT TEST TABLE, R37).
5. **Receipt number:** "OR refers to Official Receipt", "MMYY refers to Month and Year of the Date of Issue", "NNNN refers to the running number. It will be reset by each month starting from 0001", "NNNN will be reset as 0001 for the first insurance transaction issued by 1 January 2026" (FUNCT TEST TABLE, R13).
6. **Payment reference:** "{yymmdd}{0120}{0001}-{vehicle_no}" (FUNCT TEST TABLE, R15). Meaning of the fixed "0120" is not stated.
7. **Payment From = paying dealer:** "Refer to dealer (UCD) that made payment for the transaction" (FUNCT TEST TABLE, R17).
8. **Address comma rule:** "Add comma (,) at the end of each Address Line and City as stated below: ⏎ Address 1, Address 2, Address 3, ⏎ Postcode City, State" (FUNCT TEST TABLE, R19).
9. **Make & model source:** "Zuhaira - Vehicle make and model is auto populate from insurance repsonse" (FUNCT TEST TABLE, R23).
10. **Outstanding is hard-coded:** "Dev feedback Nil is hardcoded and will not show any other amount" (FUNCT TEST TABLE, R28). This contradicts the SRD rule in the same row: "If calculation is other than 0, display the outstanding amount in RM."
11. **Two agencies, two BRNs:** "BINTANG PROSPEK SDN BHD ⏎ (1342848-M)" and "PEMAJU EKSKLUSIF SDN BHD ⏎ (1317667-V)", both "LEVEL 15 SUNWAY TOWER ⏎ JALAN AMPANG 50450 KUALA ⏎ LUMPUR" (FUNCT TEST TABLE, R32).
12. **Static notes text** includes "Hotline: 1700 816 186 or WhatsApp: +6012 200 1324" and "The official policy document will be issued by the insurer upon processing the payment." (FUNCT TEST TABLE, R31).
13. **Insurance entry points** used across the E2E (E2E TS, R4-R10):
    1. After successful eSTM Step 5 payment.
    2. After "Failed due to VEL000069E in eSTM Step 5", Xstar and Non-Xstar.
    3. eSTM Details insurance banner "[Get Free Quote for {vn}]".
    4. "Insurance > Get a Free Quote" with "Category = Individual".
    5. "Resubmit" from Insurance Transaction Listing → "Land on Insurance page at Step 3".
    6. "Resubmit" from eSTM listing.
14. **Step-3 status wording varies:** TS2 says "Proceed with insurance Step 3 status = Payment Failed" (R5); TS5 says "status = Pending Payment" (R9).

## 5. Test data, environments, accounts, setup

1. **Environment:** "staging/??" (FUNCT TEST TABLE, R1); Prod regression sheet ran on production [unconfirmed — inferred from sheet name].
2. **Accounts:** "Main UCD (East Coast)", "Main UCD", "Sub UCD" (E2E TS, R4-R10). No logins or passwords in the sheet.
3. **Owner ID types:** MyKad, MyPR, Company.
4. **Insurers covered:** Takaful (Comprehensive), Takaful (TPFT), Tokio Marine (Bike), Tokio Marine (Car), Chubb, Lonpac.
5. **Setup step in every E2E:** "ensure messagebird is disabled".
6. **Records:** staging B61003783 (TS3), B61003787 (TS5), PKF861 (TS7 vehicle). Production B5D007296, B5D007298, B61007314, B61007308, B61007532, B61007528.
7. **Sample data** (FUNCT TEST TABLE): "CARSOME SDN BHD", "MARIE ANN WONG", "KSX AUTOMOTIVE SDN BHD", "TMCA5781560", "25041501200003-WMN7304".
8. **Before/after deployment pairs:** TS2, TS3, TS5, TS6 need data made before deployment. Per standing feedback, once staging has the change, regression uses existing old records instead of waiting on a deploy.

## 6. Gaps and risks for regression

1. **Outstanding non-zero** never shown — "Nil is hardcoded" (R28). Any partial-payment case will print the wrong value.
2. **No tick** for Payment Reference No., Total Net Premium, Amount Paid (R15, R26, R27). Amount formatting "RM1,000.00" was not evidenced.
3. **Monthly reset** of the receipt running number was not tested across a month boundary.
4. **Chinese characters** are allowed by the rules (R17-R19) but ticks only cover "Alphabet" / "Alphanumeric, special chars".
5. **Format conflicts in the sheet:** Receipt No. format "{OR}{MMYY}{0001}" vs sample "OR-0425-0001" (hyphens); Date of Issue format "{ddMMMMyyyy}" vs sample "2025-04-15" (R13-R14).
6. **TS6 insurer mismatch:** labelled "Lonpac" but steps select "Takaful (TPFT)" (E2E TS, R10). Lonpac via the eSTM-listing Resubmit path may be untested. If Takaful was used, the step-7 expectation "[Invoice]" contradicts "Other Insurers - Print Invoice" (FUNCT TEST TABLE, R36).
7. **RHB Insurance** is in the 1g sample list (R20) but in no E2E or tick.
8. **"OTHERS" make/model input** path (R23) has no scenario.
9. **eSTM Details [Insurance Receipt]** was ticked for "Takaful Comp" only (R36); other insurers rely on E2E TS1/TS2.
10. **Prod regression** checks only the Insurance Details page, not the eSTM Details button.
11. **BO eSTM Details** is not listed as affected; whether it still shows an invoice button is unknown [unconfirmed].

## Knowledge candidates

1. **Correct `flow-insurance-purchase.md` line 601-603 and `business-rules-from-test-scenarios.md` line 456-458.** They say old transactions "keep [Insurance Invoice]". Per this TS, that is the **eSTM Details** label only; the **Insurance Details** page keeps "[Invoice]" (Lonpac) or "[Print Invoice]" (others). New eSTM Details label is "[Insurance Receipt]", not "[Receipt]". Source: FUNCT TEST TABLE R36; E2E TS R12.
2. **Cut-off = payments from 1 January 2026**, applied backwards to 1-20 Jan records. Source: E2E TS R6-R7, R11; Prod regression R8.
3. **Outstanding (if any) always prints "Nil"** — "Dev feedback Nil is hardcoded and will not show any other amount". Source: FUNCT TEST TABLE R28.
4. **Receipt running number resets monthly from 0001**, first reset for 1 January 2026. Source: FUNCT TEST TABLE R13.
5. **Agency names and BRNs** on the receipt: Bintang Prospek (1342848-M), Pemaju Eksklusif (1317667-V). Source: FUNCT TEST TABLE R32. Candidate for `eauto-insurance.md`.
6. **Receipt field sources:** Payment From from "eSTM - Step 3 / BO"; Insured's Name from "eSTM - Step 1"; Insured's Address from "eSTM - Step 2"; Make & Model "auto populate from insurance repsonse". Source: FUNCT TEST TABLE R17-R19, R23.
7. **Six insurance entry points** (§4 item 13) as a regression checklist for any insurance-document change. Source: E2E TS R4-R10.
8. **Static receipt notes** quote hotline "1700 816 186" and WhatsApp "+6012 200 1324". Source: FUNCT TEST TABLE R31.
9. **`production-regression-scope.md` line 1122** lists EAINT-6673 with date "20250519", which does not match the January 2026 bands in this TS [unconfirmed — the 20250519 date may be an SRD date, not a deploy date].
