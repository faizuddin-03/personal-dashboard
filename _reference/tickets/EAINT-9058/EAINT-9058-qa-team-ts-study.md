# EAINT-9058 — QA Team test script study (2026-10-28)

## Sources read

1. **Text copy** `_reference/sharepoint/qa-team-ts/EAINT-9058 & 9059 - eAuto App New Invoice.md` (exported 28/10/2026, 9:42:42 am). Cell text only; formatting, colours and images are not kept.
2. **knowledge/** grep for EAINT-9058 / 9059 / 8550: `flow-company-profile-einvoice.md`, `business-rules-from-test-scenarios.md` §8, `cr-test-scenario-catalogue.md` rows 067 and 090.
3. **Not found:** `_reference/tickets/EAINT-9058/` (empty before this file), `_reference/tickets/Studying/EAINT-9058/`, and no EAINT-9058 entry in `lib/ticketStudies.ts`.
4. **Not read:** the Jira ticket and any SRD. Nothing in this study comes from them.

## 1. Header

1. **Ticket:** EAINT-9058 (workbook shared with EAINT-9059). Which ticket owns which part is not stated in the sheet.
2. **Module / portal:** **eAuto App (mobile)**. Every result column is headed "QA (Mobile)" / "Test Result (Mobile)" (all sheets, row 1). Steps also name **BO** and **UCD** web listings (see §6 item 3).
3. **Workbook:** "EAINT-9058 & 9059 - eAuto App New Invoice.xlsx", library "eAuto - CR Test Scenarios", modified 04/11/2025, 11:25:43 am.
4. **Sheets (6):** Overall Testing Progress; Invalid or Blank TIN; New Transactions (e-Invoice); Existing (e-Invoice & Invoice); Func. TS - Supplier & Amount; Func. TS - Buyer.
5. **Scenario count:**
   1. Invalid or Blank TIN: **10 TS ids, 23 step rows**.
   2. New Transactions (e-Invoice): **10 TS ids, 18 step rows**.
   3. Existing (e-Invoice & Invoice): **10 TS ids / rows**.
   4. Func. TS - Supplier & Amount: **24 field ids**, tracked as **7 module columns**.
   5. Func. TS - Buyer: **13 TS ids**.
   6. Summary sheet total: "Total Count per Status | 58" (Overall Testing Progress, R8).
6. **Results:** none recorded. Every result cell reads **"Not Started"**; all "QA (Mobile)" cells are blank. The Buyer sheet has no status text at all.
7. **Tester / dates:** none written in the sheet. The catalogue (`cr-test-scenario-catalogue.md` row 090) records an owner and "2025-11-04" from SharePoint metadata, not from the sheet.
8. **TS ids carry the `8550_` prefix** (e.g. "8550_INV/MIS_TS1", "8550_NEW_EI_TS1"). The workbook is a mobile copy of the EAINT-8550 web/BO workbook (catalogue row 090: "Mobile copy of EAINT-8550 rules").

## 2. What the ticket changed, as the TS shows it

1. The **eAuto App** gets the **new Invoice template** from EAINT-8550: an **[Invoice]** button for every paid transaction, plus **[e-Invoice]** only when LHDN accepted it.
2. Users with an **invalid or blank TIN** get the Invoice only, plus a fixed notation on the details page.
3. Once the TIN is fixed and a **cronjob resubmits**, the [e-Invoice] button appears and the notation hides.
4. Existing transactions keep their documents by date band: **before 1 July 2025** = [Invoice] only; **on/after 1 July 2025** = [Invoice] + [e-Invoice].
5. Modules in scope on the App: **STMS, TH, STMS + SSM, eSTM, eLKM, eVOC, eSTM + SSM, UCD to UCD Interstate**.

## 3. Scenarios

### 3a. Invalid or Blank TIN — new transactions

1. **8550_INV/MIS_TS1** — STMS + TH (Individual), invalid TIN, TIN flipped invalid → valid → invalid → valid across TH and STMS (R3–R6). Expected: TH [Invoice] only + notation, then TH [Invoice] & [e-Invoice] + notation hidden, then STMS Invoice only + notation, then all docs + notation hidden.
2. **8550_INV/MIS_TS2** — STMS + TH + SSM (Company), blank TIN, same flip pattern for SSM, TH, STMS (R7–R12). Expected: "[SSM Invoice] button displayed on STMS & SSM details page" first, ending with "STMS, TH & SSM - Invoice & e-Invoice" and notation hidden.
3. **8550_INV/MIS_TS3** — eSTM + eLKM + eVOC (Individual), invalid TIN then valid (R13–R14). Expected: one combined Invoice, then Invoice & e-Invoice.
4. **8550_INV/MIS_TS4** — eSTM + eVOC + SSM (Company), blank TIN, flip pattern (R15–R18).
5. **8550_INV/MIS_TS5** — UCD to UCD Interstate (Bulk), invalid TIN then valid, "(Create in WEB check in APP)" (R19–R20).

### 3b. Invalid or Blank TIN — existing transactions on/after 1 July (banner R21)

1. **8550_INV/MIS_TS13** — Approved STMS + TH with "LHDN Response = Failed" (R22). Expected: [Invoice] only + notation.
2. **8550_INV/MIS_TS14** — STMS + TH + SSM, same (R23).
3. **8550_INV/MIS_TS15** — eSTM + eLKM + eVOC, same (R24).
4. **8550_INV/MIS_TS16** — eSTM + eVOC + SSM, same (R25).
5. **8550_INV/MIS_TS17** — UCD to UCD Interstate, same (R26).

### 3c. New Transactions (e-Invoice) — Happy Flow (banner R2)

1. **8550_NEW_EI_TS1** — STMS + TH (Individual), valid TIN (R3). Expected: "[Invoice] & [e-Invoice] buttons are visible on details page"; "Valid TIN is displayed correctly in Buyer details section".
2. **8550_NEW_EI_TS2** — STMS + TH + SSM (Company) (R4). Expected adds "[SSM Invoice] & [SSM e-Invoice] buttons are visible on details page".
3. **8550_NEW_EI_TS3** — eSTM + eLKM + eVOC (Individual) (R5).
4. **8550_NEW_EI_TS4** — eSTM + eVOC + SSM (R6). Module says "(Company)", step 2 says "Create eSTM Individual Transaction" (see §6).
5. **8550_NEW_EI_TS5** — UCD to UCD Interstate (Standard), "(Create in WEB check in APP)" (R7).

### 3d. New Transactions (e-Invoice) — Negative Flow (banner R8)

1. **8550_NEG_EI_TS1** — STMS + TH, "TH Final Submission = Failed, Payment = OK" (R9–R11). Expected: Invoice with "only TH details" + notation; after BO resubmit TH → e-Invoice; after STMS fails and is resubmitted → PDFs "contains both STMS & TH details".
2. **8550_NEG_EI_TS2** — STMS + SSM (Company), SSM final failed (R12–R14). Expected: "[SSM Invoice] button visible" + notation; cronjob resubmits SSM → SSM e-Invoice; STMS resubmit → STMS e-Invoice.
3. **8550_NEG_EI_TS3** — eSTM + eVOC + eLKM, eSTM final failed (R15–R16). Expected: "JPJ Transfer = Failed (due to eSTM code)", "eVOC JPJ = Failed", "eLKM JPJ = Failed", "Invoice PDF contains only eSTM details"; after resubmit all OK and PDFs contain "eSTM + eVOC + eLKM details".
4. **8550_NEG_EI_TS4** — eSTM + SSM (Company), SSM then eSTM final failed (R17–R19).
5. **8550_NEG_EI_TS5** — UCD to UCD, final failed at accepting UCD (R20–R21). Expected: "Invoice PDF contains only UCD to UCD (STMS) details" + notation; after BO resubmit → e-Invoice.

### 3e. Existing (e-Invoice & Invoice)

1. **8550_EX_TS1–TS5** — Approved transactions "completed before e-Invoice" (banner R2: "Existing (old Invoice - before 1st July 2025)"), STMS + TH, STMS + TH + SSM, eSTM + eLKM + eVOC, eSTM + eVOC + SSM, UCD to UCD (R3–R7). Expected: [Invoice] / [SSM Invoice] only.
2. **8550_EX_TS11–TS15** — same five combinations "completed after e-Invoice" (banner R8: "Existing (new Invoice + e-Invoice - on/after 1st July 2025)") (R9–R13). Expected: [Invoice] & [e-Invoice] (SSM: [SSM Invoice] & [SSM e-Invoice]).

### 3f. Func. TS - Supplier & Amount (one column per module: STMS, TH, eSTM, eLKM, eVOC, SSM (eSTM), SSM (STMS))

1. **8550_FT_SA_TS1–TS3** — eAuto logo, Document Code, Date. No expected value written.
2. **8550_FT_SA_TS4** — Payment Reference No. format per module (R8; see §4 item 9).
3. **8550_FT_SA_TS5–TS10** — Supplier Name, Registration Number, SST Registration Number, Email, Contact Number, Address. No expected value written.
4. **8550_FT_SA_TS11–TS16** — line items: Description, Quantity, Unit Price, Subtotal, Tax Amount, Total Price (R18–R23).
5. **8550_FT_SA_TS17–TS21** — totals: Total Net Amount, Total Excluding Tax, Tax Amount, Total Including Tax, Total Payable Amount (R25–R29).
6. **8550_FT_SA_TS22–TS24** — Tax Type, Tax Rate (no value written), Tax Amount RM (R31–R33).

### 3g. Func. TS - Buyer (set in BO Manage Company Account, read on the Invoice PDF)

1. **8550_FT_BUY_TS1** — Company Name with special characters (R3). Expected: "AUTOCORE 123 & CAR (M) SDN. BHD. ' < > "A"".
2. **8550_FT_BUY_TS2–TS3** — Registration Number from New Company Reg. No., then fallback to Company Reg. No. (R4–R5).
3. **8550_FT_BUY_TS4–TS6** — Contact Number 9 and 11 characters, then fallback when PIC contact blank (R6–R8).
4. **8550_FT_BUY_TS7–TS8** — Email with allowed special characters, then fallback when PIC email blank (R9–R10).
5. **8550_FT_BUY_TS9–TS11** — Vehicle No. spacing "WU 4444", "WUU 1234 D", "PUTRAJAYA 12" (R11–R13).
6. **8550_FT_BUY_TS12–TS13** — Address on one line and on several lines (R14–R15).

## 4. Business rules and system behaviour the TS reveals

1. **Notation text** (all TIN rows, e.g. Invalid or Blank TIN R3): "e-Invoices are only available for customers with a valid TIN. e-Invoices can only be issued for transactions within the current calendar month."
2. **Notation shows whenever an e-Invoice is missing, not only for a bad TIN.** With a valid TIN and a failed final submission the expected result still says "Notation displayed" (New Transactions R9, R12, R15, R17, R20). [unconfirmed reading: the trigger is "no e-Invoice yet", not the TIN itself]
3. **Notation follows the latest failed part.** After TH got its e-Invoice, STMS failing LHDN brings the notation back: "Ensure following notation displayed" while "TH - Invoice & e-Invoice" (Invalid or Blank TIN R5).
4. **Each part is sent to LHDN at its own completion, with the TIN at that moment.** The TS changes the UCD TIN in BO between TH, SSM and STMS and expects a different LHDN result for each (Invalid or Blank TIN R3–R12).
5. **Fixed TIN → cronjob resubmits per part:** "Wait for cronjob to resubmit TH e-Invoice submission" then "TH LHDN Response = OK" and [e-Invoice] appears on the same details page (Invalid or Blank TIN R4).
6. **e-Invoice waits for JPJ success.** "TH JPJ = Failed" gives "[Invoice] button visible" only; after "Navigate to BO > Resubmit JPJ Final Submission (eAuto Plus)" it gives "TH LHDN Response = OK" and both buttons (New Transactions R9–R10).
7. **Partial bundles:** the Invoice lists only the part that went through: "Invoice PDF contains only TH details" (New Transactions R9). Exception: when eSTM fails, eVOC and eLKM also fail and the Invoice "contains only eSTM details" (R15).
8. **Resubmit paths:** STMS/TH/eSTM/UCD to UCD = BO "Resubmit JPJ Final Submission" (New Transactions R10, R11, R16, R21). SSM = "Wait for cronjob to resubmit SSM Final Submission" then "Refresh Step 4 once resubmission successful" (R13, R18).
9. **Payment Reference No. formats** (Supplier & Amount R8):
   1. STMS "{yymmdd}{0017}{000001}-{vehicle_no}"
   2. TH "TH{yymmdd}{000001}-{vehicle_no}"
   3. eSTM "{yymmdd}{0017}{0001}-{vehicle_no}"
   4. eLKM "LK{yymmdd}{000001}-{vehicle_no}"
   5. eVOC "EV{yymmdd}{000001}-{vehicle_no}"
10. **Line descriptions** (Supplier & Amount R18): "Sistem Tukar Milik Sementara ("STMS") service charge"; "Transfer History ("TH") service charge"; "eSerahan Tukar Milik ("eSTM") service charge"; "e-Lesen Kenderaan Motor ("eLKM") service charge"; "e-Vehicle Ownership Certificate ("eVOC") service charge"; SSM "a. SSM Document (Disbursement) b. Platform Service Charge".
11. **Prices at the time** (Supplier & Amount R20–R29):
    1. STMS "Car = 15.00 / Bike = 5.00", tax "Car = 1.20 / Bike = 0.40", total "Car = 16.20 / Bike = 5.40".
    2. TH "10.00", tax "0.80", total "10.80".
    3. eSTM "Car = 35.00 / Bike = 7.00", tax "Car = 2.80 / Bike = 0.56", total "Car = 37.80 / Bike = 7.56".
    4. eLKM "2.75", tax "0.22", total "2.97".
    5. eVOC "10.00", tax "0.80", total "10.80".
    6. SSM "a. 15.40 b. 3.00", tax "a. 0.00 b. 0.24", total "18.64". The disbursement carries no tax.
    7. Every tax figure is **8%** of the unit price. [computed from the sheet, not stated]
12. **Buyer fallbacks** (Func. TS - Buyer):
    1. Registration Number: "Leave New Company Reg. No. blank" → shows Company Reg. No. "22278989-L" (R5).
    2. Contact: PIC contact blank → "Contact Number should display value from Company Details > Contact Number *" (R8).
    3. Email: PIC email blank → "Email should display value from Director / Owner Details > Email Address*" (R10). Remark R10: "Email is retrieved from Step 1 Update Company Profile".
13. **Vehicle No. remarks contradict the expected result.** Expected "WU 4444" (R11), but remark R11 says "Invoice will not show Vehicle Number - same behavior as e-Invoice". Remark R13: "Payment Reference No will not show all of Vehicle Number if too long".
14. **UCD to UCD on the App is view-only in this TS:** "(Create in WEB check in APP)" (Invalid or Blank TIN R19; New Transactions R7, R20; Existing R7, R13).

### Against existing knowledge

1. **Consistent:** notation text, button names, fallbacks and vehicle spacing match `business-rules-from-test-scenarios.md` §8 items 1, 2, 5 and `flow-company-profile-einvoice.md` "Flow: Invoice and e-Invoice".
2. **New:** Payment Reference formats for TH, eSTM, eLKM, eVOC (knowledge has STMS only, `flow-company-profile-einvoice.md` line 128).
3. **Differs:** `flow-company-profile-einvoice.md` line 111 lists mobile e-Invoice modules as "STMS, UCD to UCD, eSTM, eLKM, eVOC, SSM". This TS also tests **TH on mobile** ("TH (Mobile)", Supplier & Amount R4).
4. **Differs:** knowledge says a fixed TIN is picked up by the **monthly consolidated** e-Invoice job (EAINT-9845, live 2026-03). This 2025-11 TS expects a cronjob that gives the **transaction's own [e-Invoice]** on its details page (Invalid or Blank TIN R4). Which one applies today is not known. [unconfirmed]
5. **Outdated:** SSM price 15.40 + 3.00 + 0.24 = 18.64. Knowledge says EAINT-10691 replaced it with RM19.44 (`flow-company-profile-einvoice.md` line 58). Knowledge's older split is "RM15 + 3 + 1.44"; this sheet splits it 15.40 / 3.00 / 0.24.

## 5. Test data, environments, accounts, setup

1. **Environment:** not named in the sheet.
2. **Accounts:** a UCD company whose **TIN is edited in BO** (Manage Company Account) to valid, invalid or blank per step. Individual and Company UCD accounts; an accepting UCD for UCD to UCD (New Transactions R20).
3. **Credentials:** none present.
4. **Buyer sample values** (Func. TS - Buyer R3–R15): company name with special characters, reg. nos "198501000222" / "22278989-L", contact "016222888" / "01300115551" / "0188855098", emails "wEN_dy-lee.123@gmail.com" / "m_f.test-ing123@gmail-test.com", vehicles "WU4444" / "WUU1234D" / "PUTRAJAYA12", two addresses.
5. **Existing data:** any Approved transaction before and after 1 July 2025, and any Approved with "LHDN Response = Failed". One stray value "S554483997" sits in Existing R7 expected result. [unconfirmed: likely a sample transaction no.]
6. **BO tools used:** "Resubmit JPJ Final Submission (eAuto Plus)", "(STMS)", "(eSTM)".

## 6. Gaps or risks a regression should still cover

1. **Never executed in this file.** All 58 counted items are "Not Started"; no pass/fail evidence exists here.
2. **Buyer sheet is not counted.** Its 13 TS have no status text, so the summary total of 58 leaves them out (Overall Testing Progress R6, R8).
3. **Web/BO wording left in a mobile sheet.** Existing and TS13–TS17 steps say "Navigate to BO & UCD - STMS Transaction Listing page". The App-side path to the details page is not written.
4. **Typos that change meaning:**
   1. 8550_EX_TS14 expects "[e-Invoice] &  [SSM e-Invoice]" for SSM (Existing R12); EX_TS12 expects "[SSM Invoice] & [SSM e-Invoice]" (R10).
   2. 8550_NEW_EI_TS4 module "(Company)" but step "Create eSTM Individual Transaction" (New Transactions R6). SSM purchase normally needs a company [unconfirmed].
   3. INV/MIS_TS4 rows R17–R18 say "on STMS & SSM details page" for an eSTM flow.
5. **Supplier block and Tax Type / Tax Rate** have no expected values (Supplier & Amount R5–R15, R31–R32).
6. **Vehicle No.** expectation conflicts with its own remark (§4 item 13). Check which is true on the App.
7. **Prices are stale** for SSM (and possibly others). Regression must use current fees.
8. **Not covered:** APT, BMK, JomCheck, Dereg, Insurance Cancellation documents on the App; Proforma; sub-user vs main-user view; the "current calendar month" rule (no TS crosses a month end); Document Code sequence.
9. **Resubmission model** (§4 "Against existing knowledge" item 4) needs a check against the current consolidated e-Invoice job.

## Knowledge candidates

1. **Payment Reference No. formats per module** — TH "TH{yymmdd}{000001}-{vehicle_no}", eSTM "{yymmdd}{0017}{0001}-{vehicle_no}", eLKM "LK{yymmdd}{000001}-{vehicle_no}", eVOC "EV{yymmdd}{000001}-{vehicle_no}". Source: SharePoint TS EAINT-9058 & 9059, sheet Func. TS - Supplier & Amount, R8. Target: `flow-company-profile-einvoice.md` Rules.
2. **Notation appears whenever a part has no e-Invoice, including valid-TIN JPJ failures.** Source: sheet New Transactions (e-Invoice), R9, R12, R15, R17, R20. [unconfirmed reading] Target: `business-rules-from-test-scenarios.md` §8.
3. **e-Invoice is issued only after JPJ final submission succeeds; SSM final failures are resubmitted by cronjob, others via BO "Resubmit JPJ Final Submission".** Source: sheet New Transactions (e-Invoice), R9–R21.
4. **eSTM final failure also fails eVOC and eLKM; Invoice then holds eSTM details only.** Source: sheet New Transactions (e-Invoice), R15.
5. **TH is in the mobile e-Invoice scope.** Source: sheet Func. TS - Supplier & Amount, R4 "TH (Mobile)". Corrects `flow-company-profile-einvoice.md` line 111.
6. **Line descriptions per module** (§4 item 10). Source: sheet Func. TS - Supplier & Amount, R18.
7. **8% tax and 2025-11 unit prices** (STMS Car 15 / Bike 5, TH 10, eSTM Car 35 / Bike 7, eLKM 2.75, eVOC 10, SSM 15.40 + 3.00) as a dated price snapshot. Source: sheet Func. TS - Supplier & Amount, R20–R29.
8. **Invoice Vehicle No. may not print at all** — remark "Invoice will not show Vehicle Number - same behavior as e-Invoice". Source: sheet Func. TS - Buyer, R11 Remarks. [unconfirmed; conflicts with knowledge "WU 4444" rule]
9. **Catalogue row 090 fix:** per-sheet counts in `cr-test-scenario-catalogue.md` (e.g. "Invalid or Blank TIN:11") do not match this sheet (10 TS ids / 23 rows; summary R3 "23"). Source: Overall Testing Progress R3–R8.
