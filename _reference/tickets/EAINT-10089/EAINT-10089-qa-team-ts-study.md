# EAINT-10089 — QA Team test script study (2026-10-27)

Study written unattended by the SharePoint Scribe. The shared JomCheck folder holds three workbooks: EAINT-10089, EAINT-10937 and EAINT-11175. All studies for that folder are filed here, under EAINT-10089. The first run covered the **EAINT-11175** workbook (sections A–E). The second run, on the same day, added the **EAINT-10937** workbook (sections F–J). The third run, also on the same day, adds the **EAINT-10089** workbook itself (section K). All three workbooks are now studied.

## Sources read

1. **EAINT-11175 text copy.** `_reference/sharepoint/qa-team-ts/EAINT-10089, 10937, 11175 - JomCheck Enhancement CRs/EAINT-11175 - 🔴[eAuto-BackOffice] Update Bank or Credit Company Account Page - Add 3 New Permission Checkboxes.md`, dated "27/10/2026, 8:09:16 pm". The second run checked it again and it was unchanged. It holds cell text only: "formatting and images are not kept" (line 3). Colours, dropdowns and any embedded screenshots could not be read.
2. **EAINT-10937 text copy.** `_reference/sharepoint/qa-team-ts/EAINT-10089, 10937, 11175 - JomCheck Enhancement CRs/EAINT-10937 - 🔴[eAuto-Service Portal] JomCheck Report Access & Jomcheck Report Listing.md`, dated "27/10/2026, 8:13:37 pm". It also holds cell text only (line 3). Struck-through text came through as Unicode strike characters (e.g. "O̶w̶n̶e̶r̶s̶h̶i̶p̶ ̶C̶l̶a̶i̶m̶ ̶L̶i̶s̶t̶i̶n̶g̶"), so deletions can still be seen. Formulas in the Progress Tracker came through as JSON text, not values.
3. **Knowledge files.** `knowledge/README.md`, `knowledge/flow-jomcheck.md` §1–§5a, `knowledge/flow-bo-shell.md` §3.1 item 4, `knowledge/flow-service-portal-shell.md` line 171, `knowledge/business-rules-from-test-scenarios.md` §5 items 4 and 11, §14 item 1 and the BO item 9, `knowledge/production-regression-scope.md` (items 11a, 8.1 item 10, tables 11.1), `knowledge/quirks.md` line 290, `knowledge/environments-history.md` line 58, plus `knowledge/cr-test-scenario-catalogue.md` rows 010 and 012.
4. **`lib/ticketStudies.ts`.** No study exists for EAINT-10089, EAINT-10937 or EAINT-11175. EAINT-10089 only shows up in the `related` list of the EAINT-12412 entry (line 1235).
5. **EAINT-10089 text copy (third run).** `_reference/sharepoint/qa-team-ts/EAINT-10089, 10937, 11175 - JomCheck Enhancement CRs/EAINT-10089 -🔴[eAuto-UCD & BackOffice] JomCheck Enhancement - Sharing Feature for JomCheck Report & Increase JomCheck Fees from RM 18 to RM 20.md`, dated "27/10/2026, 8:57:42 pm". Cell text only: "formatting and images are not kept" (line 3). Read in full (2 sheets).
6. **More knowledge files (third run).** `knowledge/business-rules-from-test-scenarios.md` §5 items 1–2 and the price table at line 124, `knowledge/flow-jomcheck.md` §4 (line 104), §5 (lines 130–134) and §9b (lines 1472–1477), `knowledge/flow-payments-fees.md` lines 179 and 195, `knowledge/production-regression-scope.md` §7.1 item 2, §7.2 item 2c and tables 11.1, `knowledge/cr-ledger.md` item 8 of the EAINT-12412 entry, `knowledge/cr-test-scenario-catalogue.md` row 007, `knowledge/pipeline-working-rules.md` §1 item 4.
7. **Not found or not read.** There is no `_reference/tickets/Studying/EAINT-10089/` folder. `_reference/tickets/EAINT-10089/` holds only this study. No SRD for EAINT-10089, 10937 or 11175 was read, and no Jira or Teams source was read. Figma links in the 10937 Configuration sheet (R16–R18) were not opened. The JomCheck Introductory Video named in 10089 TS-004 was not watched.

## 1. Header

### 1a. EAINT-11175 workbook (first run)

1. **Ticket studied:** EAINT-11175. Filed under EAINT-10089 (same JomCheck CR folder).
2. **Workbook title (Sheet1 R1):** "EAINT-11175 — Update Bank/Credit Company Account Page: Add 3 New Permission Checkboxes".
3. **Module / portal:** **BackOffice** (Manage Bank/Credit Company Account Page). Sections C–E also test downstream effects on **UCD** (Get JomCheck Report, JomCheck Transaction Details) and the **Service Portal** (login, IP whitelisting).
4. **SharePoint:** library "eAuto - CR Test Scenarios", folder "EAINT-10089, 10937, 11175 - JomCheck Enhancement CRs". Modified 10/08/2026, 9:57:57 am.
5. **Sheets:** 1 ("Sheet1").
6. **Columns (R2):** "TS No. | Test Objective | Test Steps | Expected Result | QA | Test Result | Remarks".
7. **Scenarios:** **32 numbered rows**, 11175_TS01 to 11175_TS32, in 5 sections (A–E). There is also **1 row with no TS number** (R29).
8. **Results:** **32 PASS, 1 In Progress.** TS23 (R28) is "In Progress". The un-numbered row R29 is "PASS".
9. **Testers (QA column):** "Azila" on TS01–TS11 and TS13–TS24. "Teck Yung" on TS12 and TS25–TS32.
10. **Dates:** none written in the sheet. The only date is the SharePoint modified date, 10/08/2026.
11. **Execution method:** Remarks say "Automation script" on TS01–TS08, TS10, TS11 and TS13. All other rows give no method.

### 1b. EAINT-10937 workbook (second run)

1. **Ticket studied:** EAINT-10937 — "JomCheck Report Access & Jomcheck Report Listing". Filed under EAINT-10089.
2. **Workbook title (Progress Tracker R1):** "EAINT-10937 — JomCheck Report Access & Listing / Test Execution Progress Tracker".
3. **Module / portal:** **Service Portal** (JomCheck Report Listing, Ownership Claim Listing and Details). It also tests **UCD** (Get JomCheck Report, JomCheck Listing and Details), **BackOffice** (JomCheck Listing and Details, Manage Bank/Credit Company Accounts) and **Wholesale** (chatbot JomCheck purchase).
4. **SharePoint:** library "eAuto - CR Test Scenarios", same folder. Modified **05/08/2026, 8:55:17 pm**.
5. **Sheets (6):** "Progress Tracker", "Configuration", "E2E", "Checkbox Behaviour (Special TS)", "Permission TS", "Functional Testing (S&F)".
6. **Scenarios (distinct TS ids): 77.**
   1. **E2E:** 10937_E2E_TS01 to TS18 (18 ids over 53 rows). Sub-sections: happy flows (R2–R24), "E2E Flow > Purchase JomCheck (WHOLESALE)" (R25), "JomCheck Existing Transaction Test Scenarios (Before + After Deployment)" (R29) and "Ownership Claim Service Portal Test Scenarios (Before + After Deployment)" (R46). R59 holds only the label "EAUTO SDN BHD user quick check".
   2. **Checkbox Behaviour (Special TS):** 10937_Checkbox_TS01 to TS03 (3 ids over 6 rows).
   3. **Permission TS:** 6 ids over 12 rows. They **reuse the E2E ids** "10937_E2E_TS01" to "10937_E2E_TS06" (R3–R14).
   4. **Functional Testing (S&F):** 10937_SNF_TS01 to TS50 (50 ids over 52 rows; TS47 and TS48 each take 2 rows).
7. **Results:**
   1. **E2E:** 17 PASS, **1 blank** — TS09 (R28) has no QA, no result and the remark "P2". A second column "Regression (Test Result)" reads "PASS" on TS01–TS03 (R2–R16).
   2. **Checkbox Behaviour:** all "Pass". **Permission TS:** all "Pass". **S&F:** all "Pass".
   3. **Progress Tracker** (R4–R8) says "E2E | 41 | 41", "Permission TS | 12 | 12", "Checkbox Behaviour (Special TS) | 6 | 6", "Functional Testing (S&F) | 50 | 50", "TOTAL | 109 | 109". The Pass counts are typed numbers, not formulas, so they ignore the blank TS09. The E2E total of 41 matches neither the 18 ids nor the 53 rows.
8. **Testers (QA column):** "Azila" (E2E TS01–TS03), "Teck Yung" (E2E TS04, TS05, TS08; all Checkbox TS), "Teck Yung & Aliah" (E2E TS06, TS07), "Charmain" (E2E TS10–TS18), "Maisarah" (all Permission TS), "Aliah" (S&F, except TS40 which has no QA name).
9. **Dates in the sheet:** "Deployment (10/06/2026)" (E2E R28). "Latest requirements 12/6/2026" (S&F R41) and "(Latest requirement 12/6)" on column names (S&F R49–R52).
10. **Execution method:** E2E TS02 remark: "Can deprio this TS as Azila has the automation script prepared." (R9–R11). Configuration R24 names a Playwright-style tag: "run with --grep SP_ONLY".

### 1c. EAINT-10089 workbook (third run)

1. **Ticket studied:** EAINT-10089 — "JomCheck Enhancement - Sharing Feature for JomCheck Report & Increase JomCheck Fees from RM 18 to RM 20".
2. **Module / portal:** **UCD** (Home page, JomCheck Report page, Get JomCheck Report, JomCheck Details, Report menu) and **BackOffice** (JomCheck Details, SST Payment Report, e-Invoice / Consolidated e-Invoice Listing).
3. **SharePoint:** library "eAuto - CR Test Scenarios", same folder. Modified **11/06/2026, 5:20:35 pm**.
4. **Sheets (2):** "Price Change Functional" and "JomCheck Invoice Price".
5. **Columns (Price Change Functional R1):** "TS No. | Test Objective | Test Steps | Expected Result | QA | Test Result | Remarks".
6. **Scenarios:** **12 ids over 13 rows**, TS-001 to TS-012, in 1 section "A. PRICING UPDATE (RM18 → RM20)" (R2). **TS-005 takes 2 rows** (R7 vehicle number, R8 chassis number). "JomCheck Invoice Price" is a reference table, not scenarios.
7. **Results:** **13 rows PASS, 0 Fail, 0 blank.**
8. **Tester (QA column):** "Charmain" on every row.
9. **Dates:** none written in the sheet. The only date is the SharePoint modified date, 11/06/2026.
10. **Execution method:** not written. Remarks on TS-008 to TS-012 say "Tested with both existing and new transactions" (R11–R15).
11. **No sharing scenarios.** The title names the "Sharing Feature", but neither sheet tests it. Sharing is tested in the 10937 and 11175 workbooks (sections C, F–I).

## Changes since last study (2026-10-27)

### Third run (EAINT-10089 workbook)

1. **Workbook newly studied, not a changed one.** The two earlier runs did not read the EAINT-10089 workbook, so there is **no earlier study of it to diff against**. The SharePoint modified date is **11/06/2026**, which matches the date in `cr-test-scenario-catalogue.md` row 007 ("2026-06-11"). The row count also matches the catalogue ("Price Change Functional:13"). There is **no sign the workbook changed** after the 2026-10-16 SharePoint sweep [unconfirmed — no older text copy exists to diff against].
2. **New scenarios added to this study:** TS-001 to TS-012, as section K in §3. The "JomCheck Invoice Price" sheet is added as §4c item 37. New rules are in §4c items 32–41.
3. **Removed scenarios:** none. Sections A–J are kept.
4. **Result changes:** none. The 11175 and 10937 text copies were not given again in this run; their results stand as recorded. All 13 EAINT-10089 rows are "PASS".
5. **Corrections to the earlier runs:**
   1. **Intro and "Sources read" item 5** said the EAINT-10089 workbook "has not been studied" and "was not part of either run". Now studied.
   2. **§2 title** reads "What the tickets changed". Item 2c now covers EAINT-10089 itself.
   3. **§7 item 1** and §7 new item 11: `flow-jomcheck.md` §5 also says "JomCheck Invoice Price" was "not opened this session". It is now read (§4c item 37).
6. **Knowledge checked against the sheet:** the 5 quotes in `business-rules-from-test-scenarios.md` §5 items 1–2 match R4, R5, R7 and R11 word for word. No contradiction found. `cr-test-scenario-catalogue.md` row 007 names the tester as "Siti Nur Azila Binti Mohamed", but the QA column says "Charmain" on every row (see §7 item 12).

### Second run (EAINT-10937 workbook)

1. **Different workbook, not a new version.** The earlier run read the **EAINT-11175** workbook (modified 10/08/2026). This run was given the **EAINT-10937** workbook (modified 05/08/2026). That date is older than the 11175 one, and matches the date already in `cr-test-scenario-catalogue.md` row 010 ("2026-08-05"). There is **no sign the 10937 workbook changed** after the 2026-10-16 SharePoint sweep [unconfirmed — no older text copy of it exists to diff against].
2. **New scenarios added to this study:** 77 ids from the 10937 workbook, as sections F–J in §3. New rules are in §4 items 14–30.
3. **Removed scenarios:** none. Sections A–E (EAINT-11175) are kept as they were.
4. **Result changes:** none for EAINT-11175 (text copy timestamp unchanged; TS09 and TS12 still "PASS" with "Pending" remarks; TS23 still "In Progress"). For EAINT-10937 there is no earlier result to compare; E2E TS09 is the only row without a result.
5. **Corrections to the earlier run:**
   1. **§5 item 1 (environment).** The earlier run had "[unconfirmed]" uat3. The 10937 Configuration sheet states "Environment | UAT3" and "Base URL | https://staging.eauto.my/uat3" (R3–R4). The 11175 sheet itself still names no environment.
   2. **§6 item 6 (no negative test for checkbox 1).** Wrong across the folder. The 10937 workbook covers it: E2E TS03 (zero companies, "Verify the Share report section is not displayed", R15) and Checkbox TS02 (BO unticks, section "NOT displayed", R6).
   3. **§6 item 7 (end-to-end check after sharing).** Now confirmed in the 10937 workbook: E2E R5 item 5 checks what each credit company can see in the Service Portal.
   4. **§6 item 10 (sharing window expiry never tested).** Wrong across the folder. 10937 E2E TS04 tests Day 30 and TS05 tests Day 31 by asking the developer to patch the approval date (R18, R20).

## 2. What the tickets changed, as the TS shows it

### 2a. EAINT-11175

1. **Three new checkboxes** on the Manage Bank/Credit Company Account Page: "Allow UCD to share JomCheck Report", "Allow Login to Service Portal" and "Allow Bypass Whitelisting Feature" (R4, TS01).
2. **Position:** "All 3 new checkboxes appear below the 'Full Enquiry Permission' checkbox." (R5, TS02).
3. **Only authorised BO users can edit them.** Other BO users see them disabled (R8–R17).
4. **Checkbox 1** controls whether UCD sees the "Share Report with Financial Institution" section when buying a JomCheck report (R19–R30).
5. **Checkbox 2** controls whether users of that credit company can log in to the Service Portal (R32–R35).
6. **Checkbox 3** lets that credit company use the Service Portal from an IP address that is not whitelisted (R37–R40).

### 2b. EAINT-10937

1. **UCD share section** on Get JomCheck Report and JomCheck Details, with a 30-day window, a [Share] button after purchase, and "Shared on" timestamps (E2E R2–R14).
2. **BO JomCheck Details** shows the same sharing selections **read-only** (E2E R5 item 4).
3. **Service Portal access by share:** a credit company sees a JomCheck transaction and report only if UCD shared it with that company. eAuto users see all (E2E R5 item 5).
4. **New Service Portal page "JomCheck Report Listing"** with Vehicle No., Chassis No., Shared Date and Payment Date filters, export, bulk download and View (S&F R3–R54).
5. **Old data stays unshared.** JomCheck transactions approved before deployment do not get the share section (E2E R31–R45).
6. **Wholesale purchases never get the share section** (E2E R27).
7. **Ownership Claim Listing / Details** in the Service Portal keep showing JomCheck YES and the report before and after deployment (E2E R48–R58).

### 2c. EAINT-10089

1. **JomCheck fee goes from RM18 to RM20** (section title R2: "A. PRICING UPDATE (RM18 → RM20)").
2. **UCD screens show RM20:** Home page JomCheck module (R3), JomCheck Report page button text (R4), sidebar Price section (R5), JomCheck Introductory Video (R6), Get JomCheck Report result text (R7, R8).
3. **Invoice and e-Invoice show RM20** on UCD and BackOffice JomCheck Details (R9, R10).
4. **Finance and payment reports show RM20:** BO SST Payment Report (R11), BO e-Invoice / Consolidated e-Invoice Listing (R12), and the UCD Report menu: Payment Breakdown Report, Download Payment Document, UCD Payment Report (R13–R15).
5. **The sharing part of the title is not tested here.** See §2a and §2b.

## 3. Scenarios

### A. EAINT-11175 — UI & layout (R3)

1. **TS01** (R4): the 3 new checkboxes are displayed. Expected: the three labels listed in §2a item 1.
2. **TS02** (R5): they sit below 'Full Enquiry Permission'. Expected: "All 3 new checkboxes appear below the 'Full Enquiry Permission' checkbox."
3. **TS03** (R6): defaults on a new account. Expected: "Full enquiry permission - ticked by default", "Allow UCD to share JomCheck Report - unticked by default", "Allow Login to Service Portal - ticked by default", "Allow Bypass Whitelisting Feature  - unticked by default".

### B. EAINT-11175 — Access control (R7)

1. **TS04–TS08** (R8–R12): BO users **kmcheah, jasons, eautonurul, mfared, nikmuhamad**. Each one edits an **existing** account. Expected: "They can view, tick/untick, and save changes to all 3 new checkboxes successfully."
2. **TS09–TS12** (R13–R16): BO users **eautokelvin, eautosoyeng, eautozara, mfizni**. Same expected result, but done through "Click on Create New > Complete new credit company creation."
3. **TS13** (R17): a non-authorised BO user. Expected: "Non-authorised users can VIEW the 3 new checkboxes but are DISABLED and NON-EDITABLE to them."

### C. EAINT-11175 — Checkbox 1: Allow UCD to share JomCheck Report (R18)

1. **TS14** (R19): tick the box, add "3 or more Credit Companies into the Permission to view section", save, then buy a JomCheck report on UCD **by vehicle number**. Expected: the "Share Report with Financial Institution (Bank and Credit Company) (Optional)" section shows below the JomCheck Vehicle Report section, with one checkbox per credit company.
2. **TS15** (R20): leave every company unticked, then Pay Now. Expected: the plain payment popup "Are you sure you want to proceed with this payment? Please ensure that there is sufficient fund in your RHB account." (plus the Malay and Chinese text) with "[No] [Yes]".
3. **TS16** (R21): click No, tick ONE company, then Pay Now. Expected: the sharing popup "Are you sure you want to proceed with this payment and share this report with the credit company? …".
4. **TS17** (R22): click Yes. Expected: the shared company shows "(Checkbox disabled and greyed out)". The unshared one shows "(Checkbox remains enabled)".
5. **TS18** (R23): tick another company. Expected: "The checkbox can be ticked and unticked." and "After checkbox ticked, a [Share] button is displayed on the right side within the section."
6. **TS19** (R24): click [Share] on the Get JomCheck Report page. Expected: both companies are disabled and greyed out, the text "The report has been shared with the credit company." appears, and "The [Share] button is NOT displayed".
7. **TS20** (R25): click [Share] on the JomCheck Transaction Details page. Expected: the full page layout (Transaction Details, Share section, Payment Details "RHB (JOMxxxxxxx-xxxxxx) - OK"), with "[Share] > Displayed ONLY when any credit company in the list above is ticked."
8. **TS21** (R26): Search Another Vehicle, tick TWO OR MORE companies, then Pay Now. Expected: the same sharing popup as TS16.
9. **TS22** (R27): click No, tick ALL companies, then Pay Now. Expected: the same sharing popup. **Result PASS.**
10. **TS23** (R28): a word-for-word copy of TS22, steps 19–20. **Result "In Progress".**
11. **R29** (no TS number): click Yes, then "Repeat Step 6 to Step 21 for Chasis Number". Expected: on Get JomCheck Report all companies are disabled and the [Share] button is not shown. Result PASS.
12. **TS24** (R30): same steps as R29. Expected: on JomCheck Transaction Details all companies are disabled. Result PASS.

### D. EAINT-11175 — Checkbox 2: Allow Login to Service Portal (R31)

1. **TS25** (R32): ticked and saved. Expected: "Credit company user can successfully log in to the Service Portal after permission is granted."
2. **TS26** (R33): unticked and saved. Expected: "Credit company user is denied login to the Service Portal after permission is removed."
3. **TS27** (R34): default on an existing account. Expected: "'Full Enquiry' and 'Allow Login to Service Portal' checkbox is ticked by default for pre-existing accounts."
4. **TS28** (R35): navigate away without saving. Expected: "Change is NOT persisted. Checkbox reverts to previous state. No permission change occurs until Save is clicked."

### E. EAINT-11175 — Checkbox 3: Allow Bypass Whitelisting Feature (R36)

1. **TS29** (R37): ticked and saved, then log in from a non-whitelisted IP. Expected: the credit company user "can access the Service Portal from a non-whitelisted IP after the bypass permission is granted."
2. **TS30** (R38): unticked and saved. Expected: "Credit company user is blocked from accessing Service Portal from a non-whitelisted IP. Whitelisting restriction is re-enforced."
3. **TS31** (R39): default on an existing account. Expected: "'Allow Bypass Whitelisting Feature' checkbox is unticked by default."
4. **TS32** (R40): navigate away without saving. Expected: "Change is NOT persisted. Checkbox reverts to previous state until Save is clicked."

### F. EAINT-10937 — E2E happy flows and concurrency (sheet E2E, R2–R24)

1. **E2E_TS01** (R2–R8): vehicle number, share with ONE company at purchase, then share the rest via [Share]. Expected: plain popup with none ticked (R3), sharing popup with one ticked (R4); after Yes, "[  /  ]  Credit Company 1 (TICKED + GREYED OUT (disabled))" and "[Share] button is NOT displayed" (R5); Service Portal: "Credit Company 2: Unable to view JomCheck transaction" (R5). R7 and R8 are copies of step 13.
2. **E2E_TS02** (R9–R14): chassis number, TWO OR MORE companies at purchase, then share the rest. Expected: 4 companies listed; after Yes, CC1–2 "TICKED + GREYED OUT", CC3–4 "(remain enabled)"; after Share, all four can view (R13). R14 is a copy of R13.
3. **E2E_TS03** (R15–R16): ZERO credit companies set for UCD. Expected: "Verify the Share report section is not displayed" before and after payment, on UCD and BO.
4. **E2E_TS04** (R17–R18): share TWO, BO adds TWO NEW companies, developer patches approval to Day 30, UCD shares the new two. Expected: all four "Shared on: …" and all four can view.
5. **E2E_TS05** (R19–R20): developer patches approval to Day 31. Expected: "Verify hint text "Share Report with Fina....." is HIDDEN", "Newly added credit companies CANNOT be ticked/shared", [Share] not displayed, CC3–4 "(attempted after expiry): Unable to view JomCheck transaction".
6. **E2E_TS06** (R21–R22): UCD A and UCD B click [Share] for the same company **at the same time**. Expected: B gets "Unable to proceed" / "There's some changes on the report sharing to credit company. Please refresh and try again."; "No double-share / duplicate record is created".
7. **E2E_TS07** (R23–R24): same as TS06 but B shares **after** A. Same expected result.

### G. EAINT-10937 — Wholesale and existing transactions (sheet E2E, R25–R45)

1. **E2E_TS08** (R27): BO sharing permission ticked, buy JomCheck in the Wholesale buyer processing-fee link. Expected: the share section "is NOT displayed in JomCheck Transaction Details Page in BOTH UCD & BO". PASS.
2. **E2E_TS09** (R28): existing Wholesale JomCheck transactions "before Deployment (10/06/2026)". Same expected result. **No result; remark "P2".**
3. **E2E_TS10** (R31–R33): Approved on old code (staging/eauto). Expected: section "NOT displayed" on old code, after deployment, and when the same Transaction ID is opened on staging/uat3.
4. **E2E_TS11** (R34–R36): "Jomcheck Enquiry = Failed, Tx status = Pending" on old code, then paid on uat3. Expected: not displayed before; after payment on uat3 "The section above is displayed in" UCD Get JomCheck Report, UCD Details and BO Details, and "The credit company checkboxes can be ticked and unticked."
5. **E2E_TS12** (R37–R39): "Payment Status = -, Tx status = Pending" on old code, then paid on uat3. Same as TS11: displayed after approval on new code.
6. **E2E_TS13** (R40–R42): "Payment Status = Failed, Tx status = Failed", then Retry Payment on uat3 "(Ensure it is RM20)". Displayed after approval on new code.
7. **E2E_TS14** (R43–R45): "Failed to Retrieve Report, Tx status = Failed", then Resubmit and pay on uat3 "(Ensure it is RM20)". Displayed after approval on new code.

### H. EAINT-10937 — Ownership Claim before and after deployment (sheet E2E, R46–R58)

1. **E2E_TS15** (R48–R50): eSTM Approved and 2 JomCheck reports bought before deployment, then 2 more after. Expected (both superadmin and credit company): "JomCheck = YES" and "Latest JomCheck Report before deployment (2)".
2. **E2E_TS16** (R51–R53): eSTM Approved before deployment, no JomCheck until after. Expected before: "JomCheck = -", "Without JomCheck Report". After 2 purchases: "JomCheck = YES" but still "Without JomCheck Report".
3. **E2E_TS17** (R54–R56): JomCheck bought first, eSTM Approved after deployment. Expected first: "Without the transaction". After 2 more purchases: superadmin "Latest JomCheck Report before deployment (4)", credit company "Latest JomCheck Report before deployment (3)".
4. **E2E_TS18** (R57–R58): eSTM Approved and JomCheck bought after deployment. Expected: "JomCheck = YES", "Latest JomCheck Report before deployment (2)".

### I. EAINT-10937 — Checkbox Behaviour and Permission TS

1. **Checkbox_TS01** (R3–R4): ticked companies, payment FAILED, Retry. Expected: "[ / ]  Credit Company 1 (Checkbox remained ticked and enabled)".
2. **Checkbox_TS02** (R5–R6): ONE company ticked, payment FAILED, BO unticks the permission, Retry. Expected: section "is NOT displayed".
3. **Checkbox_TS03** (R7–R8): TWO OR MORE ticked, payment FAILED, BO unticks ONE company, Retry. Expected: section still displayed with only the remaining companies (3 listed before, 2 after).
4. **Permission "E2E_TS01"** (R3–R4): revoke ONE ticked and ONE unticked company before payment, refresh, pay. Expected: only "[  ]  Credit Company 1" left.
5. **Permission "E2E_TS02"** (R5–R6): title says "Click on Pay Now button" instead of refresh, but step 9 still reads "Refresh the Get JomCheck Report page." Expected: only one company left.
6. **Permission "E2E_TS03"** (R7–R8): revoke AFTER payment, refresh. Expected: the revoked companies drop off the list; Tx "Approved".
7. **Permission "E2E_TS04"** (R9–R10): ADD permission for another company before payment, refresh. Expected: the new company appears (3 listed).
8. **Permission "E2E_TS05"** (R11–R12): ADD before payment, Pay Now without refresh. Expected: 3 companies listed.
9. **Permission "E2E_TS06"** (R13–R14): ADD AFTER payment, refresh. Expected: 3 companies listed; Tx "Approved".

### J. EAINT-10937 — JomCheck Report Listing, Service Portal (sheet Functional Testing (S&F))

1. **SNF_TS01** (R3): listings on login. Expected: "Ownership Claim Enquiry", "O̶w̶n̶e̶r̶s̶h̶i̶p̶ ̶C̶l̶a̶i̶m̶ ̶L̶i̶s̶t̶i̶n̶g̶" (struck), "Hire Purchase Record Creation Listing", "JomCheck Report Listing"; hyperlink clickable.
2. **SNF_TS02** (R4): Search with no filter. Expected: "Please select From Date and To Date." with [OK].
3. **SNF_TS03–TS10** (R5–R12): Vehicle No. Typing, pasting, auto-uppercase ("mnh8022" → "MNH8022"), special and non-ASCII removed ("MN12ABC999"), exact match only, partial and invalid give no records.
4. **SNF_TS11–TS19** (R13–R21): Chassis No. Same pattern; allowed special characters kept: "1FTE-F14e/3GRA 372*49" (R16).
5. **SNF_TS20–TS29** (R22–R31): Shared Date. Empty: "Please select Shared From Date and Shared To Date."; From blank: "Please select Shared Date From."; To auto-defaults to today; max 1 month; To not before From.
6. **SNF_TS30–TS38** (R32–R40): Payment Date. Same pattern; From blank: "Please select Payment Date From".
7. **SNF_TS39–TS42** (R41–R44): combined filters. Vehicle No + Shared Date works, and Shared Date becomes optional when Vehicle No is typed "(Latest requirements 12/6/2026)"; Vehicle No + Chassis No gives no records; Shared Date + Payment Date together is not allowed.
8. **SNF_TS43–TS44** (R45–R46): Export, as eAuto user (jasons) and as credit company. File "JomCheck_Report_Listing_DDMMYYYY_HHmm"; credit company file has no "Credit Company" column.
9. **SNF_TS45** (R47): Reset. Expected: "Clears all filters. ⏎ It does not clear out the listing".
10. **SNF_TS46** (R48): pagination. Expected: "Number of listing per page is max 50."
11. **SNF_TS47–TS48** (R49–R52): listing columns for eAuto user and credit company (credit company has no "Credit Company" column).
12. **SNF_TS49** (R53): bulk Download. Zip "eauto_service_portal".
13. **SNF_TS50** (R54): View. Expected: "The hyperlink should redirect users to new tab on JomCheck report details."

### K. EAINT-10089 — Pricing update RM18 → RM20 (sheet Price Change Functional, R2–R15)

1. **TS-001** (R3): UCD Home page, JomCheck module logo. Expected: "JomCheck service charge is displayed as RM20 only* in the UCD Home page." PASS.
2. **TS-002** (R4): UCD JomCheck Report page, text under [Purchase JomCheck Report]. Expected: "Purchase Report (RM20.00 + 8% Service Tax per report)". PASS.
3. **TS-003** (R5): UCD JomCheck page sidebar, Price section. Expected: "RM20* only for each JomCheck Report ⏎ * The price is exclusive of government service tax. The product price consists of JPJ and eAuto Service Fee." PASS. Its title and step 3 are copied from TS-002.
4. **TS-004** (R6): JomCheck Introductory Video. Expected: the video shows "RM20 only*" and "Purchase Report (RM20.00 + 8% Service Tax per report)". PASS.
5. **TS-005** (R7): Get JomCheck Report by Vehicle No. Expected: " Vehicle number found. Pay now (RM20.00 + 8% Service Tax) to purchase the report." PASS.
6. **TS-005** (R8, second row): same, by Chassis No. Expected: " Chassis number found. Pay now (RM20.00 + 8% Service Tax) to purchase the report." PASS.
7. **TS-006** (R9): UCD JomCheck Details > Invoice & e-Invoice. Expected: "All the pricing details are updated accordingly." PASS. Remark: "Compare the invoice pricing with the JomCheck Price Change tab."
8. **TS-007** (R10): same on BackOffice. Same expected result and remark. PASS.
9. **TS-008** (R11): BO (Finance) SST Payment Report (JomCheck), tick JomCheck, Generate. Expected per row: "Amount (RM) = 20.00", "Total Service Tax Amount (RM) = 1.60", "Total Amount (RM) = 21.60", "EAUTO (RM) = 6.00", "SST (8%) = 0.48", and Grand Totals for the same 5 columns. PASS.
10. **TS-009** (R12): BO (Finance) e-Invoice / Consolidated e-Invoice Listing, Type = JomCheck. Expected: "Total Net Amount (RM) = 20.00", "Total Tax Amount (RM) = 1.60", "Total Including Tax (RM) = 21.60". PASS.
11. **TS-010** (R13): Report > Payment Breakdown Report, JomCheck filter, export PDF. Expected: "All the pricing details are updated accordingly." PASS.
12. **TS-011** (R14): Report > Download Payment Document, JomCheck filter, download PDF. Step note: "(Requires dev's help to patch to show the Download hyperlink)". Same expected result. PASS.
13. **TS-012** (R15): Report > UCD Payment Report, JomCheck filter, Generate Now and export PDF. Same expected result. PASS.

## 4. Business rules and system behaviour the TS shows

### 4a. From EAINT-11175 (first run)

1. **Default values for a new account** (Sheet1 R6, TS03): "Full enquiry permission - ticked by default … Allow UCD to share JomCheck Report - unticked by default … Allow Login to Service Portal - ticked by default … Allow Bypass Whitelisting Feature  - unticked by default". This matches what `flow-bo-shell.md` §3.1 item 4 already records.
2. **Default values for existing accounts:** Service Portal login is "ticked by default for pre-existing accounts" (Sheet1 R34, TS27). Bypass is "unticked by default" (Sheet1 R39, TS31). This rule for **existing** accounts is **not in knowledge yet**.
3. **Non-authorised BO users:** "Non-authorised users can VIEW the 3 new checkboxes but are DISABLED and NON-EDITABLE to them." (Sheet1 R17, TS13). This matches `production-regression-scope.md` item 11a.
4. **The authorised list is 9 BO usernames** (Sheet1 R8–R16): kmcheah, jasons, eautonurul, mfared, nikmuhamad, eautokelvin, eautosoyeng, eautozara, mfizni. **Not in knowledge yet.**
5. **The share section needs credit companies in "Permission to view"** first (Sheet1 R19, step 3: "Add 3 or more Credit Companies into the Permission to view section."). The "3 or more" count is test setup, not a system minimum [unconfirmed].
6. **The popup depends on whether anything is shared.** With no company ticked, the plain payment popup shows (R20). With one or more ticked, the sharing popup shows (R21, R26, R27). Remark on R23, R24, R26–R28: "As discussed with BA, we remain the same popup content when UCD wanted to share to one or more than one bank/credit companies."
7. **A shared company is locked.** After payment or Share it shows "(Checkbox disabled and greyed out)", and unshared ones stay enabled (R22). Once every company is shared, the [Share] button is gone (R24, R29).
8. **Confirmation text after Share** (R24): "The report has been shared with the credit company."
9. **Share button rule** (R25, R30): "[Share] > Displayed ONLY when any credit company in the list above is ticked."
10. **Layout of the JomCheck Transaction Details page** (R25). The lines are "Date Created", "e-Invoice Submission Date", "LHDN Response Status: OK", "e-Invoice Validation Date" and "Further enquiry please contact 012-7823796 (ezAUTO Asia Sdn Bhd).", followed by the Share section and then "Payment Details … RHB (JOMxxxxxxx-xxxxxx) - OK".
11. **Sharing window text** (R19): "You are allowed to share your JomCheck report with other banks or credit companies by ticking the checkbox until {date > dd-mm-yyyy}". This sheet does not give the number of days. EAINT-10937 E2E R18 gives "{date d30 > dd-mm-yyyy}" (re-checked in the second run).
12. **Changes need Save** (R35, R40): unsaved ticks revert.
13. **Linked issue:** TS15 (R20) Remarks contain "https://mfservices.atlassian.net/browse/EAINT-11761". The sheet does not say what EAINT-11761 is [unconfirmed].

### 4b. From EAINT-10937 (second run)

14. **Price at purchase:** "Pay now (RM20.00 + 8% Service Tax) to purchase the report" (E2E R2).
15. **"Shared on" timestamp.** On UCD Details each shared company shows "(Shared on: dd-mm-yyyy hh:mm(am/pm)" (E2E R5).
16. **BO view is read-only.** "Verify read-only visibility of sharing selections" and the BO heading text "Report sharing features allowed until {date d30 > dd-mm-yyyy}". Unshared companies on BO are "(UNTICKED + GREYED OUT (disabled))" (E2E R5 item 4).
17. **Who sees what in the Service Portal** (E2E R5 item 5): "All eAuto user: Able to view all JomCheck transaction"; "Credit Company 1: Able to view and download only latest JomCheck report"; "Credit Company 2: Unable to view and download JomCheck report".
18. **The listing replaced the Ownership Claim surface for this check.** Expected results strike through the old name: "a. O̶w̶n̶e̶r̶s̶h̶i̶p̶ ̶C̶l̶a̶i̶m̶ ̶L̶i̶s̶t̶i̶n̶g̶ // JomCheck Report Listing" (E2E R7, R11, R13).
19. **Window ends after Day 30.** Day 30: new companies can still be shared (E2E R18). Day 31: "Verify hint text "Share Report with Fina....." is HIDDEN", "Newly added credit companies CANNOT be ticked/shared", "Already-shared companies remain displayed" (E2E R20).
20. **Concurrent or stale share is blocked** (E2E R21, R23): "Title: "Unable to proceed"", "Message: "There's some changes on the report sharing to credit company. Please refresh and try again."", "[OK] button to dismiss", "No double-share / duplicate record is created for Credit Company 1".
21. **Wholesale has no share section** (E2E R27): "The following section is NOT displayed in JomCheck Transaction Details Page in BOTH UCD & BO".
22. **Old transactions: by approval, not by creation** [unconfirmed inference]. Approved on old code → never shows the section (E2E R31–R33). Pending, Failed enquiry, Failed payment or Failed retrieve on old code, then completed on new code → "The section above is displayed in" all three pages (E2E R36, R39, R42, R45).
23. **Retry after a failed retrieve keeps the RM20 price.** "Retry Payment > Proceed until Tx status = Approved ⏎     (Ensure it is RM20)" (E2E R42, also R45).
24. **Failed payment keeps the ticks.** After Retry, "[ / ]  Credit Company 1 (Checkbox remained ticked and enabled)" (Checkbox R4).
25. **BO revoke takes effect on the UCD page.** Revoking the only company hides the whole section (Checkbox R6). Revoking one of several removes just that company (Checkbox R8; Permission R4, R6, R8). Adding permission makes the new company appear (Permission R10, R12, R14). Most rows refresh the page first; Permission "E2E_TS05" (R12) expects the new company without a refresh step.
26. **Ownership Claim Details keep the pre-deployment report.** "Latest JomCheck Report before deployment (2)" after two more purchases post-deployment (E2E R50). eSTM approved before deployment with JomCheck bought only after: "JomCheck = YES" but "Without JomCheck Report" (E2E R53).
27. **Service Portal listing errors** (S&F): "Please select From Date and To Date." (R4); "Please select Shared From Date and Shared To Date." (R22); "Please select Shared Date From." (R29); "Please select Payment Date From" (R38). Note the different wording between R22 and R29.
28. **Listing filters** (S&F): Vehicle and Chassis search is exact match: "No records should be displayed ⏎ Only exact match search is allowed" (R11, R20). Shared Date and Payment Date cannot be used together (R44). "Ensure Shared Date (From) & (To) date filters becomes optional fields when Vehicle No textbox is input. (Latest requirements 12/6/2026)" (R41).
29. **Export and download names** (S&F): "File name format: JomCheck_Report_Listing_DDMMYYYY_HHmm" (R45); "Zip folder name: eauto_service_portal ⏎ Subfolder name: vehicle number_Approved date time OR chassis number_Approved date time ⏎ File name: vehicle number_jomcheck or chassis number_jomcheck" (R53). The eAuto-user export has a "Credit Company" column; the credit company export does not (R45 vs R46).
30. **Total Loss History values** (S&F R49): "ATL (Display "ATL" if record found for Actual)", "BER (Display "BER" if record found for BER)", "- (Display "-" if both ACTUAL & BER has no record found)". BA meaning, R51 Remarks: "ATL (Record found for Actual) > Vehicle condition that can no longer be repaired" and "BER (Record found for BER) > Vehicle condition that can still be repaired". The severity column lists 4 bands, "Severe - 1 ⏎ High - 0 ⏎ Medium - 2 ⏎ Low - 0", with Remarks "TBC by BA, on column Counts of Incident Severity Scale" (R49).
31. **Linked issues (S&F Remarks):** EAINT-11751 (TS07, R9), EAINT-11753 (TS13, R15), EAINT-11765 (TS27, R29), EAINT-11782 (TS43, R45), EAINT-11767 (TS45, R47), EAINT-11773 (TS49, R53), EAINT-11766 (TS50, R54). What each is: [unconfirmed]; not read in Jira.

### 4c. From EAINT-10089 (third run)

32. **UCD price texts after the change** (Price Change Functional): "Purchase Report (RM20.00 + 8% Service Tax per report)" (R4); "RM20* only for each JomCheck Report ⏎ * The price is exclusive of government service tax. The product price consists of JPJ and eAuto Service Fee." (R5); " Vehicle number found. Pay now (RM20.00 + 8% Service Tax) to purchase the report." (R7); " Chassis number found. Pay now (RM20.00 + 8% Service Tax) to purchase the report." (R8). The chassis text (R8) is **not in knowledge yet**.
33. **Home page label:** "JomCheck service charge is displayed as RM20 only* in the UCD Home page." (R3).
34. **The intro video carries the price** (R6): "Ensure, within the JomCheck Introductory Video: ⏎ 1. JomCheck service charge is displayed as RM20 only* …". A price change therefore needs a new video.
35. **SST Payment Report split** (R11): "Amount (RM) = 20.00 ⏎  - Total Service Tax Amount (RM) = 1.60 ⏎  - Total Amount (RM) = 21.60 ⏎  - EAUTO (RM) = 6.00 ⏎  - SST (8%) = 0.48". The eAuto share is RM6.00, and its SST is 8% of RM6.00. This matches `flow-jomcheck.md` §9b ("recorded as RM6 for eAuto and RM14 for ezAUTO Asia").
36. **e-Invoice listing amounts** (R12): "Total Net Amount (RM) = 20.00 ⏎  - Total Tax Amount (RM) = 1.60 ⏎  - Total Including Tax (RM) = 21.60".
37. **Invoice layout at RM20 — one line** (sheet JomCheck Invoice Price). Column heads: "Description | Quantity # | Unit Price | Subtotal | Tax | Total Price" (R2). Line: "JomCheck service charge | 1 | 20 | 20 | 1.6 | 21.6" (R6). Totals: "Total Net Amount … 20" (R8), "Total Excluding Tax … 20" (R9), "Tax Amount … 1.6" (R10), "Total Including Tax … 21.6" (R11), "Total Payable Amount … 21.6" (R12). **Superseded later** by EAINT-12412, which splits this line into RM18 + RM2 for transactions approved after its go-live (`cr-ledger.md`, EAINT-12412 item 4).
38. **Report menu is on UCD.** TS-010 to TS-012 say "Log in to UCD portal. ⏎ 2. Go to Report > …" (R13–R15), though their titles say "in BackOffice".
39. **Download Payment Document needs a dev patch to test:** "(Requires dev's help to patch to show the Download hyperlink)" (R14). Why the link is hidden is not written [unconfirmed].
40. **SST Payment Report is a BO Finance page** with a Transaction Type checkbox filter: "Log in to BackOffice (Finance). ⏎ 2. Go to SST Payment Report (JomCheck). ⏎ 3. Under Transaction Type section, tick the JomCheck checkbox." (R11).
41. **Existing transactions — conflict.** TS-008 expects "ALL JomCheck transaction listings are displaying the updated pricing" (R11), with the remark "Tested with both existing and new transactions" (R11–R15). The production Deployment Checklist says the opposite for existing approved transactions: "BackOffice > JomCheck Fee remain as RM18" (`production-regression-scope.md` §7.1 item 2a, "20260914 R45"). The checklist reading (old transactions keep RM18) is more likely [unconfirmed]; "updated" in the TS probably means correct for each transaction's own price.

## 5. Test data, environments, accounts, setup

1. **Environment:** the 10937 Configuration sheet states "Environment | UAT3" and "Base URL | https://staging.eauto.my/uat3" (R3–R4). This agrees with `knowledge/environments-history.md` line 58. The 11175 sheet names none; that it also ran on uat3 is [unconfirmed].
2. **Before/after deployment method** (10937 E2E R31–R45): create the transaction on "Staging/eauto" (old code), then "In the staging/uat3 URL, replace the Transaction ID gotten from staging/eauto URL". This only works if both instances share data [unconfirmed].
3. **Portal URLs (10937 Configuration R8–R12):** UCD "https://staging.eauto.my/uat3/public/login/", BO "https://staging.eauto.my/uat3/backoffice/login/", Service Portal "https://staging.eauto.my/uat3/bank/login/".
4. **Accounts (10937 Configuration R8–R12):** UCD azilasubucd; BO jasons; Service Portal jasons (eAuto superadmin), xstarazilaa (X Star) and azilacarsome (Carsome). **Credentials present** in the sheet (plain-text passwords, R8–R12 and R25). Not copied here, as `knowledge/quirks.md` line 290 says.
5. **BO accounts (11175):** the 9 usernames in §4a item 4, username only, no passwords. Remarks say "Pending BA's confirmation on Kelvin BO accessibility" (R13, TS09) and "Pending Izni's password" (R16, TS12).
6. **Credit companies (10937 Configuration R21):** "ABC SAMPLE, CARSOME CAPITAL, and X STAR TECHNOLOGY". 11175 needs at least 3 in "Permission to view" (R19).
7. **Vehicle and chassis data (10937 Configuration R28–R30):** "TS01_vehicleNo | JAA1006", "TS02_chassisNo | MHF1U2ZZ0G0000003", "TS03_vehicleNo | JAA1007". Ownership Claim rows use "VN = EAE2ETS15A" (R48), "VN = EAHT44F" (R51), "VN = EAE2ETS17" (R54). 11175 gives no actual numbers (R19, R26, R29, R30).
8. **Transaction IDs** recorded in 10937 E2E Remarks for TS10–TS14 (R31, R34, R37, R40, R43), e.g. "58c9c03e-c1b1-47b1-93b5-260ff07bf95b".
9. **Developer help needed:** Day 30 / Day 31 tests need "Request dev to patch the Jomcheck approval date" (10937 E2E R18, R20).
10. **Two UCD sessions** on the same transaction for the concurrency tests (10937 E2E R21, R23).
11. **Payment:** RHB account balance (popup text, 11175 R20). Reference format "RHB (JOMxxxxxxx-xxxxxx)" (11175 R25).
12. **Whitelisting tests** need a **non-whitelisted IP** (11175 R37, R38). How one was obtained is not written.
13. **EAINT-10089 environment:** not named in the sheet. `environments-history.md` line 58 puts the JomCheck CRs, 10089 included, on uat3 from 2026-08-05. The 10089 workbook was last modified 11/06/2026, two months earlier, so its test run may have been on a different instance [unconfirmed].
14. **EAINT-10089 accounts:** "UCD portal", "BackOffice" and "BackOffice (Finance)" only (R3–R15). No usernames, **no credentials** in the sheet.
15. **EAINT-10089 data:** "Open any JomCheck transaction" (R9, R10). No vehicle number, chassis number or transaction id is written. TS-008 to TS-012 used "both existing and new transactions" (R11–R15).
16. **Dev help:** a patch to show the Download hyperlink for TS-011 (R14).

## 6. Gaps and risks a regression should still cover

1. **11175 TS09 and TS12 say PASS but their remarks say "Pending".** TS09 is "Pending BA's confirmation on Kelvin BO accessibility" (R13). TS12 is "Pending Izni's password" (R16). Treat both PASS results as **not confirmed**.
2. **11175 TS23 is "In Progress"** and is a word-for-word copy of TS22. Most likely it should have been the "Yes" step for ALL companies [unconfirmed].
3. **11175 R29 has no TS number,** and TS24 repeats its steps "21. … 22." TS19 and TS20 both use step "13.". Step numbers in that section are not reliable for automation.
4. **11175 TS03 title disagrees with its own expected result.** The title says "all 3 new checkboxes default to unticked", but the expected result has "Allow Login to Service Portal - ticked by default". Go by the expected result.
5. **11175 TS27 contradicts itself.** It says the login box is ticked by default for existing accounts and also "No unintended Service Portal access is granted without explicit BO action." Check what existing accounts actually got after deployment.
6. **Checkbox 1 negative path** is covered only in the 10937 workbook (E2E TS03, Checkbox TS02), not in 11175. A regression that uses only the 11175 script misses it.
7. **10937 E2E TS09 never ran** (existing Wholesale transactions before deployment, R28, "P2").
8. **Severity bands are out of date.** 10937 S&F R49–R52 list 4 bands. EAINT-12339 later expanded severity to 6 bands (`flow-jomcheck.md` §4). Do not reuse these column checks as they stand.
9. **Ownership Claim expected results look inconsistent.** E2E TS17 R56 gives superadmin "(4)" but credit company "(3)", and TS18 R57 says "before deployment" for an eSTM approved after deployment. Confirm with the BA before reusing [unconfirmed].
10. **Retest notes left open.** S&F TS39: "Might need to retest on this after dev deploy the latest changes" (R41). S&F TS48: "Can recheck this after dev deploy the latest changes." (R51).
11. **Duplicate ids.** The Permission TS sheet reuses "10937_E2E_TS01"–"TS06", which also exist on the E2E sheet. Any automation or evidence naming by id will collide.
12. **Progress Tracker overstates.** It shows 109/109 Pass from typed numbers while E2E TS09 has no result.
13. **"Only latest report" rule not tested deeply.** No row shares an older report with a company, then buys a newer one not shared, and checks which one the company sees.
14. **11175 × 10937 interplay.** No test unticks "Allow Login to Service Portal" for a company that already has shared reports, or unticks Login while Bypass is ticked.
15. **Day 30 cut-off time.** Only whole days (patched to Day 30 / Day 31) are tested, not the exact hour of expiry.
16. **Credit company export rows.** S&F TS44 checks the columns only, not that the rows are limited to reports shared with that company.
17. **No audit or history check** on who changed the BO checkboxes. `flow-service-portal-shell.md` line 171 says a backend audit log exists for sharing; neither workbook checks it.
18. **Authorised list in production.** `production-regression-scope.md` item 11a gives "Authorized User : [superadmin account]". The 11175 TS names 9 specific users. Which rule is enforced (role or named list) is [unconfirmed].
19. **10089: existing vs new price is not split out.** No row checks that a transaction approved before deployment still shows RM18 everywhere. The only note is "Tested with both existing and new transactions" (R11–R15), against an expected result of "ALL … updated pricing". See §4c item 41.
20. **10089: weak expected results.** TS-006, TS-007 and TS-010 to TS-012 say only "All the pricing details are updated accordingly." (R9, R10, R13–R15). No figures are written for the invoice, Payment Breakdown, Download Payment Document or UCD Payment Report. A regression needs the RM20.00 / RM1.60 / RM21.60 values (§4c item 37) written in.
21. **10089 invoice table is out of date.** The "JomCheck Invoice Price" sheet shows one line. After EAINT-12412 the invoice has two lines, RM18 + RM2 (`flow-jomcheck.md` §9b). Do not reuse R6–R12 for transactions approved after the 12412 go-live.
22. **10089: no Wholesale price check.** The Wholesale chatbot JomCheck price is a separate ticket (EAINT-12279, `production-regression-scope.md` table 11.1, 20260914). A JomCheck price regression must cover both.
23. **10089: Retry or Resubmit on an old RM18 transaction** is not in this workbook. It is covered only by 10937 E2E TS13–TS14 "(Ensure it is RM20)" (R42, R45).
24. **10089: no receipt, email or BO JomCheck Listing amount check.** Only the pages in §2c are covered.
25. **10089: video check is manual** (TS-004, R6). It cannot be automated by DOM checks.
26. **10089 TS-003 title and steps are copied from TS-002** (R4 vs R5). Go by the expected result (sidebar Price section).
27. **10089 TS-005 id is used twice** (R7, R8). Evidence named by id will collide.

## 7. Where these TS change or add to the knowledge files

1. **`flow-jomcheck.md` §5** says "`EAINT-11175 - ... .xlsx` — not opened this session". Out of date: this study reads it in full.
2. **`flow-jomcheck.md` §5** says the 10937 workbook rows were "all rows seen were `PASS`". Not quite: E2E TS09 (R28) has no result.
3. **`flow-jomcheck.md` §5** says "Reset clears filters but not search". The sheet says "Clears all filters. ⏎ It does not clear out the listing" (S&F R47). The listing stays, not the search.
4. **`flow-jomcheck.md` §5a item 5 and `business-rules-from-test-scenarios.md` §5 item 11.4** say "Revoking the UCD's sharing permission hides the section". True only when the revoked company is the last one (Checkbox R6). With several, only that company drops off (Checkbox R8; Permission R4, R6, R8).
5. **`flow-jomcheck.md` §3 item 2** says the checkboxes "were added to remove a prior manual IT-ticket-based process for Ops". Neither workbook shows that; not contradicted.
6. **`flow-bo-shell.md` §3.1 item 4** and **`business-rules-from-test-scenarios.md` BO item 9** match 11175 rows 4–6, 17. They lack the existing-account defaults and the authorised user list.
7. **`business-rules-from-test-scenarios.md` §5 item 4** cites the sharing popup at "row 21", which matches 11175 R21 (TS16).
8. **`business-rules-from-test-scenarios.md` §14 item 1** matches 10937 S&F R3.
9. **`flow-service-portal-shell.md` line 171** says "only reports purchased after EAINT-10937 deployed appear". The 10937 E2E TS11–TS14 suggest it is reports **approved** after deployment, even if started before (R36, R39, R42, R45) [unconfirmed].
10. **`cr-test-scenario-catalogue.md` row 010** gives "E2E:19" and total "78". The sheet has 18 E2E ids and 77 ids in all; the extra one is probably the R59 label row [unconfirmed].
11. **`flow-jomcheck.md` §5** (line 134) says "JomCheck Invoice Price" was "not opened this session". Out of date: it is read in §4c item 37. "all rows seen were `PASS`" is true for the 10089 workbook (13 of 13).
12. **`cr-test-scenario-catalogue.md` row 007** gives the tester as "Siti Nur Azila Binti Mohamed". The sheet's QA column says "Charmain" on all 13 rows. The catalogue name is probably the file's SharePoint author, not the tester [unconfirmed]. Its count "Price Change Functional:13" is rows; there are 12 ids.
13. **`flow-jomcheck.md` §4** (line 104) says EAINT-10089 delivered the "JomCheck report sharing checkbox (UCD side)". The 10089 workbook has no sharing rows; sharing is tested only in the 10937 and 11175 workbooks. Not contradicted, but the 10089 workbook is not evidence for it.
14. **`business-rules-from-test-scenarios.md` §5 items 1–2** match 10089 R4, R5, R7 and R11 exactly. They lack the chassis text (R8) and the e-Invoice listing amounts (R12).
15. **`production-regression-scope.md` §7.1 item 2a** ("JomCheck Fee remain as RM18" for existing approved transactions) conflicts with 10089 R11's "ALL … updated pricing" plus "Tested with both existing and new transactions". See §4c item 41.
16. **`flow-jomcheck.md` §9b** (line 1474, eAuto RM6 after EAINT-10089) is backed by 10089 R11 "EAUTO (RM) = 6.00".

## Knowledge candidates

1. **Defaults on existing accounts after deployment.** "'Full Enquiry' and 'Allow Login to Service Portal' checkbox is ticked by default for pre-existing accounts." `[from SharePoint TS #012 EAINT-11175, sheet Sheet1, row 34]`. "'Allow Bypass Whitelisting Feature' checkbox is unticked by default." `[… row 39]`. Target: `flow-bo-shell.md` §3.1 item 4 and `flow-jomcheck.md` §3.
2. **Authorised BO users for the 3 checkboxes:** kmcheah, jasons, eautonurul, mfared, nikmuhamad, eautokelvin, eautosoyeng, eautozara, mfizni `[from SharePoint TS #012 EAINT-11175, sheet Sheet1, rows 8-16]`. eautokelvin and mfizni were still marked pending `[rows 13, 16, Remarks]`. Target: `flow-bo-shell.md`.
3. **Shared company is locked after payment or Share:** "[ / ]  Credit Company 1 (Checkbox disabled and greyed out) ⏎ [  ]  Credit Company 2 (Checkbox remains enabled)" `[… row 22]`. Text after Share: "The report has been shared with the credit company." `[… row 24]`. Target: `business-rules-from-test-scenarios.md` §5 item 11.
4. **Popup choice:** no company ticked gives the plain payment popup `[… row 20]`. One or more ticked gives the sharing popup, with the BA ruling "we remain the same popup content when UCD wanted to share to one or more than one bank/credit companies." `[… rows 23, 26, 27, Remarks]`. Target: `business-rules-from-test-scenarios.md` §5 item 4.
5. **Checkbox changes need Save:** "Change is NOT persisted. Checkbox reverts to previous state." `[… rows 35, 40]`. Target: `flow-bo-shell.md`.
6. **Service Portal effects of 11175:** unticked Login means "denied login to the Service Portal" `[… row 33]`. Unticked Bypass means "blocked from accessing Service Portal from a non-whitelisted IP" `[… row 38]`. Target: `flow-jomcheck.md` §3.
7. **EAINT-11761** is linked from 11175 TS15 (plain payment popup) `[… row 20, Remarks]`. What it is: [unconfirmed]. Check in Jira before adding.
8. **Correction for `flow-jomcheck.md` §5:** replace "not opened this session" with a pointer to this study.
9. **Day 31 expiry behaviour:** "Verify hint text "Share Report with Fina....." is HIDDEN", "Newly added credit companies CANNOT be ticked/shared" `[from SharePoint TS #010 EAINT-10937, sheet E2E, row 20]`. Day 30 still allows sharing `[… row 18]`. Test needs a developer date patch. Target: `flow-jomcheck.md` §3 item 1.
10. **Concurrent share error:** "Unable to proceed" / "There's some changes on the report sharing to credit company. Please refresh and try again." `[… sheet E2E, rows 21, 23]`. Target: `business-rules-from-test-scenarios.md` §5 item 11.
11. **Wholesale has no share section** `[… sheet E2E, row 27]`. Target: `flow-jomcheck.md` §2 Wholesale.
12. **Pre-deployment transactions** completed on new code get the share section `[… sheet E2E, rows 36, 39, 42, 45]`; approved on old code never do `[… rows 31-33]`. Target: `flow-service-portal-shell.md` line 171 (refine "purchased after" to "approved after" once confirmed).
13. **Revoke removes one company, not the whole section, when others remain** `[… sheet Checkbox Behaviour (Special TS), row 8]`; `[… sheet Permission TS, rows 4, 6, 8]`. Target: correct `flow-jomcheck.md` §5a item 5 and `business-rules-from-test-scenarios.md` §5 item 11.4.
14. **Failed payment keeps ticks:** "(Checkbox remained ticked and enabled)" after Retry `[… sheet Checkbox Behaviour (Special TS), row 4]`.
15. **Service Portal JomCheck Report Listing rules:** error texts `[… sheet Functional Testing (S&F), rows 4, 22, 29, 38]`; Shared Date + Payment Date not together `[row 44]`; Shared Date optional with Vehicle No `[row 41]`; export name "JomCheck_Report_Listing_DDMMYYYY_HHmm" `[row 45]`; zip "eauto_service_portal" with subfolder and file naming `[row 53]`; eAuto-user export has "Credit Company", credit company export does not `[rows 45-46]`; 50 per page `[row 48]`; View opens a new tab `[row 54]`. Target: `business-rules-from-test-scenarios.md` §14.
16. **ATL / BER meaning (BA):** "ATL (Record found for Actual) > Vehicle condition that can no longer be repaired"; "BER (Record found for BER) > Vehicle condition that can still be repaired" `[… sheet Functional Testing (S&F), row 51, Remarks]`. Target: `flow-jomcheck.md`.
17. **Reset wording fix:** "Clears all filters. ⏎ It does not clear out the listing" `[… sheet Functional Testing (S&F), row 47]`. Target: `flow-jomcheck.md` §5.
18. **Before/after deployment technique:** create on staging/eauto, then open the same Transaction ID under staging/uat3 `[… sheet E2E, rows 33, 36]`. Target: `automation-playbook.md` [unconfirmed that instances share data].
19. **Catalogue count fix:** row 010 E2E is 18 ids, not 19; Permission TS ids duplicate E2E ids `[… sheet Permission TS, rows 3-14]`. Target: `cr-test-scenario-catalogue.md`.
20. **Chassis price text:** " Chassis number found. Pay now (RM20.00 + 8% Service Tax) to purchase the report." `[from SharePoint TS #007 EAINT-10089, sheet Price Change Functional, row 8]`. Target: `business-rules-from-test-scenarios.md` §5 item 1.
21. **e-Invoice listing amounts at RM20:** "Total Net Amount (RM) = 20.00", "Total Tax Amount (RM) = 1.60", "Total Including Tax (RM) = 21.60" `[… row 12]`. Target: `business-rules-from-test-scenarios.md` §5 item 2.
22. **Single-line invoice at RM20 (pre-EAINT-12412):** "JomCheck service charge | 1 | 20 | 20 | 1.6 | 21.6" `[from SharePoint TS #007 EAINT-10089, sheet JomCheck Invoice Price, row 6]`; totals 20 / 20 / 1.6 / 21.6 / 21.6 `[rows 8-12]`. Target: `flow-jomcheck.md` §9b, as the "before 12412" layout.
23. **Download Payment Document needs a dev patch** to show the Download hyperlink in testing `[… sheet Price Change Functional, row 14]`. Target: `quirks.md` or `automation-playbook.md`.
24. **UCD Report menu pages** that carry JomCheck amounts: Payment Breakdown Report, Download Payment Document, UCD Payment Report `[… rows 13-15]`. Target: `flow-jomcheck.md` (price-change touch points), so a future fee CR lists them.
25. **Price touch points list for a JomCheck fee change:** UCD Home page, JomCheck Report page button text, sidebar Price section, Introductory Video, Get JomCheck Report result text, UCD and BO invoice / e-Invoice, BO SST Payment Report, BO e-Invoice / Consolidated e-Invoice Listing, plus the 3 UCD reports `[… rows 3-15]`. Target: `flow-payments-fees.md`.
26. **Existing-transaction price after a fee change — to confirm:** TS says "ALL … updated pricing" with "Tested with both existing and new transactions" `[… rows 11-15]`; Deployment Checklist says "JomCheck Fee remain as RM18" `[from Deployment Checklist, 20260914 R45]`. Do not add until confirmed with the BA or on staging.
27. **Catalogue tester fix:** row 007 tester is "Charmain" per the QA column `[… sheet Price Change Functional, rows 3-15, column QA]`. Target: `cr-test-scenario-catalogue.md`.
28. **Pointer fix:** `flow-jomcheck.md` §5 "JomCheck Invoice Price (not opened this session)" → point to this study.
