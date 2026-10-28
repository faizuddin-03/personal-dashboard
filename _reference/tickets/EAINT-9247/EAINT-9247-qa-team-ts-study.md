# EAINT-9247 — QA Team test script study (2026-10-27)

Written unattended by the SharePoint Scribe. Read-only study of another QA team's workbook. Nothing here was tested by Faizuddin. Row refs are `[<sheet>, R<n>]` from the text copy.

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9247 - [eAuto] SSM Integration For LLP.md` (exported 27/10/2026, 9:14:38 pm). All 9 sheets read in full. Cell text only; colours, images and comments are not in the copy.
2. **QA colleague's ledger (read-only clone):** `_reference/codebases/eauto-qa-azfar/cr/EAINT-9247/LEDGER.md` (written 2026-10-20). Used only for SRD, fixVersion and open QA-Issue facts.
3. **Knowledge:** `knowledge/flow-ssm.md`, `knowledge/business-rules-from-test-scenarios.md` §1.3, §1.4, §4.2, grep hits in `knowledge/flow-company-profile-einvoice.md`, `knowledge/flow-stms.md`, `knowledge/production-regression-scope.md`, `knowledge/cr-test-scenario-catalogue.md`.
4. **lib/ticketStudies.ts:** no entry for EAINT-9247. It is only listed as `related` on EAINT-12121 and EAINT-12230.
5. **Not found:** `_reference/tickets/EAINT-9247/` (did not exist before this file) and `_reference/tickets/Studying/EAINT-9247/`.
6. **Not read:** Jira ticket and SRD V1.0 (no local copy; this run has no Jira access). SRD facts below come second-hand from the colleague's ledger.

## 1. Header

1. **Ticket:** EAINT-9247 "[eAuto] SSM Integration For LLP". Also carries **EAINT-10691** (SSM price/SST change) and **EAINT-8646** (BO SSM XML Log) sheets.
2. **Portals / modules:** UCD Portal (STMS Step 2/4/5, eSTM Step 2/4/5, Company/Business Profile = Pre e-Invoice), Back Office (Transaction Details, SSM Transaction Listing, SSM XML Log), RHB payment, MyInvois.
3. **Workbook:** "EAINT-9247 - [eAuto] SSM Integration For LLP.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 27/04/2026, 7:36:06 pm.
4. **Live:** fixVersion "S28.6-20260427 (go-live 27.04.2026)" `[azfar LEDGER.md, table row "Live"]`. Production regression list: "EAINT-9247 | 20260427 | SSM for LLP | Yes" `[knowledge/production-regression-scope.md:977]`.
5. **Sheets and counts (rows with a TS id):**

| # | Sheet | Rows | PASS | FAILED | N/A |
|---|---|---|---|---|---|
| 1 | E2E Scenarios - eSTM | 59 (TS01–TS58; TS24 listed twice) | 47 | 0 | 12 ("Deprio") |
| 2 | Func. TS (eSTM; Flow) | 71 (TS01–TS69; TS47 and TS51 listed twice) | 71 | 0 | 0 |
| 3 | E2E Scenarios - STMS | 59 (TS01–TS58; TS24 listed twice) | 47 | 0 | 12 ("Deprio") |
| 4 | Func. TS (STMS; Flow) | 69 | 69 | 0 | 0 |
| 5 | Error Code TS | 22 (ENQ_LLP_TS1–11, FS_LLP_TS1–11) | 22 | 0 | 0 |
| 6 | SSM XML Log (EAINT-8646) | 79 (HP_TS1 + TS1–TS78) | 75 | 2 | 2 |
| 7 | E2E Scenarios - Pre e-Invoice | 27 | 27 | 0 | 0 |
| 8 | Regression | 10 | 4 | 0 | 6 ("Deprio") |
| 9 | SSM Price Change Regression | 24 (10691_PC_TS1–TS24) | 23 | 0 | 1 |
|   | **Total** | **420** | **385** | **2** | **33** |

6. **Testers (QA column):** four QA engineers (Teck Yung, Nick, Maisarah, Charmain). Remarks refer to a developer as "KJ".
7. **Dates:** none written in the sheets. The only date is a sample value, "complete the transaction by 10 February 2025" `[E2E Scenarios - eSTM, R22]`.
8. **Environment:** not stated anywhere in the workbook.

## 2. What the ticket changed, as the TS shows it

1. **LLP added as a third Type of Business** at Step 2 of eSTM and STMS: "Sdn Bhd or Bhd ⏎ - Sole Proprietorship or Partnership ⏎ - Limited Liability Partnership (LLP)", "unselected by default" `[Func. TS (eSTM; Flow), R3]` `[Func. TS (STMS; Flow), R3]`.
2. **SSM purchase and verification for LLP** at Step 4 of eSTM (buyer company) and STMS (seller company), using the LLP **Partner** IC as the match `[E2E Scenarios - eSTM, R7–R11]`.
3. **Type of Business label "Limited Liability Partnership (LLP)"** on Step 4/5/6, UCD and BO Transaction Details, and SSM Transaction Details `[E2E Scenarios - eSTM, R3]`.
4. **LLP document set** at Step 2 and in the "SSM Permission Change handling" upload section: SSM LLP Profile, Authorization Letter, Staff Employment Pass & MyKad `[Func. TS (eSTM; Flow), R29]`.
5. **SSM purchase for LLP in Company/Business Profile (Pre e-Invoice)** `[E2E Scenarios - Pre e-Invoice, R3–R29]`.
6. **SRD scope (second-hand):** "It changes only the Type of Business label for LLP; "all other system behaviours will remain unchanged"" `[azfar LEDGER.md, line 3]`. The workbook tests far more than a label (verification, errors, 7-day reuse, uploads), so most rows are regression of EAINT-5155 / EAINT-8802 behaviour run on LLP data [unconfirmed].
7. **Bundled extras:** SSM price split RM15.00 + RM3.00 + RM1.44 (EAINT-10691) and the BO SSM XML Log page (EAINT-8646).

## 3. Scenarios, grouped

### 3a. E2E Scenarios - eSTM (buyer) — STMS sheet mirrors it with "Seller"

1. **TS01–TS04 Happy flow** (eSTM ± eVOC, Car/Bike, New/Existing vehicle) — popup "SSM Document Verification" / "Verification successful: The Buyer representative's information matches the SSM document."; SSM Document, Invoice, e-Invoice "(if TIN valid)" on Step 4/5, UCD + BO details, BO "Export CSV". PASS `[R3–R6]`.
2. **TS05 Two partners, same LLP ROC** — Buyer B gets "SSM Document for this Buyer Company was purchased recently." then success popup. PASS `[R7]`.
3. **TS06 Non-partner then partner** — A: "Verification failed: The Buyer representative's information does not match the SSM document."; B reuses and passes. PASS `[R8]`.
4. **TS07 Partner then non-partner** — B fails IC check on the reused SSM. PASS `[R9]`.
5. **TS08 Partner then Compliance Officer** — Compliance Officer "IC = Not Matched > Unable to proceed". PASS `[R10]`.
6. **TS09 Old ROC then New ROC, same partner** — second deal auto-retrieves the SSM bought under the old ROC. PASS `[R11]`.
7. **TS10–TS12 Entity status DISSOLVED / WINDING UP / STRIKING OFF within and over 7 days** — "Deprio", N/A `[R12–R14]`.
8. **TS13–TS14 Duplicate purchase, two browsers, same ROC** — B gets "purchased recently", closes popup, reuses A's SSM, reaches Approved. PASS; remark "Tested together with 9247_ESTM_ E2E_TS05" `[R15–R16]`.
9. **TS15–TS16 A's SSM payment fails, B buys, A pays again** — A gets "purchased recently"; Step 4 refreshes with the 7-day message and [SSM Document]/[SSM Invoice]. PASS `[R17–R18]`.
10. **TS17 Resubmit within 7 days** (dev patches SSM Created Date) — "Redirect to Step 5 & should display all SSM related document buttons and info". PASS `[R19]`.
11. **TS18–TS19 Resubmit after 7 days** — no [SSM Document] on details, back to Step 4 with [Purchase SSM]; BO downloads all SSM documents "in zip folder". PASS `[R20–R21]`.
12. **TS20–TS22 Final Submission failed + cronjob + 7-day expiry** — Deprio `[R22–R24]`.
13. **TS23 Cross-module** — SSM bought in STMS auto-retrieved at eSTM Step 4. PASS `[R25]`.
14. **TS24 Two eSTMs, failed JPJ enquiry, expiry and repurchase (18 steps)** — Deprio; row duplicated `[R26–R27]`.
15. **TS25–TS26 Negative: Entity Status != EXISTING** — "Verification failed: The Buyer Company/Business Status is inactive, unable to proceed. Kindly proceed to JPJ counter." PASS; remark "SSM Tx status = Successful" `[R30–R31]`.
16. **TS27–TS28 Negative: Partner IC not matched** — "does not match" popup. PASS `[R32–R33]`.
17. **TS29 Invalid Company Reg. No (eVOC)** — "Purchase SSM Document" / "The SSM Document is not available for purchase. Please re-check the Buyer SSM number." PASS `[R34]`.
18. **TS30 Invalid Company Reg. No (no eVOC)** — expected result is the **success** popup and three buttons. PASS `[R35]` (see §6).
19. **TS31–TS32 Final Submission failed, then cronjob** — "Ensure to show 2 popup message"; "'Verification unavailable now. Please call eAuto at 1700816186' message + [SSM Invoice] button"; after cronjob, success popup + 3 buttons. PASS `[R36–R37]`.
20. **TS33–TS34 RHB payment failed (IF / RE)** — popup "Payment", "{rhb_error_description}". PASS `[R38–R39]`.
21. **TS35–TS36 Enquiry code 009 then 004** — connectivity popup, then success. PASS `[R40–R41]`.
22. **TS37–TS38 Duplicate purchase where A's entity status fails** — B reuses A's SSM and is also blocked. PASS `[R42–R43]`.
23. **TS39–TS42 Duplicate purchase with IC not matched / payment failed** — Deprio `[R44–R47]`.
24. **TS43–TS58 SSM Permission revoked mid-flow** at Step 4 (TS43–46), Step 5 (TS47–50), Retry Payment (TS51–54), Resubmit from listing (TS55–58) — popup "Upload Buyer Company Information", upload section, [Update Document], Make Payment/Next disabled until upload, then BO shows all 3 documents. All PASS `[R50–R65]`.

### 3b. Func. TS (eSTM; Flow) — STMS sheet mirrors it

1. **TS01–TS11 Step 2, with SSM Permission** — radios, LLP shows only Authorization Letter, "This field is required", 5MB boundary (5MB / 4.9MB pass, 5.1MB "File size too big"), PDF/JPEG/PNG pass, other types "Invalid file type". PASS `[R3–R13]`.
2. **TS12–TS14 Type of Business label** on Step 4/5/6 (below "Buyer's Rep Name") and UCD/BO details (below "Company Reg No"). PASS `[R15–R19]`.
3. **TS15–TS21 BO uploaded documents** at Draft / Pending / Approved / Failed / Cancelled — "Authorization Letter"; hyperlink and OPEN ALL. PASS `[R20–R26]`.
4. **TS22–TS31 Step 2, without SSM Permission** — 3 upload fields; same size/type checks. PASS `[R29–R38]`.
5. **TS32–TS41 Label and BO documents, without permission** — all 3 documents listed at every status. PASS `[R40–R51]`.
6. **TS42–TS51 Manual upload at Step 4** — popup errors per field for >5MB and wrong type. PASS `[R54–R63]`.
7. **TS51–TS59 Manual upload at Step 5** (id TS51 and TS47 reused). PASS `[R65–R74]`.
8. **TS60–TS69 Manual upload at Retry Payment**. PASS `[R76–R85]`.

### 3c. Error Code TS (both modules)

1. **ENQ_LLP_TS1 code 004 "Found"** — "SSM Check = OK, Tx Status = Pending ⏎ • UCD able to proceed to make payment". PASS `[R4]`.
2. **ENQ_LLP_TS2 code 009** — connectivity popup, stays at Step 4. PASS `[R5]`.
3. **ENQ_LLP_TS3–TS11 codes 001, 002, 003, 005, 006, 007, 008, 010, 011** — "SSM Check = Failed, SSM Tx Status = Failed", popup "The SSM Document is not available for purchase. Please re-check the Buyer SSM number". PASS `[R7–R15]`.
4. **FS_LLP_TS1 code 005 "Confirm"** — "SSM Check = OK, Tx Status = Approved". PASS `[R18]`.
5. **FS_LLP_TS2–TS11 codes 009, 001, 002, 003, 004, 006, 007, 008, 010, 011** — two popups (connectivity, then "Verification unavailable now. Please call eAuto at 03-27798899."), then that text shows "at SSM Document with [Invoice] button". PASS `[R19–R29]`.

### 3d. SSM XML Log (EAINT-8646, Back Office)

1. **HP_TS1** — menu entry "below JPJ XML Log (eDereg Pre-Checking)". PASS `[R3]`.
2. **TS1–TS39 Text filters** (Company Name, Registration No., Director IC, Director Name) — empty / full / partial / not found / special / non-English. **TS14 and TS31 FAILED** (special characters in Registration No. and Director IC) `[R20, R37]`.
3. **TS16–TS25 Business Ownership dropdown and Company Status checkboxes**. PASS `[R22–R31]`.
4. **TS40–TS57 State dropdown**, 16 states + All. PASS `[R46–R63]`.
5. **TS58–TS61 Search, pagination, reset** — "max 20 records" per page. PASS `[R64–R67]`.
6. **TS62–TS74 Export and its access control** — TS67 N/A, TS74 N/A `[R68–R80]`.
7. **TS75–TS78 View link, column order and formats**. PASS `[R81–R84]`.

### 3e. E2E Scenarios - Pre e-Invoice (Company/Business Profile)

1. **TS01 Happy flow** from three entry points — profile shows SSM Document, Invoice, e-Invoice and "SSM Document Purchase Date: dd Month YYYY HH:MM AM/PM". PASS `[R3]`.
2. **TS02–TS06 Enquiry fails, then succeeds** — "The SSM Document is not available for purchase." then redirect to homepage; retry shows price RM19.44. PASS `[R4–R8]`.
3. **TS07–TS11 RHB payment fails twice (IF), then succeeds** — Payment History lines kept per attempt. PASS `[R9–R13]`.
4. **TS12–TS19 Final Submission fails, cronjob fixes it** — [Agree to Purchase] disabled; later [Continue] goes to Step 3. PASS `[R14–R21]`.
5. **TS20–TS27 Duplicate tab** — second tab "Payment" / "SSM Document for this Company was purchased recently."; documents stay from the first tab. PASS `[R22–R29]`.

### 3f. Regression

1. **REG_TS01–TS08** — STMS and eSTM happy flows on Sdn Bhd / Sole Prop. TS01, 02, 05, 06 PASS; TS03, 04, 07, 08 Deprio `[R3–R10]`.
2. **REG_TS09–TS10** — expired SSM repurchase by a second user, ROC and ROB. Deprio `[R11–R12]`.

### 3g. SSM Price Change Regression (EAINT-10691)

1. **PC_TS1–TS2, TS4–TS5, TS7** — price summary at STMS/eSTM Step 4 (new and retry) and Profile Step 2: RM15.00 + RM3.00 + RM1.44 = RM19.44. PASS `[R3–R9]`.
2. **PC_TS3, TS6, TS8** — MyInvois details: code 022, unit price 18.00, tax 1.44, total 19.44. PASS `[R5, R8, R10]`.
3. **PC_TS9–TS10** — Pre-Application payment "Remain as RM 108.00". PASS `[R11–R12]`.
4. **PC_TS11–TS24** — SSM Invoice / e-Invoice line on every page. PASS except **TS19 N/A** (BO eSTM Reset Payment) `[R16–R29]`.

## 4. Business rules and system behaviour the TS reveals

1. **Only a Partner passes the LLP IC check.** Compliance Officer: "Compliance Officer IC = Not Matched > Unable to proceed eSTM + eVOC + SSM" `[E2E Scenarios - eSTM, R10]`.
2. **Entity status must be EXISTING.** Any other (DISSOLVED, WINDING UP, STRIKING OFF) gives "Verification failed: The Buyer Company/Business Status is inactive, unable to proceed. Kindly proceed to JPJ counter." `[E2E Scenarios - eSTM, R30]` `[E2E Scenarios - STMS, R14]`.
3. **7-day reuse, shared across users and modules.** "System detected there is 1 approved SSM Document (valid within 7 days)" `[E2E Scenarios - eSTM, R7]`; STMS purchase is auto-retrieved in eSTM `[E2E Scenarios - eSTM, R25]` and the reverse `[E2E Scenarios - STMS, R25]`.
4. **Old ROC and New ROC are treated as one company.** "New ROC > Auto retrieve SSM purchased in previous eSTM" `[E2E Scenarios - eSTM, R11]`.
5. **A reused SSM carries its failure.** If A's SSM failed the entity check, B is blocked too: "UCD B unable to proceed eSTM further" `[E2E Scenarios - eSTM, R43]`.
6. **Retry payment is refused once another user's SSM is approved.** A "make payment again" gets "SSM Document for this Buyer Company was purchased recently." `[E2E Scenarios - eSTM, R17]`.
7. **7-day message:** "The SSM document is valid for 7 days only. Download SSM document now, complete the transaction by DD Month YYYY,  or repurchase is required." `[E2E Scenarios - eSTM, R18]`.
8. **After 7 days:** "Ensure in SSM & eSTM Details page does not show the [SSM Document] button ⏎ Redirect to Step 4 -  JPJ Check page ⏎ Step 4 should display the [Purchase SSM] button" `[E2E Scenarios - eSTM, R20]`.
9. **BO zip download:** "Once BO click on the “SSM Document” button will download in zip folder" `[E2E Scenarios - eSTM, R21]`.
10. **Cronjob:** "Cronjob (within 24 hours), will auto resubmit failed SSM Final submission every 2 minutes interval" `[E2E Scenarios - Pre e-Invoice, R18]`.
11. **Failed tx can be resubmitted:** "Ensure Tx Status = Failed (can resubmit from trx listing) ⏎ Ensure Verification Failed popup message will always display when browser is refreshed or redirect to step 4" `[E2E Scenarios - eSTM, R12]` (Deprio row; not tested).
12. **Enquiry code rule:** only 004 passes enquiry ("SSM Check = OK, Tx Status = Pending") `[Error Code TS, R4]`; only 005 passes final submission ("SSM Check = OK, Tx Status = Approved") `[Error Code TS, R18]`. 009 has its own connectivity popup `[Error Code TS, R5]`.
13. **LLP document set without SSM permission:** "SSM LLP Profile: * (Purchase date MUST be within last 7 days. Upload in .pdf only)" and "Staff Employment Pass & MyKad: * (Representative MUST be either any one of the Partners or an employee. Upload employment pass and copy of MyKad in .pdf / .jpeg / .png)" `[Func. TS (STMS; Flow), R29]`.
14. **With SSM permission, LLP uploads only** "Authorization Letter: * (Limited Liability Partnership signed and agreed to dispose the vehicle. Please include name & MyKad number of the representative. Upload in .pdf / .jpeg / .png)" `[Func. TS (eSTM; Flow), R4]`.
15. **Step 2 inline errors:** "This field is required", "File size too big", "Invalid file type" `[Func. TS (eSTM; Flow), R5, R9, R13]`.
16. **Step 4/5 upload popup errors:** "SSM LLP Profile have exceeded allowed file size limit of 5MB. Please re-do." and "SSM LLP Profile file format is not allowed. Please check again." `[Func. TS (eSTM; Flow), R58, R63]`.
17. **Permission revoked mid-flow:** popup "Upload Buyer Company Information" / "Unable to purchase SSM document, please complete the Buyer Company Information by uploading SSM LLP Profile, Staff Employment Pass & MyKad." `[E2E Scenarios - eSTM, R50]`; after upload "Document successfully updated." and Make Payment enabled `[R52]`.
18. **STMS popup has no [X]:** "The popup is without the "X" button, however in Prod is also the same and based on BA, can remain it." `[E2E Scenarios - STMS, R50, Remarks]`.
19. **RHB IF failure text (Pre e-Invoice):** "Wang di dalam akaun RHB anda TIDAK MENCUKUPI. 你的RHB银行余额不足." and Payment History "RHB (SSMYYMMDDXXXXXX) - Failed (IF - …)" `[E2E Scenarios - Pre e-Invoice, R10]`.
20. **Pre e-Invoice Final Submission failure** disables the button: "Ensure Agree to Purchase button disabled" `[E2E Scenarios - Pre e-Invoice, R17]`.
21. **SSM e-Invoice only "if TIN valid"**; e-Invoice for Profile Update was dropped: "As discussed with KJ, since we cannot get SSM e-Invoice due to LHDN side, we will deprioritise on the e-Invoice" `[SSM Price Change Regression, R21]`.
22. **Price split (April 2026):** "SSM Document Fee : RM 15.00 ⏎ eAuto Service Fee : RM 3.00 ⏎ eAuto Service Tax : RM 1.44 ⏎ Total Amount Payable : RM 19.44" `[SSM Price Change Regression, R3]`.
23. **XML Log rules:** "Ensure only max 20 records allowed per page" `[SSM XML Log, R65]`; Registration No. and Director IC need an exact match (partial gives "No record found") `[R17, R34]`; Business Ownership shows "Partnership" only: "Pass but the field name will display only "Partnership"" `[R25]`; "No numbered buttons" `[R66]`.
24. **XML Log Export:** "As requested by BA, Export hyperlink will be hidden in this enhancement." `[SSM XML Log, R80, Remarks]`. Rows above it still list six named BO users who can export `[R71–R76]`.

## 5. Test data, environments, accounts, setup

1. **Environment:** not stated in the workbook.
2. **Credentials:** none in the workbook.
3. **BO user IDs** are named for the XML Log export check (jasons, kmcheah, rosalindkoo, nikmuhamad, mfared, mfizni) `[SSM XML Log, R71–R76]`. These are login names, not passwords.
4. **Transaction refs in remarks:** "TY5552456B > E641940647 ⏎ Need to ask KJ to patch to Cancelled." `[Func. TS (eSTM; Flow), R24]`; "TYY5345H > S644492822 > Ask KJ to patch to cancelled" `[Func. TS (STMS; Flow), R49]`.
5. **Dev patches needed:** SSM Created/Expiry Date for the 7-day rows; Tx Status Cancelled for the Cancelled-status rows; "Patch SSM to expired" for Retry Payment rows `[E2E Scenarios - eSTM, R19, R58]`.
6. **Two browsers** (normal + Incognito) for duplicate purchase `[E2E Scenarios - eSTM, R15]`; duplicate tab for Pre e-Invoice `[E2E Scenarios - Pre e-Invoice, R23]`.
7. **SSM response codes** set per row (004, 005, 009, etc.), done in eSim on staging [unconfirmed — eSim not named in the sheet; see `knowledge/flow-ssm.md` Roles].
8. **Test files:** exactly 5MB, 4.9MB, 5.1MB; PDF, JPEG, PNG; .xlsx/.docx/.exe/.gif as invalid.
9. **Company types in Regression:** "sole prop" and "Sdn Bhd" `[Regression, R3, R7, Remarks]`.

## 6. Gaps or risks a regression should still cover

1. **Phone number conflict.** E2E sheets and Pre e-Invoice say "Please call eAuto at 1700816186" `[E2E Scenarios - eSTM, R36]` `[E2E Scenarios - Pre e-Invoice, R16]`. Error Code TS says "Please call eAuto at 03-27798899." `[Error Code TS, R19–R29]`. Both marked PASS. Check which the screen shows.
2. **Entity status branches never run.** TS10–TS12 (DISSOLVED / WINDING UP / STRIKING OFF across 7 days) are Deprio in both modules. Only the generic "!= EXISTING" rows passed.
3. **Duplicate purchase with IC mismatch / payment failure** (TS39–TS42) never run in either module.
4. **Final Submission fail + 7-day expiry chain** (TS20–TS22) and the two-transaction chain (TS24) never run.
5. **Regression on Sdn Bhd / Sole Prop without eVOC/TH** (REG_TS03, 04, 07, 08) and ROB repurchase (REG_TS10) never run.
6. **PASS rows with failure remarks.** "File can be uploaded successfully, but after uploading file and click Next unable to go to step 3" `[Func. TS (eSTM; Flow), R32–R33]`; "some file types are blocked when proceeding to Step 3, pending BA final confirmation with Ops" `[R35–R37]`. Outcome not recorded.
7. **Upload wording bug** — "In the content, it is still showing "SSM Company Profile" ⏎ Issue raised to kj and retested" `[E2E Scenarios - eSTM, R50]`. The STMS row has the same remark without "retested" `[E2E Scenarios - STMS, R50]`. Recheck LLP wording in STMS.
8. **Uploaded file not shown** — "Staff Employment Pass & MyKad is not showing the file uploaded" `[E2E Scenarios - STMS, R52]` (no retest note, PASS).
9. **XML Log special-character search FAILED** (TS14, TS31) — no QA-Issue reference in the sheet.
10. **XML Log Export contradiction** — TS62–TS73 pass export and per-user access, yet R80 says Export "will be hidden". Check current state.
11. **e-Invoice coverage weak** — "Need to check baack on einvoice again as the TIN number was valid." `[E2E Scenarios - Pre e-Invoice, R3]`; Profile Update e-Invoice deprioritised.
12. **Odd expected results** [unconfirmed copy errors]: TS30 "Invalid Company Reg. No" expects the success popup `[E2E Scenarios - eSTM, R35]`; TS09 single-partner row describes "Buyer B" `[R11]`; STMS FUNC_TS12/32 says "Buyer's Rep Name" on a seller flow `[Func. TS (STMS; Flow), R15, R40]`.
13. **Wording drift** — "Company/Business is inactive" `[E2E Scenarios - eSTM, R43]` vs "Company/Business Status is inactive" `[R30]`; "Kindly proceed to JPJ Counter" vs "counter".
14. **Open QA-Issues** under 9247 reported "Ready in 1st Env": EAINT-10696, 10513, 10507, 10503 `[azfar LEDGER.md, line 30]`. FUNC_TS23 remark links EAINT-10503 `[Func. TS (eSTM; Flow), R30]`.
15. **Future change:** EAINT-12121 (removes the 7-day block) and EAINT-12230 (duplicate-purchase guard) will change rules 3, 6, 8 and 9 of §4. TS13–TS19 must be re-baselined then.
16. **No mobile / Sub UCD rows** in this workbook.

## 7. Where this agrees with or changes knowledge/

1. **flow-stms.md:248** says "[unconfirmed] LLP appears as a third Type of Business in 12054 v1.2 and workbook 9247. No requirement ticket adds it to STMS." This workbook has a full STMS LLP sheet (E2E 59 rows, Func 69 rows), go-live 27.04.2026. The colleague's ledger says SRD V1.0 covers "STMS, eSTM and the Business Profile". So 9247 is the requirement ticket for LLP in STMS.
2. **flow-ssm.md Cronjobs** quotes only "1700816186". The Error Code sheet gives "03-27798899". New conflict.
3. **flow-ssm.md Rules line 143** lists the 3-document set for Sdn Bhd and Sole Prop only. LLP set is missing (see §4 item 13).
4. **flow-ssm.md Open question** "In EAINT-9247 TS13-16 are the 'Multiple UCDs' two users of one company or two companies?" — the sheet says only "Same ROC for both Buyer" and "Normal browser" / "Incognito browser" `[E2E Scenarios - eSTM, R15]`. Still open.
5. **business-rules §4.2** matches the sheet. It lacks the Partner-only rule, the Final Submission rule (only 005 passes) and the second popup text.
6. **Price conflict** (RM15 + RM3 split vs one RM18 line) is already recorded in flow-ssm.md Rules. This workbook is the April 2026 source of the split.

## Knowledge candidates

1. **LLP verification matches the Partner IC only; a Compliance Officer fails.** Source: "Compliance Officer IC = Not Matched > Unable to proceed eSTM + eVOC + SSM" `[SharePoint TS EAINT-9247, sheet E2E Scenarios - eSTM, row 10]`. Target: `knowledge/flow-ssm.md` verification flow.
2. **LLP 3-document set** (no SSM permission): SSM LLP Profile (".pdf only", "Purchase date MUST be within last 7 days"), Authorization Letter, Staff Employment Pass & MyKad (".pdf / .jpeg / .png"). Source: `[sheet Func. TS (STMS; Flow), row 29]`. Target: `knowledge/flow-ssm.md` Rules line 143.
3. **LLP in STMS is from EAINT-9247** (go-live 27.04.2026). Source: `[sheet E2E Scenarios - STMS, rows 3–65]` + `[azfar LEDGER.md, "Live" row]`. Target: resolve `knowledge/flow-stms.md:248`.
4. **Conflict: support phone number.** "1700816186" `[sheet E2E Scenarios - eSTM, row 36]` vs "03-27798899" `[sheet Error Code TS, rows 19–29]`. Target: `knowledge/flow-ssm.md` Cronjobs, as a "Conflict:" line.
5. **Final Submission passes only on code 005; enquiry passes only on 004.** Source: `[sheet Error Code TS, rows 4, 18–29]`. Target: `knowledge/flow-ssm.md` Rules (response codes line).
6. **Final Submission failure shows two popups**, connectivity text then "Verification unavailable now…". Source: `[sheet Error Code TS, row 19]`. Target: `knowledge/flow-ssm.md`.
7. **Cronjob window:** "Cronjob (within 24 hours), will auto resubmit failed SSM Final submission every 2 minutes interval". Source: `[sheet E2E Scenarios - Pre e-Invoice, row 18]`. Target: `knowledge/flow-ssm.md` Cronjobs.
8. **Old ROC and New ROC share one SSM** for 7-day reuse. Source: `[sheet E2E Scenarios - eSTM, row 11]`. Target: `knowledge/flow-ssm.md` "Where the transaction goes".
9. **A reused SSM carries its failed check** to the next user on the same ROC. Source: `[sheet E2E Scenarios - eSTM, rows 42–43]`. Target: `knowledge/flow-ssm.md`.
10. **BO SSM XML Log (EAINT-8646):** menu below "JPJ XML Log (eDereg Pre-Checking)", 20 rows per page, exact match for Registration No. and Director IC, 12 columns in fixed order, Export "will be hidden" per BA. Source: `[sheet SSM XML Log (EAINT-8646), rows 3, 17, 34, 65, 80, 83]`. Target: `knowledge/flow-ssm.md` cross-module effects, or a BO flow file.
11. **STMS "Upload Seller Company Information" popup has no [X]**, accepted by BA as same as Prod. Source: `[sheet E2E Scenarios - STMS, row 50, Remarks]`. Target: `knowledge/flow-ssm.md` permissions flow.
12. **SSM e-Invoice for Profile Update is not testable on staging** ("cannot get SSM e-Invoice due to LHDN side"). Source: `[sheet SSM Price Change Regression, row 21, Remarks]`. Target: `knowledge/flow-company-profile-einvoice.md`.
13. **Pre e-Invoice SSM failure behaviour:** enquiry fail → "The SSM Document is not available for purchase." then homepage; Final Submission fail → [Agree to Purchase] disabled until cronjob fixes it. Source: `[sheet E2E Scenarios - Pre e-Invoice, rows 4–5, 17]`. Target: `knowledge/flow-company-profile-einvoice.md`.
14. **SSM RHB payment reference format** "SSMYYMMDDXXXXXX" in Payment History. Source: `[sheet E2E Scenarios - Pre e-Invoice, row 10]`. Target: `knowledge/eauto-payments.md`.
