# EAINT-5972 — QA Team test script study (2026-10-27)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-5972, EAINT-10164 & EAINT-11763 - Pre-Application & Application Enhancements.md` (exported 27/10/2026, 8:34:36 pm). The text copy keeps cell text only. Formatting, colours and images are lost.
2. **Ticket folders:** `_reference/tickets/EAINT-5972/` and `_reference/tickets/Studying/EAINT-5972/` do not exist. No Jira dump or SRD for EAINT-5972 is in the repo. The SRD sections are known only from the TS banner rows (e.g. "2.2.1.1", "2.2.1.4").
3. **knowledge/:** `flow-ucd-onboarding.md` (§ Business rules from past CR test scripts, items 1-4; DOM handles; status fields), `business-rules-from-test-scenarios.md` (§12), `production-regression-scope.md` (item 12b, release table), `releases.md` (2026-07-08 row), `cr-test-scenario-catalogue.md` (#048).
4. **Other ticket files that cite this workbook:** `_reference/tickets/EAINT-12341/EAINT-12341-qa-team-ts-study.md`, `_reference/tickets/Studying/EAINT-11868/EAINT-11868-related-history.md`, `_reference/tickets/Studying/EAINT-11536/EAINT-11536-jira.md`.
5. **lib/ticketStudies.ts:** no entry for EAINT-5972, EAINT-10164 or EAINT-11763.

## 1. Header

1. **Ticket:** EAINT-5972. The workbook also covers **EAINT-10164** and **EAINT-11763**.
2. **Module / portal:** UCD onboarding. **Pre-Application form** (`/obs/preOnb/form`, potential UCD side), **BackOffice Pre-Application** and **UCD Application** pages (Assignee and Approver views), **BackOffice > Manage Company Account** (listing, Create New Company, Update Company), and the **Mailtrap** inbox.
3. **Workbook:** "EAINT-5972, EAINT-10164 & EAINT-11763 - Pre-Application & Application Enhancements.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 09/07/2026, 11:45:52 am. Catalogue number **#048** (`knowledge/cr-test-scenario-catalogue.md`).
4. **Sheets:** three, named **EAINT-5972**, **EAINT-10164** and **EAINT-11763**.
5. **Scenario count:** 164 result rows.
   1. **EAINT-5972:** 44 rows (STEP1 ×10, TINVAL ×10, CANCEL ×24).
   2. **EAINT-10164:** 32 rows under 23 ids. The E2E ids repeat across step rows (10164_E2E_TS1 has 6 rows, TS2 has 5, TS3 has 1).
   3. **EAINT-11763:** 88 rows (DIRECTOR ROC/ROB/LLP ×30, FS_UCD ×8, FS_BO ×8, REVERT ×10, HC_M1 ×12, HC_M2_SSM ×10, HC_M2_NONSSM ×10).
6. **Results:** **148 PASS**, **15 N/A**, **1 blank**, **0 FAIL**.
   1. **EAINT-5972:** 44/44 PASS.
   2. **EAINT-10164:** 31 PASS. 1 blank: 10164_E2E_TS1 step 7 (sheet EAINT-10164, R7) has no QA name and no result.
   3. **EAINT-11763:** 73 PASS, 15 N/A (all 10 LLP rows, plus the 5 "Existing" ROB rows).
7. **Testers (QA column):** "Teck Yung", "Aliah" / "aliah", "Faizuddin" / "Faiz". Faizuddin ran 10164_E2E_TS2 and TS3, and most of the 11763 hardcopy rows.
8. **Dates:** none written in the sheet. The release is 2026-07-08 night, S31.2-20260708 `[from knowledge/releases.md, 2026-07-08 row]`.

## 2. What the ticket changed, as the TS shows it

1. **EAINT-5972: Pre-Application Step 1.**
   1. **Type of Business** radio group added: SSM Registered vs Non-SSM Registered (SRD 2.2.1.1).
   2. **BRN fields** change by type (SRD 2.2.1.2). SSM types get Old BRN / New BRN. Non-SSM types get Business Trading License No plus a Trading License upload.
   3. **TIN validation** against the BRN or BTLN (SRD 2.2.1.3). A mismatch gives a warning only, never a block.
   4. **Cancelled status** for a Pre-Application (SRD 2.2.1.4). BO gets a "Cancel Pre-Application" button with reason checkboxes, plus a cancellation email and a banner on the UCD view.
2. **EAINT-10164: UCD Group.**
   1. **Assignee view:** a required dropdown, "UCD Group", on the Application.
   2. **Create New Company:** the dropdown is carried over and locked.
   3. **Company listing and CSV:** a new "UCD Group" column.
   4. **Existing UCDs:** patched with a group value.
3. **EAINT-11763: Application and Registration Documents.**
   1. **Director prefill** from SSM data.
   2. **Upload limits** raised: 5MB for documents, 20MB for the showroom video.
   3. **"Reverted Reason"** line shown after Revert to UCD.
   4. **Hardcopy document handling:** Method 1 (dropdown + remarks) and Method 2 (resubmission popup + email).

## 3. Scenarios

### 3a. Sheet EAINT-5972 — Step 1 Type of Business / BRN (R3-R12)

Ids are written **"5962_STEP1_…"** in the sheet, not 5972. This is a typo in the source [unconfirmed].

1. **5962_STEP1_TS1** (R3): "Type of Business" field is shown under "Business Registered Name", with radios for SSM (Sdn Bhd / Bhd, Sole Proprietorship / Partnership, LLP) and Non-SSM (Business Trading (Sabah), Business Trading (Sarawak)). PASS.
2. **5962_STEP1_TS2** (R4): picking an SSM option shows "Business Registration No (BRN)" with "Old BRN" and "New BRN" fields. PASS.
3. **5962_STEP1_TS3** (R5): picking a Non-SSM option shows "Business Trading License No" and a "Trading License" upload. PASS. Remark: "To regress "Trading License" field".
4. **5962_STEP1_TS4** (R6): switching back and forth → "Ensure behavior displays accordingly as 5962_STEP1_TS2 / 5962_STEP1_TS3". PASS.
5. **5962_STEP1_TS5 to TS7** (R7-R9): Old BRN only, New BRN only, or both → "Should be able to proceed to Step 2". PASS.
6. **5962_STEP1_TS8** (R10): no type chosen → "This field is required" under "Non-SSM Registered". PASS.
7. **5962_STEP1_TS9** (R11): both BRN fields empty → "This field is required" under "New BRN". PASS.
8. **5962_STEP1_TS10** (R12): BTLN empty → "This field is required" under "Business Trading License No". PASS.

### 3b. Sheet EAINT-5972 — TIN validation (R18-R27, tester Aliah)

1. **5972_TINVAL_TS1 to TS3** (R18-R20): SSM types with a TIN that matches the BRN → proceed to Step 2. BO View shows "[e-Invoice] button should be available when LHDN Response Status = OK". PASS.
2. **5972_TINVAL_TS4, TS5** (R21-R22): Non-SSM types with a TIN that matches the BTLN → same as above. PASS.
3. **5972_TINVAL_TS6 to TS8** (R23-R25): SSM types with a TIN that does not match → warning text shown, second Next proceeds. BO shows "LHDN Response Status should display as Failed and no [e-Invoice] button will be displayed". PASS.
4. **5972_TINVAL_TS9, TS10** (R26-R27): Non-SSM types with a TIN that does not match → same as above. PASS.

### 3c. Sheet EAINT-5972 — Cancelled status (R33-R56, tester Teck Yung)

Each step is run twice, once with Transaction Type "Existing" and once with "New".

1. **CANCEL_TS1, TS2** (R33-R34): Status = New → "Cancel Pre-Application" is shown under "Approve" & "Reject". PASS.
2. **CANCEL_TS3 to TS6** (R35-R38): Status = Approved or Rejected → button "should not be displayed". PASS.
3. **CANCEL_TS7, TS8** (R39-R40): click the button → confirm popup with 10 reason checkboxes and [No] [Yes]. PASS.
4. **CANCEL_TS9, TS10** (R41-R42): Yes with no reason → "Select the reason by ticking the checkbox(s)." PASS.
5. **CANCEL_TS11 to TS14** (R43-R46): one reason, or all reasons → Status "Cancelled". A "Cancellation Reason" field shows the reason(s), as a list when there are several. PASS.
6. **CANCEL_TS15 to TS18** (R47-R50): "Others, please specify" shows a "Remarks" textbox. An empty textbox → "This field in required" (sic) and the box turns red. PASS.
7. **CANCEL_TS19, TS20** (R51-R52): listing shows "Cancelled". The Remarks column shows "CANCELLED BY [username] on DD MMM YYYY HH:MM AM/PM" followed by the reason(s). PASS.
8. **CANCEL_TS21, TS22** (R53-R54): UCD view shows a "Pre-Application Cancelled" banner. PASS.
9. **CANCEL_TS23, TS24** (R55-R56): cancellation email arrives in Mailtrap. PASS.

### 3d. Sheet EAINT-10164 — UCD Group

1. **10164_E2E_TS1** (R3-R8, Teck Yung):
   1. The dropdown shows "under "Application Submission Date" field with placeholder text "Select UCD Group"".
   2. Submitting with no value → "This field is required".
   3. Six values are offered, single select.
   4. After Submit for Approval the dropdown is hidden.
   5. After approval it is still hidden (R7 has no result).
   6. On Create New Company the value is "pre-populated … and dropdown should be non-editable".
   7. PASS, except R7, which is blank.
2. **10164_E2E_TS2** (R9-R13, Faizuddin):
   1. Pick a value, then Revert to UCD → "UCD Group" dropdown should be disabled and not editable".
   2. After the UCD resubmits → "displayed with default placeholder text and editable".
   3. Pick a different value → Create New Company shows the latest value, locked.
   4. PASS.
3. **10164_E2E_TS3** (R14, Faizuddin): Approver rejects instead → label and dropdown hidden. PASS.
4. **10164_CA_LISTING_TS1, TS2** (R20-R21): new column on the listing and on the CSV export, "between "Company Type" and "Block STMS Transaction"". PASS.
5. **10164_CA_LISTING_TS3 to TS9** (R22-R28): each of the six values shows in the column. No group shows "-". PASS.
6. **10164_CREATENEW_TS1 to TS3** (R34-R36): the dropdown sits "between "New Company Reg. No." and "Association" field". With a value or without one, the company is created and the dropdown is then disabled. PASS.
7. **10164_UPDATECOMP_TS1, TS2** (R42-R43): Update Company shows the same position, and the dropdown "Should not allow to be edited and remain disabled". PASS.
8. **10164_EXS_TS1 to TS6** (R49-R54): an existing UCD is patched to each value. Checked on the listing, the CSV and the Update page. PASS.

### 3e. Sheet EAINT-11763 — Director prefill (R3-R36)

1. **11763_DIRECTOR_ROC_TS1 to TS10** (R3-R12): Step 2 "MyKad / MyPR / Passport Copies of All Directors / Business Owner(s)" fills the count and names "based on director(s) data from SSM Document". The values carry to BO Application view, Create New Company "List of Director" and Update Company. New and Existing: all PASS.
2. **11763_DIRECTOR_ROB_TS1 to TS10** (R15-R24): same checks for Sole Proprietorship. **New = PASS, Existing = N/A.**
3. **11763_DIRECTOR_LLP_TS1 to TS10** (R27-R36): same checks for LLP. **All N/A.** Remark: "Based on Dev, these can be scoped down."

### 3f. Sheet EAINT-11763 — File size limits (R42-R59)

1. **11763_FS_UCD_TS1 to TS4** (R42-R45), potential UCD side: six document types. Up to 5MB → "Should upload successfully". Above 5MB → "Should not be able to upload and will display "File size exceeded"". PASS.
2. **11763_FS_UCD_TS5 to TS8** (R46-R49): "20 Seconds Showroom Video" has a 20MB limit, with the same messages. PASS.
3. **11763_FS_BO_TS1 to TS8** (R52-R59): the same limits on the BackOffice side, after the UCD's Step 3 submission. PASS.

### 3g. Sheet EAINT-11763 — Reverted Reason (R65-R74)

1. **11763_REVERT_TS1, TS2** (R65-R66): after Revert to UCD with remarks, the page shows "Reverted Reason: YYYY-MM-DD HH:MMPM [Remarks …]" above "Application Submission Date". PASS.
2. **11763_REVERT_TS3, TS4** (R67-R68): after the UCD resubmits, the result differs by type. **New:** "should be hidden". **Existing:** "will be displayed". PASS.
3. **11763_REVERT_TS5 to TS8** (R69-R72): a second revert shows the new remark. The resubmit result splits New vs Existing in the same way. PASS.
4. **11763_REVERT_TS9, TS10** (R73-R74): after Submit for Approval → "Reverted Reason" field should should be hidden" (sic). PASS.

### 3h. Sheet EAINT-11763 — Hardcopy handling (R80-R115)

1. **11763_HC_M1_TS1 to TS12** (R80-R91): the Hardcopy Doc option "Pending UCD - Incomplete Docs" shows a "Remarks (Optional)" textbox. "Pending UCD" and "Pending Assignee" do not show it. Remarks are saved on Update. PASS.
2. **11763_HC_M2_SSM_TS1 to TS10** (R94-R103):
   1. "Request Hardcopy Resubmission" opens a popup with 6 document checkboxes.
   2. Cancel → no action.
   3. Confirm with nothing ticked → "This field is required", no email sent.
   4. Confirm with a document ticked → email sent, and its template is checked.
   5. PASS.
3. **11763_HC_M2_NONSSM_TS1 to TS10** (R106-R115): the same flow for Non-SSM. The document list says "LoA" where SSM says "BoD Reso". PASS.

## 4. Business rules and system behaviour

1. **TIN mismatch never blocks.** "Should display "The TIN is invalid. This may affect e-Invoice submission. Click "Next" to proceed." under "Tax Identification No (TIN)" field" and "Should allow to proceed to Step 2 on second "Next" click". Source: sheet EAINT-5972, R23.
2. **The TIN result drives e-Invoice in BO.** Match: "[e-Invoice] button should be available when LHDN Response Status = OK" (R18). Mismatch: "LHDN Response Status should display as Failed and no [e-Invoice] button will be displayed" (R23). Both on sheet EAINT-5972.
3. **Non-SSM TIN is checked against the BTLN.** "Enter a valid TIN in "Tax Identification No (TIN)" field which matches the BTLN". Source: sheet EAINT-5972, R21.
4. **Error placement.**
   1. No business type chosen: the error sits "under "Non-SSM Registered" field" (R10).
   2. Both BRN fields empty: the error sits "under "New BRN" field" (R11).
   3. Both on sheet EAINT-5972.
5. **Cancel is only possible while Status = New.** "Cancel Pre-Application" should be displayed under "Approve" & "Reject" buttons" when New (R33). It "should not be displayed" when Approved (R35) or Rejected (R37). All on sheet EAINT-5972.
6. **Cancel reasons (10)**, from sheet EAINT-5972, R39: "Incomplete Documentation", "Invalid or Expired Registration", "Data Mismatch", "Not Eligible for eAuto", "Unsupported Vehicle Category", "Duplicate Application", "Inactive or Dormant Company", "Wrong Category Submission", "Compliance Review Unsuccessful", "Others, please specify :".
7. **Cancel popup text.** "Are you sure to cancel the Pre-Application? Please select the reason and system will send an update to the applicant through email." Source: sheet EAINT-5972, R39.
8. **Listing Remarks format.** "CANCELLED BY [username] on DD MMM YYYY HH:MM AM/PM". Source: sheet EAINT-5972, R51.
9. **UCD-side banner.** "Pre-Application Cancelled … We regret to inform you that your Pre-Application Form has been cancelled. Please refer to the rejection email sent to [Admin’s Email] for the cancellation reason and further instructions." The banner says "rejection email" for a cancellation. Source: sheet EAINT-5972, R53.
10. **Cancellation email**, from sheet EAINT-5972, R55:
    1. **Sender and recipients:** "Sender: imonitor@eauto.my", "Recipient – To: [Admin's Email]", "Recipient – CC: apply@eauto.my".
    2. **Subject:** "Pre-Application Cancelled: [Pre-Onboarding No] - [Company Name]".
    3. **Fee line:** "Please note that the Pre-Application fee is non-refundable".
    4. **Reason list:** "The list of reasons displayed in the email is based on the options selected by the Assignee during the cancellation process."
11. **UCD Group values.** "1. Corporate 2. Association 3. Authorised Dealer 4. UCD 5. Motor 6. Recon". Source: sheet EAINT-10164, R5.
12. **UCD Group lifecycle**, all on sheet EAINT-10164:
    1. Required before Submit for Approval (R4).
    2. Hidden after submit (R6).
    3. Disabled during Revert (R9), then editable again after the UCD resubmits (R10).
    4. Hidden after approve or reject (R12, R14).
    5. "pre-populated with the latest selected value … and dropdown should be non-editable" on Create New Company (R8).
13. **UCD Group cannot be changed after the company is created.** "Should not allow to be edited and remain disabled". Source: sheet EAINT-10164, R43.
14. **Creating a company with no UCD Group is allowed.** "Company should be created successfully". Source: sheet EAINT-10164, R36.
15. **Listing column.** "Should display new column between "Company Type" and "Block STMS Transaction"" (R20). It also appears on the CSV export (R21). An empty group shows "-" (R28). All on sheet EAINT-10164.
16. **Upload limits.** 5MB for the six document types and 20MB for the "20 Seconds Showroom Video". Error text: "File size exceeded". Source: sheet EAINT-11763, R42-R49 and R52-R59.
17. **Six document types under the 5MB limit**, from sheet EAINT-11763, R42: "MyKad / MyPR / Passport Copies of All Directors / Business Owner(s)", "Four (4) Showroom Pictures", "Business Card", "Dealer Security Deposit Receipt from the Auction House", "Current Motor Vehicle Association Membership Receipt", "Company / Business Official Stamp".
18. **Reverted Reason format.** "Reverted Reason: YYYY-MM-DD HH:MMPM [Remarks entered by Assignee in popup of “Revert to UCD”]", shown above "Application Submission Date". Source: sheet EAINT-11763, R65.
19. **Reverted Reason after resubmit differs by transaction type.** New: ""Reverted Reason" field and value should be hidden" (R67). Existing: ""Reverted Reason" field and value will be displayed" (R68). Both on sheet EAINT-11763. Whether this is a real rule or a sheet slip is [unconfirmed].
20. **Hardcopy Method 1.** "Pending UCD - Incomplete Docs" shows "Remarks (Optional)". "Pending UCD" and "Pending Assignee" do not. Source: sheet EAINT-11763, R80-R85.
21. **Hardcopy Method 2 popup text.** "Please select the document(s) that require hardcopy resubmission. Once selected, click the "Confirm" button to notify the UCD via email for resubmission." Source: sheet EAINT-11763, R94.
22. **Method 2 documents differ by business type.**
    1. **SSM** has "RHB BoD Reso e-TukarMilik" and "eAuto BoD Reso e-TukarMilik" (R94).
    2. **Non-SSM** has "RHB LoA e-TukarMilik" and "eAuto LoA e-TukarMilik" (R106).
    3. **Both** have "RHB Offer Letter", "RHB Direct Debit Application Form", "eRHB Bank Statement Cover / RHB Welcome Letter" and "LHDN Company Tax Compliance Certificate".
    4. All on sheet EAINT-11763.
23. **Incomplete-hardcopy email**, from sheet EAINT-11763, R102:
    1. **Recipients:** "‘To’: [Admin's email]", "‘CC’: apply@eauto.my", "BCC: [Assignee's email]".
    2. **Subject:** "[Application No] - [Company Name]: Incomplete Hardcopy Documents Received".
    3. **Address line:** the documents go to "Level 15 Sunway Tower, Jalan Ampang, 50450 Kuala Lumpur".
24. **The SSM Document drives the director prefill.** "Number of Directors / Business Owner(s) dropdown and Name field(s) should be auto selected & auto populated respectively based on director(s) data from SSM Document". Source: sheet EAINT-11763, R3.

## 5. Test data, environments, accounts, setup

1. **Environment:** not written in the sheet. The cancellation and hardcopy emails were checked in **Mailtrap** (sheet EAINT-5972, R55), so this was a non-production environment [unconfirmed which one].
2. **Approver accounts:** "Approver users: kmcheah, jasons, eautonurul". Source: sheet EAINT-10164, R3-R6 Remarks. Usernames only, no passwords in the sheet.
3. **Record used:** "Use 'P260702/00673 / NA67001073 - TYTEST UCD GROUP 005". Source: sheet EAINT-10164, R8 Remarks.
4. **Existing UCDs used:** NA64001042 (sheet EAINT-11763, R4), NA64001035 (R53, R66) and NA64001036 (R55, R57, R59).
5. **ID table:** sheet EAINT-11763, R123-R132 lists 10 NA numbers, each paired with a UUID (e.g. "NA64001035 | ec9c3579-fdc4-4de8-9afd-62f976f0ff52"). The UUIDs are likely the Pre-Application or Application form ids used in `/obs/...` links [unconfirmed].
6. **SSM data setup:** "SSM Document Director(s) data can be configured in eSIM SSM Submission". Source: sheet EAINT-11763, R3 Remarks.
7. **Combined E2E:** UCD Group was "Tested together with E2E flow in EAINT-11763" (sheet EAINT-10164, R3). The listing checks were "Tested together with 10164_EXS_TS1 - 10164_EXS_TS6" (R20).
8. **"Transaction Type" New / Existing:** most likely means a brand-new applicant vs an existing UCD (NA number) re-applying [unconfirmed].
9. **Credentials:** none present in the sheet.

## 6. Gaps and risks for regression

1. **LLP director prefill was never tested.** All 10 rows are N/A: "Based on Dev, these can be scoped down." (sheet EAINT-11763, R28). ROB "Existing" is also N/A (R16-R24).
2. **The Trading License upload is still open.** Remark "To regress "Trading License" field" (sheet EAINT-5972, R5).
3. **10164_E2E_TS1 step 7 has no result** (sheet EAINT-10164, R7). Nobody recorded that the dropdown stays hidden after approval on that run.
4. **Reverted Reason New vs Existing conflict** (sheet EAINT-11763, R67 vs R68). A regression should confirm which behaviour is correct.
5. **Cancel only checked for New, Approved and Rejected.** Other statuses (e.g. Pending, Expired) are not covered [unconfirmed which statuses exist on Pre-Application].
6. **The UCD banner says "rejection email" for a cancellation** (R53). This may be a copy bug that was passed.
7. **No exact-boundary uploads.** Nothing tests a file of exactly 5MB or 20MB, or file-type rules.
8. **Only "valid but mismatched" TINs tested.** No row covers a badly formatted TIN or an empty TIN.
9. **"Others" text in the email not checked.** No row confirms that the remark typed under "Others, please specify" appears in the cancellation email.
10. **Non-SSM director prefill not covered.** Business Trading has no SSM purchase (see `EAINT-12341-qa-team-ts-study.md`, R28).
11. **Changing a UCD Group after creation** is possible only by patching (10164_EXS). There is no UI path, so any later correction needs dev.
12. **Production:** only "Cancel Pre-Application button can be seen when Pre-Application Status = New" is in the deployment checklist `[from knowledge/production-regression-scope.md, item 12b]`.

## Contradictions and changes against knowledge/

1. **Hardcopy option label.** `flow-ucd-onboarding.md` item 3 lists the Hardcopy & Acc Created values as "Pending UCD / Incomplete Docs / Pending Assignee". The TS shows one option named "Pending UCD - Incomplete Docs" next to separate "Pending UCD" and "Pending Assignee" options (sheet EAINT-11763, R80-R84). Knowledge may be merging two labels.
2. **Pre-Application Cancelled is not in the flow file.** `flow-ucd-onboarding.md` has no "Cancelled" Pre-Application status, Cancel button, reasons list or cancellation email.
3. **Reverted Reason and Method 2 resubmission are not in knowledge/.**
4. **Consistent with knowledge:** `flow-ucd-onboarding.md` says a freshly submitted application renders "only UCD Group + Application Status", which matches the 10164 Assignee view. Items 1-4 of § Business rules from past CR test scripts also match this TS.

## Knowledge candidates

1. **Pre-Application Cancel (EAINT-5972)** for `flow-ucd-onboarding.md`. Button only when Status = New, 10 reasons, Remarks required for "Others", listing Remarks "CANCELLED BY [username] on DD MMM YYYY HH:MM AM/PM", UCD banner "Pre-Application Cancelled". Email from imonitor@eauto.my, CC apply@eauto.my, subject "Pre-Application Cancelled: [Pre-Onboarding No] - [Company Name]". Source: `[from SharePoint TS #048 EAINT-5972, 10164 & 11763, sheet EAINT-5972, rows 33-56]`.
2. **TIN result → BO e-Invoice button.** LHDN Response Status OK shows [e-Invoice]. Failed hides it. Source: `[from SharePoint TS #048, sheet EAINT-5972, rows 18, 23]`.
3. **UCD Group is locked after creation and changed only by patching.** Company creation with no group is allowed. Source: `[from SharePoint TS #048, sheet EAINT-10164, rows 36, 43, 49-54]`.
4. **Upload limits.** 5MB per document (six named types), 20MB for the showroom video, error "File size exceeded", on both the UCD and BO sides. Source: `[from SharePoint TS #048, sheet EAINT-11763, rows 42-59]`.
5. **Reverted Reason line.** Format "Reverted Reason: YYYY-MM-DD HH:MMPM [Remarks …]" above "Application Submission Date". Hidden after Submit for Approval. After resubmit, New hides it and Existing shows it [unconfirmed, possible sheet slip]. Source: `[from SharePoint TS #048, sheet EAINT-11763, rows 65-74]`.
6. **Hardcopy Method 1 / Method 2.** "Pending UCD - Incomplete Docs" opens "Remarks (Optional)". "Request Hardcopy Resubmission" has 6 documents (BoD Reso for SSM, LoA for Non-SSM), requires at least one, and sends an email with subject "[Application No] - [Company Name]: Incomplete Hardcopy Documents Received", BCC the Assignee. Source: `[from SharePoint TS #048, sheet EAINT-11763, rows 80-115]`. This may correct the "Pending UCD / Incomplete Docs" wording in `flow-ucd-onboarding.md` item 3.
7. **Director prefill test data** is set in eSIM SSM Submission. LLP prefill was never QA-tested ("Based on Dev, these can be scoped down."). Source: `[from SharePoint TS #048, sheet EAINT-11763, rows 3, 28]`.
8. **Approver accounts used for onboarding approval:** kmcheah, jasons, eautonurul. Source: `[from SharePoint TS #048, sheet EAINT-10164, row 3 Remarks]`.
9. **lib/ticketStudies.ts:** no entry exists for EAINT-5972, 10164 or 11763. An entry could point to this study.
