# EAINT-7584 — QA Team test script study (2026-10-28)

Scheduled study by the SharePoint Scribe. Read-only; nothing in `knowledge/` or `lib/` was changed.

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-7584 & EAINT-7585 - Update Database & Tomcat Security from rootuser to non-rootuser.md` (text copy dated "28/10/2026, 10:13:30 am"). Cell text only. Formatting, colours and images are not kept.
2. **`knowledge/cr-test-scenario-catalogue.md`** row 057 (line 341) and path row (line 409).
3. **`knowledge/production-regression-scope.md`** §11.4 (lines 1076-1077) and the legend (line 830).
4. **`knowledge/releases.md`** item 4 (line 93).
5. **`knowledge/README.md`** and these flow files, by grep: `flow-stms.md`, `flow-ssm.md`, `flow-estm.md`, `esim.md`.
6. **Not found:** no `_reference/tickets/EAINT-7584/` folder existed before this file, there is no `_reference/tickets/Studying/EAINT-7584/`, and `lib/ticketStudies.ts` has no EAINT-7584 or EAINT-7585 entry.
7. **Not read:** the Jira ticket and any SRD. No SRD for EAINT-7584/7585 is in the repo. A second text copy exists at `_reference/inbox/eauto-flows-run/ts-text/EAINT-7584_&_EAINT-7585_-_Update_Database_&_Tomcat_Security_from_rootuser_to_non-rootuser..txt`; it was not compared.

## 1. Header

1. **Tickets:** EAINT-7584 and EAINT-7585 (one shared workbook).
2. **Split between the two:** the production checklist lists "EAINT-7584 | 20250826 | Tomcat non-root | Part" and "EAINT-7585 | 20250826 | MySQL non-root | Part" (`knowledge/production-regression-scope.md` lines 1076-1077). In that file, "**Part** = existing data or part of the TS" (line 830).
3. **Portals:** **UCD** and **BackOffice (BO)**. The catalogue row says "UCD, BackOffice" (`cr-test-scenario-catalogue.md` line 341).
4. **Workbook:** "EAINT-7584 & EAINT-7585 - Update Database & Tomcat Security from rootuser to non-rootuser.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 11/08/2025, 12:12:16 pm.
5. **Sheets:** one sheet, "Sheet1".
6. **Columns (Sheet1 R1):** "TS No. | Module | Test Objective | Test Steps | Expected Result | QA | Test Result".
7. **Scenarios:** **47** in total.
   1. **32 E2E** (E2E_TS1–E2E_TS32), under the banner "E2E Test Scenarios" (R2).
   2. **15 existing-data checks** (EX_TS1–EX_TS15), under the banner "Existing Transactions" (R37).
8. **Results:** **47 of 47 PASS**. The sheet records no Fail.
   1. All 32 E2E rows say "PASS".
   2. EX_TS1–EX_TS8, EX_TS10, EX_TS11 and EX_TS13 say "Invoice - PASS ⏎ e-Invoice - PASS".
   3. EX_TS9, EX_TS12 and EX_TS15 say "PASS".
   4. EX_TS14 says "e-Invoice - PASS".
9. **Testers (QA column):** three QA engineers, with values "Nick", "Nabila" and "Charmain".
   1. **Nick:** 29 rows (19 E2E + 10 EX).
   2. **Nabila:** 12 rows (all E2E).
   3. **Charmain:** 6 rows (1 E2E + 5 EX).
10. **Dates:** the sheet holds no test dates. The workbook was last modified 11/08/2025. The production deployment date is 20250826 (production-regression-scope line 1076).
11. **Environment:** the sheet does not name one. The catalogue says "none named" (line 341).

## 2. What the ticket changed, as the TS shows it

1. **Infrastructure change, not a feature.** The title says the Database and Tomcat now run as a **non-root user** instead of "rootuser". The UI has no new screen or rule.
2. **What the TS treats as at risk:** file attachments and downloadables. Every row has the same expected-result opener: "Ensure all the File Attachments & downloadables below can be downloaded and viewed successfully with the correct sequence." (Sheet1 R3–R52).
3. **Inference** [unconfirmed]: the risk is that a non-root process loses read/write rights on stored documents (uploads, generated PDFs, CSV exports). That would explain why the TS is a regression sweep over every module's documents.
4. **Two kinds of check:**
   1. **New data:** each module is run end to end so new files get written under the non-root user (E2E_TS1–32).
   2. **Old data:** files created before the change must still open (EX_TS1–15). EX_TS14 says so plainly: "Note: Record created after e-Invoice Deployment, before this CR deploy." (R51).

## 3. Scenarios, grouped

### A. STMS (+ Transfer History, SSM) — E2E

1. **E2E_TS1** (R3): STMS Individual + TH, run to Approved. Expected: e-Invoice (TH, STMS), "Transfer History Receipt (ePayment JPJ for TH)", Slip Pengesahan (5 parts), BO "STMS Listing: Export CSV / File".
2. **E2E_TS2** (R4): STMS Company + TH + SSM with SSM Permission, ROC, 1 file. Expected: the E2E_TS1 set plus "SSM Document (dummy)", "SSM e-Invoice" and "BO Uploaded Document from Company Step 2"; the same on the SSM Transaction Details page.
3. **E2E_TS3** (R5): STMS Company **without** SSM Permission, ROB, 3 files, run to Approved. Expected: STMS e-Invoice, Slip Pengesahan, Step 2 uploaded document.
4. **E2E_TS4** (R6): STMS Company with SSM Permission → Save & Continue Later at Step 4 → revoke permission → resubmit. Expected: "Redirect to step 5, ensure Manual File Upload popup shown"; the Step 5 uploads "SSM Company Profile" and "Staff Employment Pass & MyKad" are listed.
5. **E2E_TS5** (R7): STMS Company + TH + SSM, ROB, fails at payment ("Transaction Status = Failed due to Payment"). Expected: TH e-Invoice, TH receipt, SSM docs and Step 2 upload are still downloadable.

### B. eSTM (+ eLKM, eVOC, SSM) — E2E

1. **E2E_TS6** (R8): eSTM Individual + eLKM + eVOC, run to Approved, then BO "Hak Milik" action. Expected: e-Invoice (eSTM, eLKM, eVOC), Slip Pengesahan (5 parts), "Butir-Butir Hak Milik".
2. **E2E_TS7** (R9): eSTM fails at "Final JPJ Submission Failed". Expected: "no downloadables available to download yet".
3. **E2E_TS8** (R10): eSTM Company with SSM Permission, ROB, 1 file, run to Approved. Expected: eSTM e-Invoice, Slip Pengesahan, SSM docs, Step 2 upload.
4. **E2E_TS9** (R11): eSTM Company with SSM Permission fails at "2nd JPJ Enq Failed". Expected: only the SSM docs and the Step 2 upload.
5. **E2E_TS10** (R12): eSTM Company, SSM permission revoked at Step 4 before the JPJ enquiry. Expected: "Proceed to next step, ensure Manual File Upload popup shown"; uploads "SSM Business Profile" and "Staff Employment Pass & MyKad" from "Company Step 4".

### C. UCD to UCD (Interstate) — E2E

1. **E2E_TS11** (R13): Bulk Interstate, run to Approved. Expected: "Download sample for bulk transaction template excel file" on Step 2, plus STMS e-Invoice and Slip Pengesahan.
2. **E2E_TS12** (R14): Single Interstate fails at Final JPJ Submission. Expected: "no downloadables available to download yet".

### D. APT — E2E

1. **E2E_TS13** (R15): STMS Approved → manual trigger of JPJ Notice 5.5 (APT "New") and 6.0 (APT "Pending") → payment → Approved. Expected: APT e-Invoice, "Slip Pengesahan for APT", "ePayment JPJ for APT".
2. **E2E_TS14** (R16): the same flow, failing at payment. Expected: "no downloadables available to download yet".

### E. eAuto Insurance (after eSTM) — E2E

1. **E2E_TS15** (R17): Bintang Prospek (Chubb / Takaful) after eSTM is Approved, to "Insurance Created". Expected: Insurance Invoice and Policy; the UCD eSTM details page also shows "Insurance Invoice" and "E-Certificate (Insurance Policy)".
2. **E2E_TS16** (R18): Pemaju Eksklusif (Lonpac / Tokio Marine) via the 69E error at eSTM Step 5 → insurance → back to eSTM payment. Expected: the same as E2E_TS15.
3. **E2E_TS17** (R19): Get a Free Quote → insurance "Failed due to Payment". Expected: "no downloadables available to download yet" on the insurance page; the eSTM docs are still downloadable.

### F. Dereg and eDereg Prechecking — E2E

1. **E2E_TS18** (R20): Dereg → Approved with COD = No → Upload COD → COD = Yes. Expected: Dereg e-Invoice, Uploaded Consent, "Perakuan" (Salinan Pemunya Berdaftar, Salinan AATF), COD, Uploaded Document.
2. **E2E_TS19** (R21): Dereg fails at "2nd JPJ Enq". Expected: only Uploaded Consent and Uploaded Document.
3. **E2E_TS20** (R22): eDereg Prechecking, vehicle exists and is Active. Expected: "Note: Able to proceed for eDereg"; "eDereg Prechecking does not have downloadables."
4. **E2E_TS21** (R23): the same, vehicle Not Active. Expected: "Note: Unable to proceed for eDereg".

### G. BMK and JomCheck — E2E

1. **E2E_TS22** (R24): BMK, run to Approved. Expected: "ePayment JPJ for BMK", "BMK e-Invoice", "Perakuan BMK - Pemilik Kenderaan", "Perakuan BMK - UCD Berdaftar".
2. **E2E_TS23** (R25): BMK fails at Final JPJ Submission. Expected: the same list **without** "BMK e-Invoice".
3. **E2E_TS24** (R26): JomCheck, run to Approved. Expected: "JomCheck e-Invoice", "JomCheck Report (dummy)".
4. **E2E_TS25** (R27): JomCheck "Failed due to Payment". Expected: "no downloadables available to download yet".

### H. Pre e-Invoice SSM — E2E

1. **E2E_TS26** (R28): new company (LLP / Trading License) profile setup. Expected: the LLP/TL doc, "MVD Agreement", "Print Confirmation of Registration (before & after setup)"; "LLP / TL Pre e-Invoice Setup record will NOT show in SSM Listing".
2. **E2E_TS27** (R29): new company (ROB / ROC) profile setup. Expected: SSM Document, SSM e-Invoice, MVD Agreement, Confirmation of Registration, BO "SSM Listing: Export File".
3. **E2E_TS28** (R30): ROB / ROC "Failed due to Payment". Expected: "no downloadables available to download yet" on the UCD and BO pages.

### I. Proforma Invoice — E2E

1. **E2E_TS29** (R31): Proforma for an existing UCD → Finance marks it paid → e-Invoice "OK". Expected: "Proforma Invoice", "Proforma e-Invoice".
2. **E2E_TS30** (R32): Proforma for "Others" → e-Invoice "Failed due to Blank / Invalid TIN". Expected: only "Proforma Invoice".

### J. Onboarding — E2E

1. **E2E_TS31** (R33): SSM Registered form with the max number of files → BO Approved. Expected: all 7 upload fields are downloadable, plus BO "Onboarding Listing: Export File".
2. **E2E_TS32** (R34): Non-SSM Registered form with some files → BO Rejected. Expected: the same 7-field list.

### K. Existing Transactions (data created before the deploy)

1. **EX_TS1** (R38): Approved STMS Individual with "TH JPJ = OK" and LHDN "N/A". Expected: "Invoice" (TH, STMS), TH receipt, Slip Pengesahan.
2. **EX_TS2** (R39): Approved STMS Company. Expected: as EX_TS1 plus "SSM Document (dummy) (Only BO if expired)" and "SSM Invoice".
3. **EX_TS3** (R40): Approved eSTM Individual with eLKM/eVOC JPJ = OK. Expected: Invoice (eSTM, eLKM, eVOC), Slip Pengesahan, "Butir-Butir Hak Milik".
4. **EX_TS4** (R41): Approved eSTM Company, "SSM Document = Yes". Expected: eSTM Invoice, Slip, "SSM Document (dummy) (BO only if expired)", SSM Invoice.
5. **EX_TS5** (R42): Approved UCD to UCD. Expected: STMS Invoice, Slip Pengesahan (3 parts).
6. **EX_TS6** (R43): Approved APT. Expected: APT Invoice, Slip Pengesahan for APT, ePayment JPJ for APT.
7. **EX_TS7** (R44): "Insurance Created" record, then the eSTM with the same vehicle no. Expected: Insurance Invoice and Policy, plus the eSTM documents.
8. **EX_TS8** (R45): Approved Dereg with COD = Yes. Expected: Dereg Invoice, Consent, Perakuan, COD, Uploaded Document.
9. **EX_TS9** (R46): Approved eDereg Prechecking. Expected: "eDereg Prechecking does not have downloadables."
10. **EX_TS10** (R47): Approved BMK. Expected: the BMK Invoice set.
11. **EX_TS11** (R48): Approved JomCheck. Expected: JomCheck Invoice, "JomCheck Report (dummy)".
12. **EX_TS12** (R49): existing LLP / TL company. Expected: as E2E_TS26, not in the SSM Listing.
13. **EX_TS13** (R50): Approved Pre e-Invoice SSM, "Type = Profile Update". Expected: SSM Document, SSM Invoice, MVD Agreement, Confirmation of Registration.
14. **EX_TS14** (R51): Proforma with "e-Invoice Status = OK", created before this CR. Expected: Proforma Invoice, Proforma e-Invoice.
15. **EX_TS15** (R52): Approved Onboarding Form, opened from BO "Edit" and from the UCD "Existing link found" link. Expected: all 7 upload fields.

## 4. Business rules and system behaviour the TS reveals

1. **Failed transactions have no documents.** "no downloadables available to download yet" — Sheet1 R9 (E2E_TS7), R14 (E2E_TS12), R16 (E2E_TS14), R19 (E2E_TS17), R27 (E2E_TS25), R30 (E2E_TS28).
2. **Documents bought earlier in a failed flow stay downloadable.** E2E_TS5 (R7) fails at STMS payment but still expects "TH e-Invoice", "Transfer History Receipt (ePayment JPJ for TH)", "SSM Document (dummy)" and "SSM e-Invoice".
3. **BMK failed at final JPJ submission still has the JPJ and Perakuan files, but no BMK e-Invoice.** R25 lists "ePayment JPJ for BMK", "Perakuan BMK - Pemilik Kenderaan" and "Perakuan BMK - UCD Berdaftar" only. Compare R24, which adds "BMK e-Invoice".
4. **Revoked SSM permission forces a manual upload.**
   1. STMS: "Redirect to step 5, ensure Manual File Upload popup shown" — Sheet1 R6, step 7. The files are "SSM Company Profile & Staff Employment Pass & MyKad" (step 8).
   2. eSTM: "Proceed to next step, ensure Manual File Upload popup shown" — Sheet1 R12, step 4. The files are "SSM Business Profile & Staff Employment Pass & MyKad" (step 5).
5. **Without SSM permission, no SSM is bought.** E2E_TS3 (R5) lists no SSM Document or SSM e-Invoice.
6. **The Butir-Butir Hak Milik link is driven by eSIM.** "In BO eSTM Transaction Listing, click "Hak Milik" Action (hit STMS Enquiry 4K)" — Sheet1 R8, step 4. This matches `knowledge/esim.md` line 590 ("STMS Enquiry response code `4K`").
7. **APT is created by JPJ notices.** "Manual trigger APT for JPJ Notice 5.5, APT Transaction is auto-created with Transaction Status = New" and "Manual trigger APT for JPJ Notice 6.0, APT Transaction is auto-created with Transaction Status = Pending" — Sheet1 R15, steps 2–3.
8. **Insurance documents show on the UCD eSTM page but not the BO eSTM page.** The UCD list includes "Insurance Invoice" and "E-Certificate (Insurance Policy)"; the BO list does not — Sheet1 R17, R18, R44.
9. **The 69E path returns to eSTM.** "Proceed until Step 5 & hit 69E error" → "Redirect to Insurance Step 1" → "Redirect back to eSTM Step 5" — Sheet1 R18, steps 2–5.
10. **Dereg COD comes after approval.** "Transaction Status = Approved, COD = No" then "click Upload COD" → "Transaction Status = Approved, COD = Yes" — Sheet1 R20, steps 3–6.
11. **eDereg Prechecking has no files.** "eDereg Prechecking does not have downloadables." — Sheet1 R22, R23, R46. Step 3 shows "Note: Able to proceed for eDereg" (R22) or "Note: Unable to proceed for eDereg" (R23).
12. **LLP / TL profile setup is not in the SSM Listing.** "LLP / TL Pre e-Invoice Setup record will NOT show in SSM Listing" — Sheet1 R28, R49.
13. **The Confirmation of Registration exists before and after setup.** "Print Confirmation of Registration (before & after setup)" — Sheet1 R28, R29.
14. **Proforma for "Others" with no TIN fails the e-Invoice only.** "e-Invoice Status = Failed due to Blank / Invalid TIN" — Sheet1 R32; only "Proforma Invoice" is downloadable.
15. **Proforma status chain.** "P.Invoice Status = OK" → "Payment Status = Paid" → "e-Invoice Status = OK" — Sheet1 R31.
16. **Onboarding status chain.** "Application Status = New" → "Pending" on UCD submit → "Approved" or "Rejected" by BO — Sheet1 R33, R34.
17. **Onboarding links are unique per company.** The system prompts "Existing link found. Link: {url}" — Sheet1 R52, UCD View step 2.
18. **The 7 onboarding upload fields** (R33): "SSM Company / Business Profile", "MyKad / Passport of Dicrector / Business Owner" (sheet spelling), "Showroom Picture & Video", "Business Card", "Deposit Receipt from Auction House", "MVA Membership Receipt", "Business Official Stamp".
19. **Expired SSM documents are BO-only.** "SSM Document (dummy) (Only BO if expired)" — Sheet1 R39; "(BO only if expired)" — R41.
20. **Older records say "Invoice", newer say "e-Invoice".** E2E rows list "e-Invoice". EX rows list "Invoice" / "SSM Invoice" and are marked "Invoice - PASS ⏎ e-Invoice - PASS". [unconfirmed] Pre-e-Invoice records keep a plain Invoice.
21. **Export type differs by listing.** Some say "Export CSV", others "Export File" or "Export CSV / File" (e.g. R3 STMS "Export CSV / File", R22 eDereg Prechecking "Export File", R31 Proforma "Export File").

## 5. Test data, environments, accounts, setup

1. **Environment:** none named in the sheet.
2. **Credentials:** none in the sheet.
3. **Business types used:**
   1. ROC = "Sdn Bhd or Bhd".
   2. ROB = "Sole Proprietorship or Partnership".
   3. Also LLP / Trading License (R4, R5, R28).
4. **Dummy documents:** "SSM Document (dummy)" and "JomCheck Report (dummy)". [unconfirmed] These come from eSIM, not live SSM or JomCheck.
5. **Failure steering:** "Failed due to Payment", "Final JPJ Submission Failed", "2nd JPJ Enq Failed", "69E error" and "STMS Enquiry 4K". [unconfirmed] These are set through eSIM; the sheet does not say how.
6. **APT setup:** a "Manual trigger" of JPJ Notice 5.5 and 6.0 (R15, R16). The sheet does not say where the trigger is.
7. **Insurance data:** a vehicle no. eligible for Chubb / Takaful (R17), Lonpac / Tokio Marine (R18), or any insurer (R19).
8. **New company:** created from "BO Manage Company", then log in as "Main UCD of the new company" (R28–R30).
9. **Existing-data filters:** each EX row gives search filters, e.g. "TH JPJ = OK", "LHDN Response Status = N/A", "COD = Yes", "Type = Profile Update", "e-Invoice Status = OK".

## 6. Gaps or risks a regression should still cover

1. **Write paths after a server restart.** The TS checks downloads once. It does not check uploads or new documents after a Tomcat or MySQL restart, which is when file ownership problems often appear [unconfirmed].
2. **Cron and background jobs.** No row covers cron output (e.g. the Hak Milik cronjob, e-Invoice resubmit cron, reminder emails) running under the non-root user. Only a manual "Hak Milik" action is used (R8).
3. **Emails with attachments.** No row checks emailed PDFs.
4. **Modules not in the sweep:** Service Hub, Shopping Cart, JPJ XML Log pages, Secarang and CIBO, plus the BO report pages beyond the listing exports.
5. **Database-side risks for EAINT-7585 (MySQL non-root).** The TS only checks through the UI. No row covers stored procedures, scheduled DB events, or bulk import (only the bulk template download, R13).
6. **Sheet slips to note when copying rows:**
   1. **E2E_TS4** title says "(ROC, upload 3 files)", but step 2 says "upload 1 file" (R6).
   2. **E2E_TS10** title says "(ROB, upload 3 files)", but step 2 says "upload 1 file" (R12).
   3. **E2E_TS8** expected list jumps from 2 to 4 (R10).
   4. **E2E_TS24** (JomCheck) says "BO - BMK Listing: Export CSV" (R26). It probably means the JomCheck Listing [unconfirmed].
   5. **E2E_TS4** and **E2E_TS10** list "Company Board Resolution" as the Step 2 upload. No other row names that document.
7. **No dates or evidence links** are in the sheet, so a re-check cannot tell when each row passed.

## 7. Context against existing knowledge

1. **`flow-ssm.md` line 149** already says: "Check permission revoked or granted while at Step 4, after a failed JPJ enquiry and resubmit." This TS adds the result: a **Manual File Upload popup** (R6, R12). There is no conflict.
2. **`flow-estm.md` lines 722–729** describe the Hak Milik cronjob (EAINT-8523). This TS (modified 11/08/2025) already uses a BO "Hak Milik" action (R8), while the EAINT-8523 workbook is dated 2025-10-17 (`cr-test-scenario-catalogue.md` line 165). [unconfirmed] The action existed before that cronjob CR.
3. **The catalogue row** (line 341) says "Sheet1:47 | 47", which matches the 47 scenarios counted here. Its "eSTM failed final submission: nothing downloadable yet (Sheet1!R9)" matches R9.
4. **No contradiction** was found with `knowledge/` flow files.

## Knowledge candidates

1. **Failed transactions show no downloadables**, but documents bought earlier in the same flow (TH, SSM) stay downloadable. Source: "no downloadables available to download yet" — Sheet1 R9, R14, R16, R19, R27, R30; E2E_TS5 expected list — Sheet1 R7. Target: `business-rules-from-test-scenarios.md`.
2. **SSM permission revoked mid-flow → "Manual File Upload popup"**: Step 5 for STMS ("SSM Company Profile & Staff Employment Pass & MyKad") and the next step after Step 4 for eSTM ("SSM Business Profile & Staff Employment Pass & MyKad"). Source: Sheet1 R6 steps 7–8, R12 steps 4–5. Target: `flow-ssm.md`, `flow-stms.md`.
3. **APT auto-creation by JPJ notice**: 5.5 → "New", 6.0 → "Pending". Source: Sheet1 R15 steps 2–3. Target: `flow-apt.md`.
4. **Insurance docs on the UCD eSTM details page only** ("Insurance Invoice", "E-Certificate (Insurance Policy)"), not on the BO eSTM page. Source: Sheet1 R17, R18, R44. Target: `flow-insurance-purchase.md`.
5. **LLP / TL Pre e-Invoice setup is not listed in the SSM Listing.** Source: "LLP / TL Pre e-Invoice Setup record will NOT show in SSM Listing" — Sheet1 R28, R49. Target: `flow-company-profile-einvoice.md`.
6. **Onboarding duplicate-link prompt**: "Existing link found. Link: {url}". Source: Sheet1 R52. Target: `flow-ucd-onboarding.md`.
7. **The 7 onboarding upload fields**, verbatim list. Source: Sheet1 R33. Target: `flow-ucd-onboarding.md`.
8. **Expired SSM document visible in BO only.** Source: "SSM Document (dummy) (Only BO if expired)" — Sheet1 R39; "(BO only if expired)" — R41. Target: `flow-ssm.md`.
9. **BMK failed at final JPJ submission has no BMK e-Invoice** but keeps the "ePayment JPJ for BMK" and both Perakuan files. Source: Sheet1 R25 vs R24. Target: `flow-bmk.md`.
10. **Proforma for "Others" with blank/invalid TIN** → "e-Invoice Status = Failed due to Blank / Invalid TIN"; only the Proforma Invoice is downloadable. Source: Sheet1 R32. Target: `flow-company-profile-einvoice.md` or `flow-payments-fees.md`.
11. **Infra CR pattern**: for a server/user-permission change, the team regression is "every module's downloadables + listing export", in two passes (new E2E data and pre-deploy existing data). Source: Sheet1 R2, R37 banners and the shared expected-result opener. Target: `production-regression-scope.md` (verification patterns by CR type).
