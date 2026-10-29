# EAINT-8550 — QA Team test script study (2026-10-28)

## Sources read

1. **Text copy** of the workbook: `_reference/sharepoint/qa-team-ts/EAINT-8550 - [eAuto][UCD & BackOffice][Invoice] Issuance of New Invoice Template for Users Without Valid TIN.md` (exported 28/10/2026, 1:18:48 am). Cell text only — **formatting, colours and images not available**. Formula cells (Failed / In Progress counts) show the formula, not the value.
2. **Not available:** `_reference/tickets/EAINT-8550/` (did not exist before this file), `_reference/tickets/Studying/EAINT-8550/` (does not exist). `lib/ticketStudies.ts` has **no entry** for EAINT-8550.
3. **SRD not read.** The sheet cites "latest SRD v1.2" (sheet Invalid or Blank TIN, R3 Remarks); no copy found in the repo.
4. **Knowledge checked:** `knowledge/business-rules-from-test-scenarios.md` §8, `knowledge/flow-company-profile-einvoice.md` (Invoice and e-Invoice flow), `knowledge/production-regression-scope.md`, `knowledge/cr-test-scenario-catalogue.md` (#067, #090), `knowledge/flow-stms.md`, `knowledge/flow-bmk.md`, `knowledge/flow-jomcheck.md`.

## 1. Header

1. **Ticket:** EAINT-8550 — "[eAuto][UCD & BackOffice][Invoice] Issuance of New Invoice Template for Users Without Valid TIN".
2. **Portals:** UCD (web; mobile columns present but not run) and BackOffice.
3. **Workbook:** "EAINT-8550 - [eAuto][UCD & BackOffice][Invoice] Issuance of New Invoice Template for Users Without Valid TIN.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 06/03/2026, 12:54:15 pm.
4. **Sheets (6):** Overall Testing Progress; Invalid or Blank TIN; New Transactions (e-Invoice); Existing (e-Invoice & Invoice); Func. TS - Buyer; Func. TS - Supplier & Amount.
5. **Scenarios:**
   1. Invalid or Blank TIN: **24 TS** (8550_INV/MIS_TS1–TS24) over 47 step rows.
   2. New Transactions (e-Invoice): **12 happy** (8550_NEW_EI_TS1–12) + **10 negative** (8550_NEG_EI_TS1–10).
   3. Existing (e-Invoice & Invoice): **22 TS** (8550_EX_TS1–22).
   4. Func. TS - Buyer: **13 field TS** (8550_FT_BUY_TS1–13) × up to 21 module columns.
   5. Func. TS - Supplier & Amount: **24 field TS** (8550_FT_SA_TS1–24) × 19 module columns.
   6. **Total: 105 TS ids.**
6. **Result counts** — "Overall Testing Progress", R8 "Total Count per Status": Not Started **148**, Pass **277**, N/A **6**, Count **431**, Total Completion **0.6566**. Failed and In Progress are formulas; values not in the text copy.
   1. Every web/desktop "Test Result" cell read is **Pass** or **N/A**. All **Not Started** cells are the **Mobile** columns.
   2. N/A cells: INV/MIS_TS10 R31; FT_BUY_TS6 and TS8 (JomCheck column); FT_BUY_TS9–11 (SSM Pre e-Invoice column).
7. **Testers:** six QA engineers named in the QA columns. **Dates written in sheet:** 02/10/2025 to 14/10/2025 (e.g. "Retested (02/10/2025): PASS", Invalid or Blank TIN R28; "QA (14/10/25)" column header, Existing sheet R1).
8. **Deployment:** production 20251013 [from `knowledge/production-regression-scope.md`, table row "EAINT-8550 | 20251013 | Invoice template, no TIN | Yes"].

## 2. What the ticket changed, as the TS shows it

1. **New Invoice PDF for users without a valid TIN.** Before, a failed LHDN submission gave no document [unconfirmed — inferred from the ticket title]. Now the details page shows **[Invoice]** only, plus a notation, when LHDN Response = Failed.
2. **Notation text** (sheet Invalid or Blank TIN, R3, Expected Result): "e-Invoices are only available for customers with a valid TIN. ⏎ e-Invoices can only be issued for transactions within the current calendar month."
3. **After TIN is fixed** and the cronjob resubmits, **[e-Invoice]** appears next to [Invoice] and the notation is hidden (R4: "Ensure following notation hidden").
4. **Button names per module:** [Invoice] / [e-Invoice]; SSM uses "[SSM Invoice]" / "[SSM e-Invoice]" (R7–R8); Proforma uses "[Proforma Invoice]" / "[e-Invoice]" (R28–R29).
5. **Modules covered:** STMS, TH, STMS company + SSM, eSTM + eLKM + eVOC, eSTM + eVOC + SSM, UCD to UCD Interstate, APT, JomCheck, Pre e-Invoice SSM (ROB/ROC), Proforma Invoice (Existing eAuto UCD and Others), Dereg, BMK.
6. **Three date bands for existing data** (sheet Existing): "Existing (old Invoice - before 1st July 2025)" (R2) and "Existing (new Invoice + e-Invoice - on/after 1st July 2025)" (R14); plus "Existing Transactions (new Invoice - on or after 1st July)" with LHDN Failed (Invalid or Blank TIN, R36).
7. **Fixed PDF layout** checked field by field: Buyer block (Func. TS - Buyer) and Supplier, header and Amount block (Func. TS - Supplier & Amount).

## 3. Scenarios

### 3a. Invalid or Blank TIN — new transactions (each: fail with bad TIN → fix TIN → cronjob → re-check)

1. **INV/MIS_TS1** — STMS + TH Individual, Invalid TIN. TH failed → "[Invoice] button displayed" + notation; TIN fixed → "[Invoice] & [e-Invoice] buttons displayed" + notation hidden; repeated for STMS (R3–R6).
2. **INV/MIS_TS2** — STMS + TH + SSM Company, Blank TIN. Same cycle for SSM, then TH, then STMS (R7–R12). Defect EAINT-8951.
3. **INV/MIS_TS3** — eSTM + eLKM + eVOC Individual, Invalid TIN (R13–R14).
4. **INV/MIS_TS4** — eSTM + eVOC + SSM Company, Blank TIN; SSM first, then eSTM (R15–R18).
5. **INV/MIS_TS5** — UCD to UCD Interstate (Bulk), Invalid TIN (R19–R20). Defect EAINT-8926.
6. **INV/MIS_TS6** — APT, Blank TIN; APT created by manual trigger of JPJ Notice 5.5 then 6.0 (R21–R22). Defect EAINT-8929.
7. **INV/MIS_TS7** — JomCheck, Invalid TIN (R23–R24). Defect EAINT-8931.
8. **INV/MIS_TS8** — Pre e-Invoice SSM (ROB/ROC), Blank TIN; check on SSM details and "Company/Business Profile Update page" (R25–R27). Defects EAINT-8932, 8937, 8938, 8939, 8941.
9. **INV/MIS_TS9** — Proforma Invoice, Existing eAuto UCD, Blank TIN (dev patch). "Ensure [Proforma Invoice] button displayed" (R28–R29). Marked "Regression".
10. **INV/MIS_TS10** — Proforma Invoice, Others, Invalid TIN. Step 1 Pass; step 2 **N/A** (R30–R31).
11. **INV/MIS_TS11** — Dereg, Invalid TIN (dev patch); includes Upload COD (R32–R33).
12. **INV/MIS_TS12** — BMK, Blank TIN (R34–R35).

### 3b. Invalid or Blank TIN — existing transactions on/after 1 July with LHDN Failed

1. **INV/MIS_TS13–TS22** — STMS + TH, STMS + TH + SSM, eSTM + eLKM + eVOC, eSTM + eVOC + SSM, UCD to UCD, APT, JomCheck, Pre e-Invoice SSM, Dereg, BMK. Expected: "[Invoice] button displayed" (SSM: "[SSM Invoice]") + notation displayed (R37–R47). TS14 and TS16 first "FAILED" on 08/10/2025, defect EAINT-8996, then Pass. TS20 defect EAINT-8978. TS22 defect EAINT-8958.
2. **INV/MIS_TS23–TS24** — Paid Proforma (Existing eAuto UCD / Others) with LHDN Failed: "Ensure [Proforma Invoice] button displayed" (R48–R49). "Regression".

### 3c. New Transactions (e-Invoice) — happy flow, valid TIN

1. **NEW_EI_TS1–TS12** — STMS + TH, STMS + TH + SSM, eSTM + eLKM + eVOC, eSTM + eVOC + SSM, UCD to UCD (Standard), APT, Dereg, BMK, JomCheck, Pre e-Invoice SSM, Proforma (Existing UCD), Proforma (Others). Expected: "[Invoice] & [e-Invoice] buttons are visible on details page", PDFs open, "Valid TIN is displayed correctly in Buyer details section" (R3–R14). Defects EAINT-8982, 8943, 8957, 8954.

### 3d. New Transactions (e-Invoice) — negative: Final Submission Failed, Payment OK, valid TIN

1. **NEG_EI_TS1** — STMS + TH. TH failed → "[Invoice] button visible", "Invoice PDF contains only TH details", notation displayed; BO resubmit TH → e-Invoice appears; STMS failed then resubmitted → PDF "contains both STMS & TH details" (R16–R18).
2. **NEG_EI_TS2** — STMS + SSM. SSM failed → "[SSM Invoice]" only; cronjob resubmits SSM; STMS resubmitted in BO (R19–R21). Defect EAINT-8943.
3. **NEG_EI_TS3** — eSTM + eVOC + eLKM. All three JPJ Failed → "Invoice PDF contains only eSTM details"; BO resubmit with eVOC & eLKM ticked → all LHDN OK (R22–R23).
4. **NEG_EI_TS4** — eSTM + SSM, same pattern as TS2 (R24–R26). Defect EAINT-8943.
5. **NEG_EI_TS5** — UCD to UCD, accepting UCD final submission failed; BO resubmit (STMS) (R27–R28).
6. **NEG_EI_TS6** — APT, "Final Submission = Failed (due to 3B)"; dev patches status to Pending, cronjob resubmits (R29–R30).
7. **NEG_EI_TS7** — Dereg final submission failed: "[Invoice] button visible", notation displayed. No resubmit step (R31).
8. **NEG_EI_TS8** — BMK; resubmit via "BO > Resubmit JPJ Final Submission (eAuto Plus)" (R32–R33).
9. **NEG_EI_TS9** — JomCheck "Failed to retrieve report", Payment OK; [RESUBMIT] on Get JomCheck Reports → "Tx Status = OK", e-Invoice appears (R34–R35). Defect EAINT-8962.
10. **NEG_EI_TS10** — Pre e-Invoice SSM final submission failed; cronjob resubmits; "Save & Continue Later" redirects to Company/Business Profile Update page with both SSM buttons (R36–R37).

### 3e. Existing (e-Invoice & Invoice)

1. **EX_TS1–TS10** — transactions approved **before** e-Invoice deployment, per module. Expected: "[Invoice] button displayed" only (SSM: "[SSM Invoice]") (R3–R13). Defects EAINT-9000, 8969, 8993, 9002.
2. **EX_TS11–TS20** — transactions approved **after** e-Invoice deployment. Expected: "[Invoice] & [e-Invoice] button displayed" (SSM: both SSM buttons) (R15–R25). Second pass in column "QA (14/10/25)", all Pass. Defects EAINT-8964, 8966, 8967.
3. **EX_TS21–TS22** — Paid Proforma (Existing eAuto UCD / Others) with e-Invoice generated: "[Proforma Invoice] & [e-Invoice] button displayed" (R26–R27). "Regression".

### 3f. Func. TS - Buyer (Invoice PDF Buyer block; data set in BO Manage Company Account)

1. **FT_BUY_TS1** — Name with special characters: "AUTOCORE 123 & CAR (M) SDN. BHD. ' < > "A"" displays as updated (R3).
2. **FT_BUY_TS2** — Registration Number from "New Company Reg. No." "198501000222" (R4).
3. **FT_BUY_TS3** — New Company Reg. No. blank → shows "Company Reg. No." "22278989-L" (R5).
4. **FT_BUY_TS4–TS5** — Contact No. 9 and 11 characters display as typed (R6–R7).
5. **FT_BUY_TS6** — e-Invoice PIC Contact No blank → "Contact Number should display value from Company Details > Contact Number *" (R8).
6. **FT_BUY_TS7** — Email with allowed special characters "wEN_dy-lee.123@gmail.com" (R9).
7. **FT_BUY_TS8** — e-Invoice PIC Email blank → "Email should display value from Director / Owner Details > Email Address*" (R10).
8. **FT_BUY_TS9–TS11** — Vehicle No. typed without space prints with space: "WU 4444", "WUU 1234 D", "PUTRAJAYA 12" (R11–R13).
9. **FT_BUY_TS12–TS13** — Mailing Address one line and multi-line display as typed (R14–R15).

### 3g. Func. TS - Supplier & Amount (fixed values per module)

1. **FT_SA_TS1** — "eAuto logo": "Displayed on top left corner of PDF" (R5).
2. **FT_SA_TS2** — Document Code "EA-IV-{MMYY}-{XXXXXXX} (XXXXXXX - running number)" (R6).
3. **FT_SA_TS3** — Date "{dd Mmm yyyy}" (R7).
4. **FT_SA_TS4** — Payment Reference No. format per module (R8; see §4 item 10).
5. **FT_SA_TS5–TS10** — Supplier: Name "EAUTO SDN BHD", Registration Number "200401038456", SST Registration Number "W10-1808-3101-4293", Email "support@eauto.my", Contact Number [present in sheet], Address "LEVEL 15 SUNWAY TOWER ⏎ JALAN AMPANG 50450 KUALA LUMPUR." (R10–R15).
6. **FT_SA_TS11–TS16** — Amount line fields: Description, Quantity, Unit Price, Subtotal, Tax Amount, Total Price (including tax) (R18–R23).
7. **FT_SA_TS17–TS21** — Totals: Total Net Amount, Total Excluding Tax, Tax Amount, Total Including Tax, Total Payable Amount (R25–R29).
8. **FT_SA_TS22–TS24** — Tax Type "Service Tax", Tax Rate "8%", Tax Amount RM (R31–R33).

## 4. Business rules and system behaviour the TS reveals

1. **Notation shows whenever there is no e-Invoice, not only for bad TIN.** NEG_EI_TS1 uses "Update UCD TIN Number to a Valid TIN value in BO", yet expects "[Invoice] button visible on details page" and "Notation displayed" when TH final submission failed (sheet New Transactions (e-Invoice), R16). Same in R19, R22, R24, R27, R29, R31, R32, R34, R36.
2. **Notation wording was not final during testing.** "TBC for following notation: … *Update: Can refer latest SRD v1.2 for message handling & location" (sheet Invalid or Blank TIN, R3, Remarks).
3. **Fixing TIN triggers a cronjob resubmission.** "Update UCD TIN Number to Valid TIN value in BO ⏎ 6. Wait for cronjob to resubmit TH e-Invoice submission ⏎ 7. TH LHDN Response = OK" (sheet Invalid or Blank TIN, R4). Frequency not stated.
4. **Bundle parts get separate e-Invoice resubmission.** TH, SSM and STMS each have their own "LHDN Response" and resubmit separately (sheet Invalid or Blank TIN, R3–R12).
5. **Partial bundle failure: PDF shows only the successful part.** "Invoice PDF contains only TH details" (sheet New Transactions (e-Invoice), R16); after STMS resubmit, "Invoice & e-Invoice PDF contains both STMS & TH details" (R18).
6. **Proforma "Others" cannot get an e-Invoice by cronjob.** "*Invalid scenario: 'Others' Proforma has no company ID, cronjob resubmits but LHDN status remains failed. (02/10/2025)" (sheet Invalid or Blank TIN, R31, Remarks).
7. **Proforma shows no notation.** INV/MIS_TS9, TS10, TS23, TS24 expect only "[Proforma Invoice] button displayed" with no notation line (sheet Invalid or Blank TIN, R28, R30, R48, R49).
8. **Dereg final submission cannot be resubmitted.** "Note: Dereg unable to resubmit final submission" (sheet New Transactions (e-Invoice), R31, Test Steps).
9. **BMK template date differs.** "*The new invoice template PDF should show for BMK transactions created on or after 19/06/2025." (sheet Invalid or Blank TIN, R47); "*Existing Old BMK transactions created before 19/06/2025." (sheet Existing, R13). Other modules use "before 1st July 2025" (sheet Existing, R2).
10. **Payment Reference No. formats** (sheet Func. TS - Supplier & Amount, R8):
    1. STMS: "{yymmdd}{0017}{000001}-{vehicle_no}".
    2. TH: "TH{yymmdd}{000001}-{vehicle_no}".
    3. eSTM and APT: "{yymmdd}{0017}{0001}-{vehicle_no}".
    4. eLKM "LK…", eVOC "EV…", BMK "BK…", Dereg "DRG…", JomCheck "JOM…", SSM "SSM{yymmdd}{000001}-{vehicle_no}".
11. **Long vehicle numbers get cut in Payment Reference No.** "Payment Reference No will not show all of Vehicle Number if too long" (sheet Func. TS - Buyer, R13, Remarks).
12. **Pre e-Invoice SSM PDF has no vehicle number.** "Invoice will not show Vehicle Number - same behavior as e-Invoice" (sheet Func. TS - Buyer, R11, Remarks).
13. **Buyer email fallback source.** "Email is retrieved from Step 1 Update Company Profile" (sheet Func. TS - Buyer, R10, Remarks).
14. **Prices and tax on the PDF** (sheet Func. TS - Supplier & Amount, R20 Unit Price, R22 Tax, R23 Total):
    1. STMS and APT: "Car = 15.00 / Bike = 5.00", total "Car = 16.20 / Bike = 5.40".
    2. TH, eVOC, BMK: "10.00", total "10.80".
    3. eSTM: "Car = 35.00 / Bike = 7.00", total "Car = 37.80 / Bike = 7.56".
    4. eLKM: "2.75", tax "0.22", total "2.97".
    5. Dereg: "35.00", total "37.80".
    6. JomCheck: "18.00", tax "1.44", total "19.44".
    7. SSM: "a. SSM Document (Disbursement) ⏎ b. Platform Service Charge", "a. 15.40 ⏎ b. 3.00"; tax "a. 0.00 ⏎ b. 0.24"; "Total: 18.64".
15. **Tax:** "Service Tax", "8%" for every module (sheet Func. TS - Supplier & Amount, R31–R32). SSM disbursement line carries **0.00 tax** (R22).
16. **Description wording per module**, e.g. "Sistem Tukar Milik Sementara ("STMS") service charge", "Butiran Maklumat Kenderaan (“BMK”) service charge", "Deregistration service charge" (sheet Func. TS - Supplier & Amount, R18).
17. **Resubmit paths in BO:** "BO > Resubmit JPJ Final Submission (eAuto Plus)" for TH and BMK (sheet New Transactions (e-Invoice), R17, R33); "(STMS)" for STMS and UCD to UCD (R18, R28); "(eSTM)" for eSTM (R23). SSM final submission is resubmitted by **cronjob** (R20). JomCheck uses "[RESUBMIT] on Get JomCheck Reports page" (R35).
18. **APT negative needs a dev patch.** "6. Request dev to patch Tx Status to Pending ⏎ 7. Wait for cronjob to resubmit APT transaction" (sheet New Transactions (e-Invoice), R30).
19. **Pre e-Invoice SSM documents also show on the profile page.** "Navigate to Home then click on Company/Business Profile ⏎ 5. Redirect to Company/Business Profile Update page" with "[SSM Invoice] button displayed" (sheet Invalid or Blank TIN, R26).

### Where this changes or refines knowledge/

1. `knowledge/flow-company-profile-einvoice.md` step 3 ties "Only [Invoice] shows, with the note" to "Blank or invalid TIN". **The TS shows the same state for a valid TIN when the JPJ final submission failed** (item 1 above).
2. Same file, Cronjobs: "LHDN resubmission (consolidated e-Invoice) | Monthly". The TS testers "Wait for cronjob" inside one test session (sheet Invalid or Blank TIN, R4), and `production-regression-scope.md` cites "a next-day check after the 1 AM cron". **Monthly is likely wrong for this resubmission, or there are two cronjobs** [unconfirmed].
3. Same file, Rules: "Payment Reference No format {yymmdd}{0017}{000001}-{vehicle}". **That is STMS only**; other modules use their own prefixes, and eSTM/APT use a 4-digit run (item 10).
4. Same file, Rules: "A partial bundle failure gives an invoice with only the successful part." **Confirmed** by item 5.
5. `knowledge/business-rules-from-test-scenarios.md` §8 item 1 cites "row 4" for "notation hidden" under valid TIN. Correct, but the hidden state only follows **LHDN Response = OK**, not valid TIN alone.
6. Proforma "Others" cronjob limit (item 6), Dereg no-resubmit (item 8) and BMK 19/06/2025 date (item 9) are **not in knowledge/**.

## 5. Test data, environments, accounts, setup

1. **Environment not written in the sheet.** Testing ran 02/10/2025–08/10/2025, before the 20251013 production deploy, so staging [unconfirmed]. The "QA (14/10/25)" column (sheet Existing, R1) falls the day after deploy and may be the production check [unconfirmed].
2. **TIN setup:** "Update UCD TIN Number to Invalid TIN value in BO" / "Blank TIN value in BO" (sheet Invalid or Blank TIN, R3, R7). Dereg used "Request dev to patch UCD TIN Number to Invalid value" (R32). Proforma used "Request dev to patch Proforma Transaction to Blank TIN" (R28).
3. **New company:** "Create new Company from BO Manage Company" then "Login as Main UCD of the new company" (sheet New Transactions (e-Invoice), R12, R36).
4. **APT:** "Manual trigger APT for JPJ Notice 5.5" then "JPJ Notice 6.0" (sheet Invalid or Blank TIN, R21).
5. **Failure states forced** ("Final Submission = Failed, Payment = OK"); method not written (sheet New Transactions (e-Invoice), R16). eSim codes likely [unconfirmed].
6. **Existing data:** "Go to any Approved … transaction" from BO & UCD listings (sheet Existing, R3). One reference written: "S554483997" (sheet Existing, R7, Expected Result).
7. **Buyer data examples** in sheet Func. TS - Buyer R3–R15 (company name, reg. nos., phone, emails, vehicle nos., addresses).
8. **Credentials:** none in the sheet.
9. **Mobile:** columns "QA (Mobile)" / "Test Result (Mobile)" exist on every sheet; all "Not Started". Mobile was later run as a separate workbook, EAINT-9058 & 9059 [from `knowledge/cr-test-scenario-catalogue.md`, row 090: "Mobile copy of EAINT-8550 rules"].

## 6. Gaps and risks a regression should still cover

1. **Mobile never run in this workbook** — 148 Not Started cells.
2. **Calendar-month rule untested.** No TS fixes the TIN in the **next month** to check the notation's "current calendar month" limit.
3. **Buyer TIN on the Invoice PDF** for blank/invalid TIN is not checked. Func. TS - Buyer has no TIN row.
4. **Insurance Cancellation** has e-Invoices per knowledge (flow-company-profile-einvoice, Cross-module effects) but is **not in this TS**.
5. **Onboarding (Pre-Application / Application) invoices** are not covered.
6. **Proforma "Others"** with invalid TIN can never reach LHDN OK (§4 item 6). No TS for what the user sees afterwards. EAINT-12333 (future) may change Proforma invoices.
7. **Dereg** with failed final submission has no recovery path tested (§4 item 8).
8. **UCD to UCD:** invalid-TIN TS used Bulk (R19), happy flow used Standard (NEW_EI_TS5, R7). Bulk happy and Standard invalid not covered.
9. **Prices are a 2025 snapshot.** JomCheck later split RM18 + RM2 (EAINT-12412, per knowledge). Re-check amounts against current fees before reuse.
10. **Notation wording** was "TBC" pending SRD v1.2 (§4 item 2). Final wording in production not confirmed here.
11. **Typo risk:** EX_TS14 expects "[e-Invoice] & [SSM e-Invoice] button displayed on eSTM & SSM details page" (sheet Existing, R18) — likely meant [SSM Invoice] [unconfirmed].
12. **Failed / In Progress counts** not readable in the text copy.

## Knowledge candidates

1. **Notation follows LHDN status, not TIN alone.** With a valid TIN and a failed JPJ final submission, only [Invoice] shows with the notation. Source: sheet New Transactions (e-Invoice), R16: "1. Update UCD TIN Number to a Valid TIN value in BO" … "- [Invoice] button visible on details page" … "- Notation displayed". Target: `knowledge/flow-company-profile-einvoice.md` step 3.
2. **Payment Reference No. per module.** Source: sheet Func. TS - Supplier & Amount, R8 (formats in §4 item 10). Target: same file, Rules (replaces the STMS-only format).
3. **Proforma "Others" stays LHDN Failed after cronjob.** Source: sheet Invalid or Blank TIN, R31: "*Invalid scenario: 'Others' Proforma has no company ID, cronjob resubmits but LHDN status remains failed. (02/10/2025)". Target: same file, Proforma entry point.
4. **Dereg final submission cannot be resubmitted.** Source: sheet New Transactions (e-Invoice), R31: "Note: Dereg unable to resubmit final submission". Target: `knowledge/flow-edereg.md` or a Dereg flow file.
5. **BMK new invoice template from 19/06/2025**, other modules from 1 July 2025. Source: sheet Invalid or Blank TIN, R47; sheet Existing, R2 and R13. Target: `knowledge/flow-bmk.md`.
6. **Resubmit paths per module** (BO "Resubmit JPJ Final Submission (eAuto Plus)/(STMS)/(eSTM)", SSM by cronjob, JomCheck [RESUBMIT]). Source: sheet New Transactions (e-Invoice), R17, R18, R20, R23, R28, R33, R35. Target: `knowledge/flow-company-profile-einvoice.md` or module flow files.
7. **Resubmission cronjob frequency conflict** — "Monthly" in knowledge vs same-session waits in this TS and "1 AM cron" in the deployment checklist. Source: sheet Invalid or Blank TIN, R4; `knowledge/production-regression-scope.md` "[from Deployment Checklist, 20251013 R50]". Target: flag as [unconfirmed] in the Cronjobs section until verified.
8. **PDF price and tax snapshot (Oct 2025)**, Service Tax 8%, SSM disbursement 0 tax. Source: sheet Func. TS - Supplier & Amount, R18–R33. Target: fees/pricing knowledge, dated 2025-10.
9. **Pre e-Invoice SSM PDF has no vehicle number; long vehicle numbers are cut in Payment Reference No.** Source: sheet Func. TS - Buyer, R11 and R13, Remarks. Target: `knowledge/flow-company-profile-einvoice.md` Rules.
10. **Buyer Registration Number fallback**: New Company Reg. No. blank → Company Reg. No. Source: sheet Func. TS - Buyer, R5. Target: same file, Buyer block rule.
