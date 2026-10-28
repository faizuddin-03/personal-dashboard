# Business rules stated in past CR test scenarios (SharePoint sweep 2026-10-16)

Durable rules that the team's own CR test scripts state as expected results:
validations, status transitions, email and WhatsApp expectations, column and file
formats, pricing. Distilled from the 140 workbooks catalogued in
[cr-test-scenario-catalogue.md](cr-test-scenario-catalogue.md).

## How to read this

1. **Provenance tag.** Every fact ends with
   `[from SharePoint TS #NNN <ticket>, sheet <name>, row <n>]`. `#NNN` is the
   catalogue number; Appendix A of the catalogue maps it to the exact workbook file
   name and SharePoint path. Row numbers are Excel row numbers in that sheet.
2. **These are tested expectations, not verified system behaviour.** A test script
   records what the tester expected when the CR shipped. Treat each rule as
   `[from QA team]`-grade: good enough to draft a new script, but check the live
   system or the newest SRD before a rule drives a decision.
3. **Dated values.** Fees, insurer sequences and campaign dates change often. The
   ticket key tells you which CR set the value; a later CR may have replaced it.
   Where a later CR in the sweep supersedes an earlier one, both are listed and the
   newer one is marked.
4. **Quotes are verbatim** (only line breaks collapsed). Typos in the source are kept.
5. **Environments are left out on purpose.** Where a workbook names the environment
   it was tested on, that is in the catalogue only. No rule below depends on an
   environment.
6. CRs that already have their own knowledge file (EAINT-9306, 11864, 11934, 12058,
   12107, 12151, 12153, 12257, 12339) are not repeated here.

---

## 1. Fees and pricing

### 1.1 Current eAuto service fees (vehicle type Car, usage codes AB–DK)

1. **STMS (incl. UCD to UCD Standard and Interstate), from EAINT-12403:**
   "JPJ Fee = RM10.00 • eAuto Fee = RM25.00 • Service Tax 8% = RM2.00 • Total Amount
   Payable = RM37.00" `[from SharePoint TS #042 EAINT-12403, sheet APT, row 16]`
2. STMS JPJ fee does not vary by region: "STMS JPJ is RM10 in all regions"
   `[from SharePoint TS #042 EAINT-12403, sheet APT, row 17]`
3. **APT, from EAINT-12403:** "eAuto Service Fee = RM25.00 • 8% charge = RM2.00 •
   eAuto Service Fee charged = RM27.00 • JPJ Fee = RM100.00 • Total APT amount =
   RM127.00" `[from SharePoint TS #042 EAINT-12403, sheet APT, row 42]`
4. APT Sabah / Sarawak: "eAuto Service Fee charged = RM27.00 • JPJ Fee = RM40.00 •
   Total APT amount = RM67.00" `[from SharePoint TS #042 EAINT-12403, sheet APT, row 43]`
5. APT JPJ fee follows the usage code, not only the region: "Ensure the rate-card
   exception applies (JPJ follows the usage code, not only the region): • JPJ Fee =
   RM100.00 … • Total APT amount = RM127.00 (NOT RM67.00)"
   `[from SharePoint TS #042 EAINT-12403, sheet APT, row 47]`
6. Commercial car APT in Semenanjung, usage BF: "JPJ Fee RM40.00 + eAuto Fee RM25.00 +
   Service Tax 8% RM2.00 = RM67.00 • RHB split debit: eAuto RM27.00 + JPJ RM40.00"
   `[from SharePoint TS #042 EAINT-12403, sheet APT, row 48]`
7. Excluded from the RM25 change: AA (Motosikal), every BIKE row, and eSerahan.
   "Ensure only the 52 CAR rows at RM20 changed to RM25 (27 STMS + 25 APT); AA CAR,
   every BIKE row and eSERAHAN are untouched." `[from SharePoint TS #042 EAINT-12403, sheet APT, row 80]`
8. Motosikal (AA) STMS stays "JPJ RM1.00, eAuto RM5.00, 8% RM0.40, Total RM6.40"
   `[from SharePoint TS #042 EAINT-12403, sheet APT, row 22]`
9. Bike (AB) STMS stays "JPJ Fee = RM10.00 • eAuto Fee = RM15.00 • Service Tax 8% =
   RM1.20 • Total Amount Payable = RM26.20" `[from SharePoint TS #042 EAINT-12403, sheet APT, row 29]`
10. Homepage tiles: STMS "From RM35"; STMS page "Price from RM35* for each STMS
    Transfer" `[from SharePoint TS #042 EAINT-12403, sheet APT, row 30]`; UCD to UCD
    "RM35* only for each UCD to UCD Transfer" `[… row 40]`; APT tile "RM125 = JPJ
    RM100.00 + eAuto Service Fee RM25.00, excluding the 8% charge" `[… row 62]`.
11. APT Step 6, UCD APT details and BO APT details show no pricing at all
    `[from SharePoint TS #042 EAINT-12403, sheet APT, row 63]`.
12. Invoice description is the same for STMS and UCD to UCD:
    "Sistem Tukar Milik Sementara ("STMS") service charge" RM25.00 + SST RM2.00 =
    RM27.00 `[from SharePoint TS #042 EAINT-12403, sheet APT, row 69]`

### 1.2 How a fee change is applied (EAINT-12289 and EAINT-12403)

1. **Priced at payment, not at creation.** A transaction created before the price
   push and paid after it is charged the new fee: "Ensure the payment is priced when
   it is made" `[from SharePoint TS #042 EAINT-12403, sheet APT, row 19]`. An STMS
   approved before the deploy whose APT is triggered after it gets the new fee
   `[from SharePoint TS #039 EAINT-12289, sheet Sheet1, row 18]`.
2. **Payment reset on deploy.** BO resets failed payments so UCD can pay again at the
   new price: after reset "Payment = - and Tx Status = Pending • UCD able to make
   payment again" `[from SharePoint TS #042 EAINT-12403, sheet APT, row 56]`.
3. **Reset scope differs per CR.**
   1. EAINT-12403: "the reset keys on Payment = Failed, not Tx Status = Failed"
      `[from SharePoint TS #042 EAINT-12403, sheet APT, row 25]`; a Pending
      transaction is "NOT in the reset population (REQ005 resets Failed / Failed only)"
      but is charged the new fee when paid `[… row 53]`; Approved is never reset `[… row 27]`.
   2. EAINT-12289: "All transactions except completed ones are reset and use the
      revised fee" `[from SharePoint TS #039 EAINT-12289, sheet Sheet1, row 23]`.
   3. Read the SRD of the CR in hand; do not assume either scope.
4. AA (Motosikal) is included in the reset but not repriced: "Motosikal transaction
   IS reset but NOT repriced" `[from SharePoint TS #042 EAINT-12403, sheet APT, row 23]`.
5. **Documents keep the price they were paid at.** "Documents print the amount saved
   on the payment." Old invoices and Slip Pengesahan are unchanged
   `[from SharePoint TS #042 EAINT-12403, sheet APT, row 71]`.
6. Reports show both fee versions side by side; reconciliation totals must tie to the
   individual transactions `[from SharePoint TS #042 EAINT-12403, sheet APT, row 68]`.
7. The APT resubmit cronjob (EAINT-8668) prices its resubmission at the new fee
   `[from SharePoint TS #042 EAINT-12403, sheet APT, row 58]`.
8. APT auto-created after STMS approval is submitted by the cronjob with no UCD action
   `[from SharePoint TS #042 EAINT-12403, sheet APT, row 77]`.
9. Wholesale STMS shows the same revised charge, RM27.00
   `[from SharePoint TS #042 EAINT-12403, sheet APT, row 75]`.
10. Test-data rule written into both workbooks: test data "MUST be created BEFORE Dev
    pushes the new price … cannot be reproduced after"
    `[from SharePoint TS #042 EAINT-12403, sheet APT, row 8]`.

### 1.3 Fee history seen in the sweep (dated; newest last)

| Module | Value | Source |
|---|---|---|
| STMS car | eAuto RM15.00 + 1.20 = RM16.20 | `[from SharePoint TS #056 EAINT-7548, sheet e-Invoice Price Breakdown, row 2]`; still RM15.00 in `[from SharePoint TS #104 EAINT-9605, sheet EAINT-9605, row 15]` |
| STMS car | RM20.00 (baseline before 12403) | `[from SharePoint TS #042 EAINT-12403, sheet APT, row 14]` |
| STMS car | RM25.00 | §1.1 |
| APT car | RM15.00 → RM20.00 (EAINT-12289) | `[from SharePoint TS #039 EAINT-12289, sheet Sheet1, row 14]` |
| APT car | RM20.00 → RM25.00 (EAINT-12403) | §1.1 |
| APT tile | RM115 → RM120 (12289) → RM125 (12403) | `[from SharePoint TS #039 EAINT-12289, sheet Sheet1, row 32]`; §1.1 |
| eSTM car | eAuto RM35.00 + 2.80 = RM37.80 | `[from SharePoint TS #056 EAINT-7548, sheet e-Invoice Price Breakdown, row 12]`; `[from SharePoint TS #104 EAINT-9605, sheet EAINT-9605, row 18]` |
| eSTM bike | RM7.00 + 0.56 = RM7.56 | `[from SharePoint TS #056 EAINT-7548, sheet e-Invoice Price Breakdown, row 13]` |
| eLKM processing | RM2.75 + 0.22 = RM2.97 | `[… row 15]` |
| eVOC processing | RM10.00 + 0.80 = RM10.80 | `[… row 19]` |
| Transfer History | RM10.00 + 0.80 = RM10.80 | `[… row 5]` |
| BMK | JPJ RM20.00 (no tax) + eAuto RM10.00 + 0.80 = RM30.80 | `[… rows 30-31]` |
| Dereg | RM35.00 + 2.80 = RM37.80 | `[… row 35]` |
| eDereg Pre-Checking | RM5.00 + 0.40 = RM5.40 | `[from SharePoint TS #008 EAINT-10168, sheet Amount (RM), row 8]` |
| SSM document | old: RM15.40 + eAuto RM3.00 + 0.24 = RM18.64 | `[from SharePoint TS #056 EAINT-7548, sheet e-Invoice Price Breakdown, rows 33-34]` |
| SSM document | new (EAINT-10691): "SSM Document Fee : RM 15.00 eAuto Service Fee : RM 3.00 eAuto Service Tax : RM 1.44 Total Amount Payable : RM 19.44" | `[from SharePoint TS #097 EAINT-9247, sheet SSM Price Change Regression, row 3]` |
| JomCheck | RM18.00 + 1.44 = RM19.44 → RM20.00 + 1.60 = RM21.60 (EAINT-10089) | `[from SharePoint TS #056 EAINT-7548, sheet e-Invoice Price Breakdown, row 32]`; `[from SharePoint TS #007 EAINT-10089, sheet Price Change Functional, row 11]` |

The production deployment folder "20260331 - 31st Mar 2026 (Add RM5 STMS & UTU)"
(§17) is the likely RM15 → RM20 STMS step. `[unconfirmed]`

### 1.4 SSM document on MyInvois

"Classification Codes = 022 Description of Product or Service = SSM profile & admin
fees Quantity = 1 Unit Price (RM) = 18.00 … Total Including Tax = RM 19.44"
`[from SharePoint TS #097 EAINT-9247, sheet SSM Price Change Regression, row 5]`.
The SSM price is also inside the Pre-Application payment, which "Remain as RM
108.00" `[… row 11]`.

---

## 2. STMS, UCD to UCD and APT

1. **Usage code AH.** When JPJ returns AH, "Usage code field is visible and displays
   "AH"" on Step 4, Step 6 and Transaction Details; with no AH "Usage code field is
   hidden" `[from SharePoint TS #011 EAINT-11057, sheet STMS, rows 5, 7]`.
2. In a bulk of 4, a failed row with 4F + AH shows "AH"; AB rows show the field
   without "AH" `[from SharePoint TS #011 EAINT-11057, sheet UCD to UCD, rows 16-19]`.
3. **UCD to UCD Interstate.** The buyer (UCD B) pays. A new interstate transaction
   shows Tx Status "Interstate New" and UCD B sees "TO THUMB IN BY <created + 48 h>"
   `[from SharePoint TS #042 EAINT-12403, sheet APT, rows 33-35]`.
4. **BO STMS CSV.** File name "STMS_YYYYMMDDHHmm e.g: STMS_202606220939"; Transfer
   History columns "Last 3 Months Total Ownership Transfer" and "Latest Ownership
   Transfer Date"; with no transfer the values are "No transfer found since
   registration" and "None" `[from SharePoint TS #045 EAINT-3210, sheet Test Scenario, rows 2, 4]`.
5. **APT auto reset on RHB error RE.** "System will detect RE > define the error …
   system will auto reset payment for that transaction"
   `[from SharePoint TS #020 EAINT-11855, sheet Sheet2, rows 1-3]`.
6. **APT resubmit cronjob (EAINT-8668).** Schedule "Prod: 8.00 PM everyday (only once
   per day)", "Staging: Every 10 minutes" `[from SharePoint TS #077 EAINT-8668, sheet Scenario Test, meta rows 4-5]`.
   It resubmits only Payment = Failed transactions that meet all criteria
   `[… row 12]`; Payment OK + Tx Failed is not resubmitted `[… row 15]`; Pending and
   New are not picked up `[… rows 24, 28]`. After success: Payment OK, Tx Approved,
   [e-Invoice] and [Slip Pengesahan] available `[… row 12]`.
7. **RHB failed payment remark** (eSIM prefix with RHB Transfer IF): "Remarks = IF -
   Wang di dalam akaun RHB anda TIDAK MENCUKUPI…" `[from SharePoint TS #042 EAINT-12403, sheet APT, row 20]`.
8. A JPJ enquiry failure leaves Payment "-": "JPJ Check = Failed, Payment = -, Tx
   Status = Failed • Remarks = JPJ Enquiry Failed : HAK MILIK DITUNTUT"
   `[from SharePoint TS #042 EAINT-12403, sheet APT, row 24]`.
9. **BO Support Tools > STMS Transaction edits** `[from SharePoint TS #081 EAINT-8766, sheet EAINT-8766]`:
   1. Status New: Engine No, Chassis No, Vehicle Make, Vehicle Model, Manufacturing
      Year editable `[row 12]`; company transactions add Company Name and ROC No. `[row 17]`.
   2. Status Approved: individual → MyKad No. only `[row 13]`; company → Company Name
      and ROC No. only `[row 18]`.
   3. JPJ Transfer Failed: vehicle fields edited and "JPJ Transfer & Transaction Status
      are updated to Pending" `[row 14]`.
10. BO cancel of eSTM: "Remarks displayed as "CANCELLED BY <BO Account> on dd-mm-yyyy
    hh:mm"" `[from SharePoint TS #081 EAINT-8766, sheet EAINT-8766, row 4]`.
11. BO Reset Payment (STMS and eSTM): "[Reset] button is displayed in the Action
    column"; after reset "UCD able to make payment again"
    `[from SharePoint TS #087 EAINT-8826, sheet EAINT-8826, rows 3, 7]`. It sits
    "alongside [View] and [Cancel] for a Failed transaction"
    `[from SharePoint TS #042 EAINT-12403, sheet APT, row 56]`.

---

## 3. eSTM, eLKM, eVOC and Butir-butir Hak Milik

1. **Sub UCD eLKM cap.** "Maximum LKM Amount RM2,000.00 per transaction, unable to
   proceed." At RM2,000.01 the eLKM road-tax amount is struck through and removed and
   the transaction continues without eLKM `[from SharePoint TS #064 EAINT-8534, sheet WEB, row 9]`.
   RM2,000.00 is allowed `[… row 8]`. The cap applies to the amount for the chosen
   renewal period (6 or 12 months) `[… rows 10-11]`. Main UCD is not capped `[… row 13]`.
2. **BO JPJ Enquiry (New) for eSTM.** New fields LKM, LKM Period, eVOC
   `[from SharePoint TS #046 EAINT-3677, sheet Sheet1, row 2]`; LKM Yes/No; period 6 or
   12 when Yes, 0 when No `[… rows 3, 6-7]`. The request XML ends with LKM Indicator ~
   LKM Duration ~ eVOC Indicator, e.g. "~Y~6~Y" `[… rows 10-13]`.
3. **Butir-butir Hak Milik table.** New documents' eBAYARAN JPJ columns: "1 Bil 2 Kod
   Terimaan 3 Kod Terimaan JPJ 4 No. Rujukan 5 Keterangan 6 Amaun(RM) The columns named
   "Dari" & "Hingga" is removed" `[from SharePoint TS #047 EAINT-4328, sheet Test Scenario, row 3]`.
   Documents already triggered before the change keep Dari and Hingga `[… row 17]`.
4. **Slip Pengesahan.** "If eSTM transaction includes eLKM transaction, display the
   TEMPOH SAH LESEN KENDERAAN MOTOR table"; without eLKM it is not displayed
   `[from SharePoint TS #047 EAINT-4328, sheet Slip Pengesahan, rows 2, 4]`.
   Created before Nov 2025: old format with the eBAYARAN JPJ page `[… row 6]`;
   Nov 2025 – Feb 2026: old format without that page `[… row 7]`.
5. **Hak Milik cronjob (EAINT-8523).** When generation fails the BO eSTM listing shows
   a "[Hak Milik] hyperlink … on Action column"; clicking it: "Upload failed. Please
   retry." The cronjob later "should pick up transaction to generate Butir-butir Hak
   Milik" and the link disappears `[from SharePoint TS #062 EAINT-8523, sheet Sheet1, rows 4-6]`.
   Runs were checked at :30 past the hour `[… rows 8-20]`.
6. **Hak Milik source flag** on the Service Portal listing: "Hak Milik = J" when the
   document was bought from JPJ by the cronjob (eSIM STMS Enquiry response code 4K)
   `[from SharePoint TS #080 EAINT-8699, sheet E2E Flow, row 3]`; "Hak Milik = E" when
   bought in the eSTM flow `[… row 13]`.
7. eSTM without Butir-butir Hak Milik is "NOT listed" on the Service Portal listing
   `[from SharePoint TS #080 EAINT-8699, sheet E2E Flow, row 9]`.

---

## 4. SSM

### 4.1 Permission model

1. **Company-level SSM permission, user not granted** (EAINT-8526/8532):
   1. Sub UCD, eSTM: Step 2 mandatory uploads "SSM Business Profile - Authorisation
      Letter - Staff Employment Pass & MyKad"; Step 4 "[Purchase SSM] will NOT be
      displayed" `[from SharePoint TS #063 EAINT-8526 & 8532, sheet CR Test Scenarios, rows 2, 4]`.
   2. STMS: "SSM Company Profile - Company Board Resolution - Staff Employment Pass &
      MyKad" `[… row 5]`.
2. **User-level SSM permission granted:** one mandatory upload (Main UCD STMS:
   "Company Board Resolution"; Sub UCD eSTM: "Authorisation Letter") and "[Purchase
   SSM] will be displayed and not allowed to proceed to next step without purchasing
   SSM" `[from SharePoint TS #063 EAINT-8526 & 8532, sheet CR Test Scenarios, rows 20-25]`.
3. **Bypass Purchase SSM (EAINT-8802)** `[from SharePoint TS #086 EAINT-8802, sheet E2E]`:
   1. Company ✅ + user Bypass ✅: Step 2 shows three upload fields, "User can proceed to
      Step 6 without purchasing SSM - SSM related items should NOT appear in any step"
      `[row 6]`.
   2. Company ✅ + Bypass ❌: one upload field; "User MUST purchase SSM to proceed to
      Step 6 - SSM related items are displayed from Step 4 onwards" `[rows 8-9]`.
   3. Company ❌: proceeds without SSM purchase `[rows 14-15]`.
   4. Note: the single required document per role in rows 8-9 (Main UCD →
      Authorisation Letter, Sub UCD → Company Board Resolution) is the reverse of the
      EAINT-8526 pairing in 4.1.2. `[unconfirmed]` which is current — see
      Contradictions.
4. A permission change mid-transaction is re-evaluated when the UCD clicks [Make
   Payment] or [Resubmit] at Step 4 `[from SharePoint TS #086 EAINT-8802, sheet SSM Permission, rows 33-41]`.
5. **Bypass audit log (EAINT-9842).** Log Date From/To are mandatory: "Please select
   Log Date From and Log Date To" `[from SharePoint TS #114 EAINT-9842, sheet Search & Filter, row 9]`;
   range max 30 days `[… row 4]`; columns "1. # 2. Date 3. UCD Company Name 4. UCD User
   Full Name 5. By 6. Description" `[… row 10]`; date format "YYYY-MM-DD HH:MM:SS.0"
   `[from SharePoint TS #114 EAINT-9842, sheet Functionality, row 9]`. Hidden for
   unauthorised users `[from SharePoint TS #114 EAINT-9842, sheet Permission, row 6]`.

### 4.2 SSM verification and errors (EAINT-9247, LLP)

1. Popup title "SSM Document Verification" with:
   1. "Verification successful: The Buyer representative's information matches the
      SSM document." `[from SharePoint TS #097 EAINT-9247, sheet E2E Scenarios - eSTM, row 7]`
   2. "Verification failed: The Buyer representative's information does not match the
      SSM document." `[… row 8]`
   3. "Verification failed: The Buyer Company/Business Status is inactive, unable to
      proceed. Kindly proceed to JPJ counter." `[… row 12]`
2. An approved SSM document is reused for 7 days; a second buyer on the same ROC sees
   "SSM Document for this Buyer Company was purchased recently."
   `[from SharePoint TS #097 EAINT-9247, sheet E2E Scenarios - eSTM, rows 15, 17]`
3. Step 2 Type of Business radios, unselected by default: "Sdn Bhd or Bhd - Sole
   Proprietorship or Partnership - Limited Liability Partnership (LLP)"
   `[from SharePoint TS #097 EAINT-9247, sheet Func. TS (eSTM; Flow), row 3]`. LLP needs
   an Authorization Letter `[… row 4]`. Upload ≤5MB, PDF/JPEG/PNG; over 5MB "File size
   too big"; other types "Invalid file type" `[… rows 7-13]`.
4. Type of Business is shown below "Buyer's Rep Name" on Step 4/5/6 and below "Company
   Reg No" on the details page `[… rows 15, 17]`.
5. SSM response codes `[from SharePoint TS #097 EAINT-9247, sheet Error Code TS, rows 4-15]`:
   001 Authentication error, 002 Duplicate Order Code, 003 Not Found, 004 Found,
   005 Confirm, 006 Insufficient Balance, 007 Search Not Done, 008 Duplicate,
   009 Unable to Supply Data, 010 Found and Available, 011 PDF file and Second Endpoint
   expired.
   1. 004 on enquiry: "SSM Check = OK, Tx Status = Pending • UCD able to proceed to
      make payment" `[row 4]`.
   2. 009: popup "Purchase SSM Document" — "Please be advised that SSM e-Info is
      currently experiencing intermittent connectivity to the SSM server…" `[row 5]`.
   3. 001: "The SSM Document is not available for purchase. Please re-check the Buyer
      SSM number"; UCD stays at Step 4 `[row 7]`.
   4. 005 on final submission: "SSM Check = OK, Tx Status = Approved" `[row 18]`.

---

## 5. JomCheck

1. **Price display (EAINT-10089).** "Purchase Report (RM20.00 + 8% Service Tax per
   report)" `[from SharePoint TS #007 EAINT-10089, sheet Price Change Functional, row 4]`;
   sidebar "RM20* only for each JomCheck Report * The price is exclusive of government
   service tax. The product price consists of JPJ and eAuto Service Fee." `[… row 5]`;
   result "Vehicle number found. Pay now (RM20.00 + 8% Service Tax) to purchase the
   report." `[… row 7]`.
2. BO SST Payment Report per JomCheck: "Amount (RM) = 20.00 - Total Service Tax Amount
   (RM) = 1.60 - Total Amount (RM) = 21.60 - EAUTO (RM) = 6.00 - SST (8%) = 0.48"
   `[from SharePoint TS #007 EAINT-10089, sheet Price Change Functional, row 11]`.
3. **Search by vehicle or chassis (EAINT-6475)** `[from SharePoint TS #050 EAINT-6475]`:
   1. Vehicle Number radio selected by default; the other field greyed out
      `[sheet Functional TS, rows 7-8]`.
   2. Chassis keeps * / - and spaces; "System auto removes special characters (except
      for * / -)"; non-ASCII removed; lowercase converted to uppercase; "System blocks
      further input after 30 characters" `[sheet Functional TS, rows 19-22]`.
   3. Not found: "Chassis not found. Try again with another chassis" / "Vehicle not
      found. Try again with another vehicle", Tx Pending `[sheet E2E TS, rows 8, 16]`.
   4. API down: "Jomcheck API is temporarily unavailable now, please try again in 10
      minutes." → Tx Failed, [Pay Now] not shown `[sheet Regression TS, row 8]`.
   5. Failed transaction: vehicle and chassis not editable, Resubmit not shown; a
      chassis-bought report shows Vehicle No "-" in listings `[sheet E2E TS, row 22]`.
   6. Success text: "Report is retrieved successfully. You can download the report now
      or access it later through the JomCheck report listing." `[sheet E2E TS, row 7]`.
4. **Payment popup** (all JomCheck purchases): "Are you sure you want to proceed with
   this payment? Please ensure that there is sufficient fund in your RHB account."
   (+ Malay and Chinese) `[from SharePoint TS #050 EAINT-6475, sheet E2E TS, row 6]`;
   with sharing: "…proceed with this payment and share this report with the credit
   company?" `[from SharePoint TS #012 EAINT-11175, sheet Sheet1, row 21]`.
5. **Resubmit rules (EAINT-9203, v2 by May)** `[from SharePoint TS #093 EAINT-9203, sheet 9203 TS v2 (May)]`:
   1. Payment OK + Tx Failed: "'Resubmit' action is NOT showing for UCD but remain
      showing for BO user" `[row 8]`; after BO resubmits successfully both hide it `[row 9]`.
   2. Approved (any LHDN status), Pending, New: not shown on UCD or BO `[rows 10-15]`.
   3. Payment Failed + Tx Failed: not shown on either `[row 13]`. The v1 sheet agrees:
      its TS5/TS10 titles say "is showing", but their Expected Result says "not showing"
      on both UCD and BO `[sheet 9203 TS v1 (Zuhaira), rows 12, 17]`. The title is a typo.
      `[from Faizuddin, 2026-10-16, after reading both sheets]`
6. **BO JomCheck Report Listing (EAINT-8638)** `[from SharePoint TS #073 EAINT-8638]`:
   1. Vehicle number auto-uppercased; special and non-ASCII characters removed
      `[sheet SnF Fields & Results, rows 8-10]`.
   2. Chassis keeps "- / space *"; removes others such as ~ < ] = ! `[rows 14-15]`.
   3. Search is exact-match: "Partial Vehicle Number | Result will display unmatched"
      `[row 26]`.
   4. No match: "0 record(s) in total"; exported CSV holds only the header `[sheet E2E, row 10]`.
   5. Unauthorised users: "JomCheck Report Listing" hidden `[sheet Authorized Users, row 14]`.
7. **BO JomCheck Transaction Listing "Payment To" (EAINT-1245)**: defaults to today;
   "Unable to select future dates" and "Unable to select date after 30 days"
   `[from SharePoint TS #043 EAINT-1245, sheet Sheet1, rows 3, 6-7]`.
8. **ezAuto spec 1.6 (EAINT-9786).** Report shows "Avg Market Value - Approx. New Car
   Price" `[from SharePoint TS #112 EAINT-9786, sheet Sheet1, row 3]`. Maintenance:
   "Unable to retrieve JomCheck results due to system maintenance. Please try again
   later." → Transaction No "-", Payment "-", Tx Status "Pending" `[… row 4]`.
9. **Documents (EAINT-8686/8687).** Success: [e-Invoice] and [Report]; invalid TIN:
   [Report] only; failed payment: neither, not in MyInvois
   `[from SharePoint TS #079 EAINT-8686 & 8687, sheet Sheet1, rows 2, 4, 6]`. No
   duplicate e-Invoice on duplicate submission `[… row 3]`.
10. **JomCheck API for credit companies (EAINT-11757)** `[from SharePoint TS #016 EAINT-11757, sheet Sheet1]`:
    1. Keys: "algorithm (RS256 · RSA-3072)" `[row 7]`.
    2. Partner row after provisioning: "TYPE = CREDIT COMPANY, KEYS = '1 active',
       STATUS = ACTIVE" `[row 9]`; audit entries COMPANY_CREATED and/or CREDENTIAL_ISSUED `[row 10]`.
    3. Rotation asks for confirmation; old key "Expiring", new key "Active" `[row 11]`.
       Revoking makes the key "Revoked" (still listed) and it must actually fail `[rows 12-13]`.
    4. Report call: "HTTP 200 with report JSON including documentUrl and
       documentUrlExpiresAt. PDF is NOT inside the JSON." `[row 15]`.
    5. Every auth failure is the same generic 401 `[from SharePoint TS #001 EAINT-11757, sheet 11757 JomCheck API, row 6]`.
11. **Report sharing (EAINT-10937 / 11175)**:
    1. Share section text "Share Report with Financial Institution (Bank and Credit
       Company) (Optional) You are allowed to share your JomCheck report with other
       banks or credit companies by ticking the checkbox until {date d30 > dd-mm-yyyy}"
       `[from SharePoint TS #010 EAINT-10937, sheet E2E, row 18]`.
    2. Ticking a company shows a [Share] button `[… row 6]`.
    3. No credit companies configured → section not displayed `[… row 15]`.
    4. Revoking the UCD's sharing permission hides the section, also after a failed payment
       `[from SharePoint TS #010 EAINT-10937, sheet Checkbox Behaviour (Special TS), rows 5-7]`.

---

## 6. Insurance

### 6.1 Quote sequence (control sequence)

1. Generic rules `[from SharePoint TS #060 EAINT-8467, sheet Insurance Sequence TS]`:
   1. Quotes page shows "the Top 2 of available insurance providers" `[row 4]`.
   2. Timestamp "Quotation retrieved on: DD/MM/YYYY, HH:MMam/pm" at the bottom; a
      disclaimer top right `[row 4]`.
   3. Changing postcode, transmission/variant, going Back or changing Sum Insured
      keeps the same order `[rows 5, 7, 9]`.
2. "Takaful - Comprehensive & TPFT is counted as one insurance", so "top 2" can show
   three cards, e.g. "1. Takaful (Comprehensive) 2. Takaful (TPFT) 3. Chubb"
   `[from SharePoint TS #110 EAINT-9713, sheet Get Free Quote Sequence TS, meta row 2 and row 4]`.
3. A hire purchase whose name contains "Islamic" uses the Islamic sequence
   `[from SharePoint TS #069 EAINT-8595, sheet Insurance Sequence TS, meta row 2]`; the
   list of Islamic HP names is in sheet "Islamic Hire Purchase" of the same workbook.
4. Company category gets Chubb (and Takaful) quotes only: "company will only have
   Chubb quotation" `[from SharePoint TS #088 EAINT-9023, sheet Sheet1, row 9]`;
   "company will only have Chubb & Takaful" `[from SharePoint TS #102 EAINT-9564, sheet Sequence control, row 14]`.
5. Get Free Quote without an approved eSTM shows all insurers
   `[from SharePoint TS #088 EAINT-9023, sheet Sheet1, row 14]`.
6. X-Star (hire purchase tagged to X STAR TECHNOLOGY MALAYSIA SDN BHD): "Confirmed with
   BA for XStar there is no specific sequence"
   `[from SharePoint TS #102 EAINT-9564, sheet Sequence control, row 13]`.
7. East Coast UCDs have their own sequence (EAINT-9564): after eSTM, top 2 "Syarikat
   Takaful Malaysia (Third Party, Fire & Theft (TFT)) … Syarikat Takaful Malaysia
   (Comprehensive)" `[from SharePoint TS #102 EAINT-9564, sheet Sequence control, row 9]`.
8. BO Insurance Quote Enquiry: "ALL insurance quotations will be displayed, but they
   may not follow the same priority sequence as shown in the UCD"
   `[from SharePoint TS #124 EAINT-9214, sheet Takaful UI changes, row 13]`.
9. Tokio Marine (car) is hidden from July 2026; Tokio Marine still shows for
   motorcycles `[from SharePoint TS #025 EAINT-11977 & EAINT-12020, sheet Sheet1, rows 6-9]`.
10. The exact insurer order is campaign-specific and changes every few months; take it
    from the newest CR, not from this list.

### 6.2 Sum insured and price range

1. Chubb, no X-Star HP, vehicle ≤10 years: "The lowest price in the pricing range
   should NOT be lower than 90% of the recommended price … NOT be higher than 140%"
   `[from SharePoint TS #004 EAINT-10044, sheet New Transactions, row 6]`.
2. Chubb with X-Star HP, ≤15 years: ceiling 170% `[… row 33]`.
3. Chubb before EAINT-10044 (regression): ceiling 110%
   `[from SharePoint TS #004 EAINT-10044, sheet Regression Testing, row 16]`.
4. Floor: "For recommended Sum Insured: - < RM10,000, the Chubb Quotation SHOULD NOT be
   displayed. - = RM10,000, other options less than RM10,000 SHOULD NOT be displayed."
   `[from SharePoint TS #004 EAINT-10044, sheet New Transactions, row 19]`; same for
   Lonpac `[from SharePoint TS #009 EAINT-10435, sheet New Transactions, row 28]`.
5. RM80,000 cap on Get Free Quote applies to non-X-Star HP vehicles; not capped
   otherwise `[from SharePoint TS #004 EAINT-10044, sheet New Transactions, rows 18, 29]`.
6. Over the age limit: "The Sum Insured dropdown becomes an uneditable textfield"
   `[… row 20]`.
7. Postcode change: "System refreshes quotation. 2. Recommended price and price range
   update based on postcode" `[… row 8]`.
8. Lonpac rounding: minimum "ISM - (ISM × 10%) → round up to nearest 1,000 Example: RM
   25,300 - RM 2,530 = RM 22,770 → RM 23,000"
   `[from SharePoint TS #009 EAINT-10435, sheet New Trxns (Scoped Down TS), row 6]`.
   Lonpac X-Star ceiling 150% `[from SharePoint TS #009 EAINT-10435, sheet Existing Transactions, row 5]`.
9. Lonpac regression: price range must equal the min and max returned by the Lonpac API
   `[from SharePoint TS #004 EAINT-10044, sheet Regression Testing, row 6]`.
10. After an insurance is bought, the same vehicle through Get Free Quote: "UCD cannot
    get Insurance Quotation" `[from SharePoint TS #004 EAINT-10044, sheet New Transactions, row 41]`.
11. Selected sum insured and price must carry to Step 4, UCD Insurance Trx Listing, BO
    Insurance Trx Listing CSV, CIBO Insurance Trx Listing, Service Portal Insurance tab
    `[… row 13]`.

### 6.3 Quotation inputs and API

1. Get Free Quote IC: empty "This field is required"; short "IC number should be made
   up of 12 numerical characters"; bad month/day "Invalid IC Number"; non-digits
   auto-cleared; max 12 digits `[from SharePoint TS #015 EAINT-11540, sheet Sheet1, rows 4-11]`.
   Company Reg No: 12 alphanumeric, special characters allowed, auto-capitalised
   `[… rows 12-16]`.
2. Chubb TIN No (EAINT-9641): mandatory after eSTM approval ("This field is required");
   optional on Get Free Quote; not displayed on the VEL000069E path
   `[from SharePoint TS #108 EAINT-9641, sheet Sheet1, rows 3, 5, 6]`.
3. Price re-check before payment (EAINT-9611): if the insurer price changed, popup
   "Price has changed. Click OK to reload and view the updated pricing" with [OK]
   `[from SharePoint TS #105 EAINT-9611, sheet Gross Premium change TS - eSIM, row 5]`.
   Paying a day later moves the policy start: "The start date of the Period of
   Insurance is set to the payment date" `[from SharePoint TS #105 EAINT-9611, sheet Date Change TS - Insurance API, row 4]`.
4. Chubb product naming after EAINT-9141 (outdated script): "COMPREHENSIVE to PRIVATE
   CAR (ENHANCED)", add-on "MY Car Plus (Pro): RM100.00", "Excess: RM 0.00", All Drivers
   pre-selected `[from SharePoint TS #092 EAINT-9141, sheet UI Change (Insurance Quotation), rows 6, 10-11]`.
   Older insurance statuses Pending Payment, Failed, Quotation, Pending Approval "will
   all display "Quotation Expired" status after CR deployment"
   `[from SharePoint TS #092 EAINT-9141, sheet E2E Flow (TY), row 12]`.
5. RHB maintenance message on payment failure: "Error Code: NP - Sistem Pembayaran RHB
   dibawah penyelengaraan antara 10.30mlm - 8.30pg."
   `[from SharePoint TS #092 EAINT-9141, sheet UI Change (Insurance Quotation), row 20]`.

### 6.4 Insurance documents and wording

1. **Official Receipt (EAINT-6673).** New transactions: button [Receipt], file
   "Receipt_VehicleNo.pdf"; transactions before the change keep [Insurance Invoice] and
   "Invoice.pdf" `[from SharePoint TS #051 EAINT-6673, sheet E2E TS, rows 4, 12]`.
   Receipt number "OR-{MMYY}-{0001}"; payment reference "{YYMMDD}0120{0001}-{VN}"
   `[from SharePoint TS #125 EAINT-6673 [OUTDATED], sheet Official Receipt, rows 10-12]`.
   Values uppercase; address "No comma between Postcode & City - ONLY one comma at the
   end of each line"; vehicle number "With space between alphabet and number"
   `[from SharePoint TS #125 EAINT-6673 [OUTDATED], sheet Functional Test Scenarios, rows 14, 21]`.
2. **Takaful wording (EAINT-9215).** "Motor Insurance or Takaful", page title
   "INSURANCE OR TAKAFUL", button "INSURANCE OR TAKAFUL TRANSACTION LISTING", "UPDATE
   INSURANCE OR TAKAFUL PERMISSION" `[from SharePoint TS #095 EAINT-9215, sheet Insurance Homepage, rows 4-7]`.
   Takaful cards say "Sum Covered - Takaful Contribution - Contribution after NCD"
   `[from SharePoint TS #095 EAINT-9215, sheet UI - Insurance Purchase, row 6]`; Step 2
   "Syarikat Takaful Malaysia Am Berhad (1246486-D)", "Period of Takaful" `[… row 14]`.
3. **PDS (EAINT-8786).** PDS available in English and BM, opening in a new tab, latest
   version `[from SharePoint TS #085 EAINT-8786, sheet EAINT-8786 - UCD eAuto, row 3]`;
   the Takaful confirmation email ZIP includes the latest PDS `[… row 14]`.
4. **Hire purchase fields (EAINT-9617).** Details show "Hire Purchase: (User
   Submission)" and, when JPJ returns STMS 4K, "Hire Purchase: (Returned by JPJ)"; the
   e-Cert shows "HIRE PURCHASE OWNERS" `[from SharePoint TS #107 EAINT-9617, sheet E2E Scenarios, row 3]`;
   CIBO shows "Hire Purchase: (Claimed by)" `[… row 6]`. An X-Star eSTM sets the field to
   "X STAR TECHNOLOGY MALAYSIA SDN. BHD." `[… row 17]`.
5. **BO Insurance Quote Enquiries columns (EAINT-9615):** "1. # 2. UCD Company Name 3. UCD
   User Name 4. Created Date 5. Insured ID 6. Vehicle No. 7. Vehicle Make 8. Vehicle Model
   9. Variant (Series) 10. Vehicle Manufacturing Year 11. Inquiry Source 12. Remarks"
   then the insurer columns `[from SharePoint TS #106 EAINT-9615, sheet Test Scenario, row 2]`.

### 6.5 Insurance notifications

1. **Monthly commission (EAINT-10082).** WhatsApp and email to the UCD on "the 2nd day of
   every month"; WhatsApp text "Hi {UCD Company}, your monthly commission summary for
   eAuto Insurance is available." `[from SharePoint TS #006 EAINT-10082, sheet EAINT-10082, row 4]`;
   email subject "eAuto – Monthly Commission Achievement" `[… row 5]`.
   1. A new Main Director receives it after a director change `[rows 8-9]`.
   2. Commission "0": neither sent `[rows 10-11]`.
   3. Office number: no WhatsApp, email still sent `[rows 12-13]`.
   4. Authorised users (insurance@eauto.my) receive it and see UCD replies when in CC `[rows 14-15]`.
   5. Report "automatically sent on the 3rd day of every month" in xlsx `[row 16]`.
2. **WhatsApp video on referred risk (EAINT-11867)** `[from SharePoint TS #022 EAINT-11867, sheet Sheet1]`:
   1. Referred Risk Log records before 01.06.2026 excluded `[row 2]`.
   2. Quote request goes to "All available insurers except the original failed insurer" `[row 6]`.
   3. No WhatsApp when the vehicle already has a purchase `[row 5]` or all insurers fail `[row 7]`.
   4. Car gets Car.mp4, motorcycle Motor.mp4 `[rows 9-10]`.
   5. "Exactly one WhatsApp message is sent for the record, regardless of the number of
      insurers that returned a successful quotation." `[row 13]`
   6. Only the originally referred insurer quoting → not sent
      `[from SharePoint TS #023 EAINT-11867, sheet Test Scenario v1, row 13]`.
3. **Failed cover note alert (EAINT-8536).** WhatsApp to 018-2884889: "Hi,
   {insurer_name} Insurance Transaction Failed at Cover Note Submission & Payment Paid
   Error: … Vehicle No.: {vn} Sum Insured: RM {x,xxx.xx} Premium Amount: RM {x,xxx.xx}
   Time: {dd-mm-yyyy hh:mm am/pm}" `[from SharePoint TS #065 EAINT-8536, sheet EAINT-8536, row 9]`.
   eAuto transactions are prefixed "Created from eAuto." `[… row 13]`. eSIM vehicle
   prefix VB = cover note failed, VF = JPJ signal rejected `[… rows 9-13]`.
4. **Renewal reminder (CIBO CRM, EAINT-8147).** Secarang: "Dear {owner_name}, Your
   insurance policy for vehicle {vehicle_no}({vehicle_make}) will expire on
   {dd.mm.yyyy}." `[from SharePoint TS #132 EAINT-8147, sheet EAINT-8331, 8334 & 7199, row 9]`;
   eAuto: "Dear {owner_name}, We hope you are enjoying your {vehicle_make} as you approach
   one year since your purchase from {ucd_company}. Your insurance for vehicle
   {vehicle_no} expires on {dd.mm.yyyy}." `[… row 12]`; company "Dear {company_name}" `[… row 11]`.

---

## 7. UCD homepage: popups, campaigns, banners

1. **Every bilingual campaign popup** (CNY, Hari Raya, Merdeka, TNG winners): "popup in
   English is shown first by default" and "Interval between English and Chinese is 7
   seconds" `[from SharePoint TS #005 EAINT-10053, sheet EAINT-10053, row 4]`
   `[from SharePoint TS #024 EAINT-11925, sheet EAINT-11925, row 4]`.
2. Shown once per login: "popup is not displayed whenever redirected back to Homepage"
   `[from SharePoint TS #005 EAINT-10053, sheet EAINT-10053, row 6]`; also not again on
   the Insurance module page `[from SharePoint TS #024 EAINT-11925, sheet EAINT-11925, row 9]`.
3. A campaign popup still shows for a UCD without Insurance permission; the Insurance
   module stays blocked `[from SharePoint TS #005 EAINT-10053, sheet EAINT-10053, row 7]`.
   Direct URL without permission: "Sorry, access denied"
   `[from SharePoint TS #068 EAINT-8564, sheet EAINT-8564, row 14]`.
4. Order expected by the test scripts:
   1. "Web Socket (1st) ➡️ … campaign popup (2nd)" `[from SharePoint TS #005 EAINT-10053, sheet EAINT-10053, row 8]`.
   2. "Web socket (1st) ➡️ Merdeka 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)"
      `[from SharePoint TS #024 EAINT-11925, sheet EAINT-11925, row 14]`.
   3. "East Coast popup (1st) ➡️CNY 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)"
      `[from SharePoint TS #100 EAINT-9559, sheet EAINT-9559, row 9]`.
   4. "1. Web Socket popup 2. East Coast Popup 3. CNY Campaign 4. Company Update Popup (if
      available)" `[from SharePoint TS #102 EAINT-9564, sheet Popup display, row 11]`.
   5. TNG winners popup "should be the last popup" `[from SharePoint TS #068 EAINT-8564, sheet EAINT-8564, row 8]`.
   6. **The campaign popup order is not fixed.** Which campaign popups exist, and their
      order, change with the season and the celebration. The orders above are each true
      only for their own campaign. Never assert a fixed popup order across campaigns;
      take it from the current campaign ticket. `[from Faizuddin, 2026-10-16]`
5. Campaign banners sit on the Insurance Transaction Listing with the same 7-second
   switch `[from SharePoint TS #024 EAINT-11925, sheet EAINT-11925, row 6]`.
6. East Coast popup: only for East Coast HQ or branch; "not showing EC popup on 31st
   day" `[from SharePoint TS #102 EAINT-9564, sheet Popup display, rows 4-14]`.
7. Webinar banner: "contains the webinar details, session info & QR code for
   registration"; once closed "After refresing the page, the webinar banner will not
   appear again"; not on the Insurance Details page; auto-hidden after its end date
   `[from SharePoint TS #017 EAINT-11784, sheet Sheet1, rows 3, 5, 10]`
   `[from SharePoint TS #017 EAINT-11784, sheet Sheet1 (2), rows 54-57]`.
8. **Firefox → Chrome announcement (EAINT-12180)** `[from SharePoint TS #036 EAINT-12180]`:
   1. On Firefox the popup shows after every login; the old Firefox-to-Chrome popup is
      gone `[sheet Scenario Testing, rows 3, 9]`.
   2. On Chrome it is not shown; with a pending profile update only the Company / Business
      Profile banner shows `[sheet Scenario Testing, rows 17, 21]`. AATF shows the
      ANNOUNCEMENT/PENGUMUMAN banner after closing it `[row 28]`.
   3. Title "Announcement 公告"; text "Support for Mozilla Firefox will officially end on
      31 December 2026. Effective 1 January 2027, all users are required to use Google
      Chrome when accessing the eAuto system." `[sheet Functional Testing, rows 6-7]`.
   4. Links: Installation Guide PDF opens a new tab; video opens an overlay in the same
      tab; User Guide link redirects the current tab `[sheet Functional Testing, rows 3-5]`.
9. Chrome websocket popup is the first popup after login, and websocket text shows on
   the STMS, UCD to UCD, eSTM, BMK, Insurance, Settings, Company/Business Profile, Account
   Activation and Deregistration dashboards `[from SharePoint TS #116 EAINT-9894, sheet EAINT-9894, rows 4-15]`.

---

## 8. e-Invoice and invoices

1. **Invalid or blank TIN (EAINT-8550).** Only [Invoice] is shown, with the notation
   "e-Invoices are only available for customers with a valid TIN. e-Invoices can only be
   issued for transactions within the current calendar month."
   `[from SharePoint TS #067 EAINT-8550, sheet Invalid or Blank TIN, row 3]`. Valid TIN:
   [Invoice] and [e-Invoice], notation hidden `[… row 4]`. SSM uses [SSM Invoice] /
   [SSM e-Invoice] `[… rows 7-8]`; Proforma uses [Proforma Invoice] / [e-Invoice]
   `[from SharePoint TS #067 EAINT-8550, sheet New Transactions (e-Invoice), row 13]`.
2. When one part of a bundle fails (e.g. STMS final submission failed, TH OK), the
   invoice "contains only TH details" `[from SharePoint TS #067 EAINT-8550, sheet New Transactions (e-Invoice), row 16]`.
3. **Document Code** runs in sequence "without any skipping of running number", across
   STMS, TH, SSM, eSTM, APT, JomCheck, Pre e-Invoice SSM, Proforma, Dereg, BMK, including
   transactions whose e-Invoice failed `[from SharePoint TS #076 EAINT-8659, sheet Sheet1, rows 2-11]`.
4. **eDereg Pre-Checking e-Invoice (EAINT-8655/9043)** `[from SharePoint TS #075 EAINT-8655 & 9043, sheet E2E Flow]`:
   1. Valid TIN: AATF "e-Invoice Status = OK", BO "LHDN Response Status = OK", [e-Invoice] and [Invoice] `[row 3]`.
   2. Invalid TIN: both "Failed", remark "TIN verification failed. Kindly provide correct
      TIN information to eAuto customer service.", [Invoice] only `[row 4]`.
   3. Cancelled or failed payment: status "-", no documents `[row 5]`.
   4. An LHDN resubmission cronjob picks up failed rows after the TIN is corrected `[rows 12-13]`.
5. **e-Invoice buyer block** `[from SharePoint TS #075 EAINT-8655 & 9043, sheet Functional Testing (e-Invoice)]`:
   blank SST number prints "n/a" `[row 9]`; blank e-Invoice PIC contact falls back to the
   company contact number `[row 12]`; blank PIC email falls back to the Director/Owner
   email `[row 14]`; vehicle number printed with spaces, "WU 4444", "WUU 1234 D",
   "PUTRAJAYA 12" `[rows 15-17]`.
6. **e-Invoice template** fields (per module): e-Invoice Type, Version, Document Code,
   UIN, Submission Date, Validation Date, Currency Code, Payment Reference No., Original
   Invoice UIN, Supplier block, Buyer block incl. Vehicle Number (Buyer), Classification,
   Description, Quantity, Unit Price, Amount, Tax Type, Tax Rate, Tax Amount, Signature
   `[from SharePoint TS #056 EAINT-7548, sheet e-Invoice (New) Template (STMS), rows 5-45]`.
7. TIN on Pre-Application: a TIN that does not match the BRN shows "The TIN is invalid.
   This may affect e-Invoice submission. Click "Next" to proceed." and lets the user
   continue on the second Next `[from SharePoint TS #048 EAINT-5972, 10164 & 11763, sheet EAINT-5972, row 23]`.

---

## 9. Payment documents and reports (UCD, AATF)

1. **UCD Payment Report (EAINT-7495)** `[from SharePoint TS #054 EAINT-7495, sheet Filter]`:
   1. Payment Date defaults to today; future dates disabled; "end range will be limited
      to a maximum period of 30 days" `[rows 2-4]`.
   2. Company Name default "All" `[row 5]`; Transaction Type All, STMS, APT, eSTM,
      Transfer History, BMK, eLKM, eVOC, SSM, JomCheck `[row 8]`; Payment Status and
      Transaction Status All, Pending, Approved, Failed `[rows 10, 12]`.
   3. Export file "Payment_Report_{Date Generated}_{Time Generated} e.g:
      Payment_Report_16042026_10_23_AM" `[row 14]`.
   4. No records → Export downloads nothing `[from SharePoint TS #054 EAINT-7495, sheet E2E, row 3]`.
   5. Fields that do not apply show " - " (SSM: Engine No, Chassis No, Make, Model, Year)
      `[from SharePoint TS #054 EAINT-7495, sheet E2E, row 8]`.
2. **AATF Payment Report (EAINT-9715)**: same 30-day rule; types "All - DEREG -
   Deregistration - eDereg Pre- Checking"; export "AATF_Payment_Report_{Date
   Generated}_{Time Generated}" `[from SharePoint TS #111 EAINT-9715, sheet Filter, rows 4, 6, 12]`.
3. **Download Payment Document (EAINT-7496)** `[from SharePoint TS #055 EAINT-7496]`:
   1. Payment Month defaults to the current month; Payment Year lists past years up to
      the current one `[sheet Filter, rows 2-3]`.
   2. "UCD can only multiple select STMS,APT,eSTM (red colour) as a group while the green
      becomes disabled. OR multiple select on the green ones" `[sheet Filter, row 4]`.
   3. Results list each week of the month with a Download link; blank if no
      transaction `[sheet Filter, row 5]`; "UCD can only download payment document for
      past weeks. Current & future weeks are unavailable" (remark, sheet EAINT-7496 - Scenario, row 3).
   4. Zip "payment_documents_{UCD_Company_ID}_YYYY-MM-DD_to_YYYY-MM-DD"; each PDF
      "{Document_Code}_{Transcation_Type}_{Type_of_Invoice}.pdf e.g:
      EA-IV-0426-0000528_eSTM_e-Invoice" `[sheet EAINT-7496 - Scenario, rows 6-7]`.
   5. "Confirmed: Only Invoice & e-Invoice to be downloaded for EVERY Transaction Type"
      (remark, row 7).
   6. The earlier EAINT-8514 zip name was "{UCD Company ID}-YYYYMMDD-YYYYMMDD"
      `[from SharePoint TS #061 EAINT-8514, sheet EAINT-8514 Test Scenarios, row 3]` —
      superseded by 3.4.
4. **Payment Breakdown Reports (EAINT-3090).** Types "All - STMS - APT - eSTM - Transfer
   History - BMK - eLKM - eVOC - SSM - Jom Check"; dates default today; "The date that
   exceeds 1 month than the Payment Date From field is disabled"; PDF and Excel
   `[from SharePoint TS #044 EAINT-3090, sheet EAINT-3090 Test Scenarios, rows 3-8]`.
   Header block "Nama Syarikat, No. Daftar Perniagaan, Alamat, Agensi" `[… row 11]`. JPJ
   and FIS columns with no amount show " - " `[from SharePoint TS #044 EAINT-3090, sheet Sheet1, row 4]`.

---

## 10. BackOffice: accounts, permissions, audit

1. **Company account field validation (EAINT-8774)** `[from SharePoint TS #083 EAINT-8774, sheet Sheet1]`:
   1. Postcode: "Postcode is required."; digits only, exactly 5; "Postcode must be 5
      digits only." `[rows 4-5]`.
   2. Mailing address: "Mailing address is required."; max 300 characters `[rows 6-7]`.
   3. Director/Owner Name: "Director / Owner Name is required."; letters, digits and only
      "Apostrophe (') ii. Slash (/) iii. Dot (.) iv. Comma (,) v. Colon (:) vi. Dash (-)
      vii. Ampersat (@)"; auto-capitalised; max 100 `[rows 8-9]`.
   4. Director/Owner email: "Director / Owner Email Address is required."; prefix allows
      a–z, 0–9, dot, underscore, hyphen; max 100 `[rows 10-11]`.
2. **Decision Maker and Showroom fields** (EAINT-8644/8645 UCD companies; EAINT-8773/8742
   AATF/PBT) — Name auto-uppercase, trims leading/trailing spaces, removes Chinese
   characters, max 100; Contact No digits only `[from SharePoint TS #074 EAINT-8644 & 8645, sheet EAINT-8644 (FUNC), rows 5-17]`.
   Allowed special characters differ — see Contradictions.
3. Company Confirmation of Registration shows Showroom Address/City/Postcode/State below
   "State"; all empty → fields hidden `[from SharePoint TS #074 EAINT-8644 & 8645, sheet EAINT-8644 (COR), rows 4, 6]`.
4. Company CSV export: Decision Maker Name/Contact/Email "between 'State' and 'UCD Vehicle
   Type'"; Showroom fields "between 'e-Invoice PIC Email' and 'Director Name'"; empty =
   " - "; export writes an audit log `[from SharePoint TS #074 EAINT-8644 & 8645, sheet EAINT-8645, rows 3-5]`.
   Names containing commas stay in one CSV column `[from SharePoint TS #084 EAINT-8781, sheet 8735, row 9]`.
5. Decision Maker filters on Company and AATF/PBT listings default blank and match
   partially; several filters combine with AND `[from SharePoint TS #084 EAINT-8781, sheet 8781, rows 10, 14, 24]`.
6. **Company audit log (EAINT-6762).** Entries read "[SSM Permission] Old: Unticked New:
   Ticked", "[ESTM SSM Permission]", "[Bypass Purchase SSM Permission]", "[eLKM
   Permission]", "[eLKM Permission - Max. Authorized User] Old: 2 New: 10", "[ESTM
   Permission - Max. Authorized User]", "[Company Name]", "[TIN Number]", "[Transaction
   Restriction]" `[from SharePoint TS #052 EAINT-6762, sheet Company Account Audit Log, rows 10-30]`;
   changes must never be logged under another company `[… row 8]`; entry names "Create
   New Company" and "Update Company Information" `[from SharePoint TS #052 EAINT-6762, sheet Concurrent Update or Create, rows 8, 10]`.
7. **Transaction Restriction (EAINT-9044)** `[from SharePoint TS #089 EAINT-9044]`:
   1. Setting "Transaction Restriction: ◎ Yes ◉ No (default)" below Block STMS Category
      `[sheet (FT) BO Update Company Account, row 3]`; existing companies default No after deploy `[row 11]`.
   2. Restricted UCD sees "Title: Notice Content: You are currently restricted from
      creating transactions. Please contact eAuto at 03-27798899." when creating a
      transaction or submitting from a listing, on STMS, eSTM, APT, UCD to UCD, BMK,
      Insurance (Get Free Quote) and JomCheck `[sheet E2E Scenarios - eSTM, row 2]`
      (STMS wording "restricted from performing transactions" `[sheet E2E Scenarios - STMS, row 2]`).
   3. Steps inside an existing transaction carry on normally ("Can proceed with normal
      flow") `[sheet E2E Scenarios - STMS, row 11]` `[sheet E2E Scenarios - BMK, row 5]`.
   4. Listing filter "Transaction Restriction" right of Business Type, options All
      (default), Yes, No; CSV follows the filter `[sheet (SnF) BO Manage Company Account, rows 3-5]`.
   5. BO users without the permission "can see but unable to access" the setting
      `[sheet (FT) BO Update Company Account, row 19]`.
8. **Default permissions on a new company (EAINT-9233):** "eSTM Permission ( 1 layer
   Permission) - 10 - Insurance Permission - 6 - BMK Permission - Transfer History
   Permission - eLKM Permission - 10" ticked by default `[from SharePoint TS #096 EAINT-9233, sheet EAINT-9233, row 6]`.
9. **Bank/Credit Company account checkboxes (EAINT-11175):** "Allow UCD to share JomCheck
   Report", "Allow Login to Service Portal", "Allow Bypass Whitelisting Feature", placed
   below "Full Enquiry Permission"; defaults "Full enquiry permission - ticked … Allow UCD
   to share JomCheck Report - unticked … Allow Login to Service Portal - ticked … Allow
   Bypass Whitelisting Feature - unticked"; non-authorised BO users see them disabled
   `[from SharePoint TS #012 EAINT-11175, sheet Sheet1, rows 4-6, 17]`.
10. **Super Admin vs Hub Admin (EAINT-10038):** inactive BO user login shows "Unable to
    login. Please contact your supervisor or admin." `[from SharePoint TS #003 EAINT-10038, sheet Test Scenario, row 8]`.
    Menus only Super Admin sees include Company Account Listing (Limited Features For UCD
    To UCD), Manage AATF/PBT Account, JPJ Reports, Account Balance Summary, Statement of
    Account (UCD), Transaction Summary Report `[from SharePoint TS #003 EAINT-10038, sheet access ref, rows 11-23]`.
11. **MVD Agreement (EAINT-11499):** CSE sees the UCD version with no thumbprint,
    read-only, cannot download; authorised users download the version with MyKad picture
    and thumbprint; others do not see the button
    `[from SharePoint TS #013 EAINT-11499, sheet Test Scenario, rows 2, 7, 8]`.
12. **Proforma Invoice payment slip (EAINT-8538)** `[from SharePoint TS #066 EAINT-8538, sheet Functional & Scenario Testing]`:
    slip optional `[row 3]`; ≤5MB, else "File size exceeded." `[rows 4-5]`; PDF/JPEG/PNG,
    else "Invalid file type." `[rows 6-7]` (the script lists "jpg" as not accepted while
    "jpeg" is accepted); max 5 files, [Browse Files...] disabled at 5 `[rows 9-10]`;
    confirm "Sure to update?" then "Proforma Invoice updated successfully." `[rows 19-20]`;
    unsaved uploads clear on refresh `[row 23]`; Remarks up to 2,000 characters `[row 25]`.
    Finance users view only: "No payment slip found." `[from SharePoint TS #066 EAINT-8538, sheet Role Testing, row 6]`.

---

## 11. BackOffice: reconciliation and JPJ reports

1. **Reconciliation amounts** (eAuto fee / listing incl. 8% / JPJ fee): STMS 20.00 /
   21.60 / 10.00; APT 15.00 / 16.20 / 100.00; eSTM 35.00 / 37.80 / 300.00; SSM 18.00 /
   19.44; Dereg 35.00 / 37.80; eDereg Pre-Checking 5.00 / 5.40; BMK 10.00 / 10.80 / 20.00;
   TH 10.00 / 10.80 / 10.00; eLKM 2.75 / 2.97 / "Price in e-Sim"; eVOC 10.00 / 10.80
   `[from SharePoint TS #008 EAINT-10168, sheet Amount (RM), rows 3-12]` (dated; APT and
   STMS have since changed, §1).
2. Modules reconciled: STMS, APT, eSTM, SSM, Dereg, eDereg Pre-Checking, BMK, TH, eLKM,
   eVOC, JomCheck, Insurance, Wholesale-STMS `[from SharePoint TS #008 EAINT-10168, sheet eAuto = RHB, rows 4-16]`.
3. Finance uploads the RHB file to Synology; auto-reconciliation runs at 10am and 12pm:
   "At 12pm, system will pick up the RHB transactions uploaded after 10am as there's no
   reconciliation yet happened at 10am" `[from SharePoint TS #008 EAINT-10168, sheet Special Scenarios, row 11]`.
4. "Payment made on weekends and/or public holiday will be reconciliated according to its
   payment date" `[… row 10]`. One RHB file spanning several dates is split per payment
   date and per month `[from SharePoint TS #008 EAINT-10168, sheet EAINT-11883, rows 3, 6]`.
5. A date with discrepancies goes to the Reconciliation Listing and "is NOT auto-submitted
   to JPJ Hasil"; other dates in the same file still reconcile `[from SharePoint TS #008 EAINT-10168, sheet EAINT-11883, row 4]`.
   A date missing from the file shows "No records found" `[… row 5]`.
6. Filters: "Please select both Payment Date (From) and Payment Date (To)."; selecting From
   auto-fills To with the last day of that month; future dates disabled; To cannot be
   before From `[from SharePoint TS #008 EAINT-10168, sheet S&F – Access & Filter, rows 6-12]`.
7. Insurance user (EAINT-11887): only the Insurance transaction type, Summary section
   hidden; Hub Admin with permission sees all types and Summary; without permission the
   module is hidden including by direct URL; under JPJ Reports only "eAuto Reconciliation
   Summary Listing" shows `[from SharePoint TS #008 EAINT-10168, sheet EAINT-11887, meta rows 4-18 and row 28]`.
8. **Resubmission exclusion (EAINT-12055).** "Payment OK and resubmission approved on
   different dates (same month) → mismatch pair excluded from listing after match"; same
   across months `[from SharePoint TS #029 EAINT-12055, sheet New Transaction, rows 4, 17]`;
   retroactive for payments made before the deploy `[from SharePoint TS #029 EAINT-12055, sheet Existing Transaction, row 4]`;
   stays hidden after an RHB re-upload `[from SharePoint TS #029 EAINT-12055, sheet Special Scenarios, row 5]`.
   Still visible: "JPJ Final Submission FAILED but RHB Payment completed" and "JPJ Final
   Submission APPROVED but RHB Payment not received/failed" `[from SharePoint TS #029 EAINT-12055, sheet Regression, rows 17, 20]`.
9. JomCheck, SSM and Insurance approved two days after payment are listed under their
   Approved Date `[from SharePoint TS #032 EAINT-12113, sheet TS - EAINT-12113, rows 4, 6, 8]`.
10. **RHB statement references** (sample statement, "ETUKARMILIK CR"): Reference 1
    "{TransactionNo}-{VehicleNo}"; Reference 2 "{TransactionNo}/{code}" with codes STMS,
    JCK (JomCheck, numbers start "JOM"), OTH (Transfer History, "TH"), DPC (eDereg
    Pre-Checking, "DPC") `[from SharePoint TS #123 RHB 25.06.2026 2, sheet Bank Statement, rows 7-14]`.
11. **JPJ Monthly Report cronjob (EAINT-639):** "Cron runs automatically on the 1st at
    3:00 AM"; approved count = TRANSAKSI and JPJ fees = Hasil JPJ (RM), both equal to BO;
    emailed link, permission-gated and expiring `[from SharePoint TS #049 EAINT-639, sheet Sheet1, rows 3-12]`.
12. **JPJ Official Receipt number (EAINT-9642):** column "NO. RESIT JPJ" in the JPJ Reports
    listings and exports (STMS/APT/eSTM; BMK/HTM/eLKM; eDereg Pre-Checking)
    `[from SharePoint TS #109 EAINT-9642, sheet JPJ Reports, rows 4-13]`; "NO. RESIT" in
    JPJ Hasil listings `[from SharePoint TS #109 EAINT-9642, sheet JPJ Hasil, rows 4-13]`.
13. **Onboarding (Fiuu) payments are not reconciled today.** Jira description row 4:
    "Fiuu transactions fall under the "Other" category and are not reconciled in the
    Reconcile Summary listing." / "Reconciliation is performed manually."
    `[from ticket EAINT-12336, Jira description row 4, captured 2026-10-27]` `[source: pipeline EAINT-12336, Scout study, 2026-10-27]`
14. **Planned (no SRD) — onboarding reconciliation (EAINT-12336, Fiuu onboarding recon CR):**
    "The system shall match records with Transaction Status "Approved" and Registration Fee
    "OK" against the transaction list from the Fiuu listing." / "The Transaction ID is
    available in the Excel file downloaded from that portal." / "Reconciliation shall be
    performed on the same page as the current reconciliation." Scope: "covering both
    pre-application and application". Fiuu feasibility "not yet confirmed" (row 6).
    `[from ticket EAINT-12336, Jira description rows 3, 5, 6, captured 2026-10-27]` [unconfirmed: planned, may change once an SRD exists]
15. **Cross-month resubmission exclusion was never executed** (item 8, EAINT-12055 —
    resubmission exclusion): "Cross-month (SRD §2.2.4 item 2) was never executed." All
    rows NEW_RECONLS_TS13–TS24 are "N/A". `[_reference/tickets/EAINT-12055/EAINT-12055-qa-team-ts-study.md:132]` `[source: pipeline EAINT-12336, Scribe related history, 2026-10-27]`

---

## 12. Pre-Application and Application (dealer onboarding)

1. **Type of Business (EAINT-5972).** SSM Registered: "Sdn Bhd / Bhd - Sole
   Proprietorship / Partnership - LLP"; Non-SSM Registered: "Business Trading (Sabah) -
   Business Trading (Sarawak)" `[from SharePoint TS #048 EAINT-5972, 10164 & 11763, sheet EAINT-5972, row 3]`.
   SSM types show Old BRN and New BRN (either one is enough) `[rows 4, 7-9]`; Non-SSM show
   "Business Trading License No" and a Trading License upload `[row 5]`. Empty fields:
   "This field is required" `[rows 10-12]`.
2. **UCD Group (EAINT-10164).** Assignee picks one of "Corporate, Association, Authorised
   Dealer, UCD, Motor, Recon" before Submit for Approval; required; hidden after submit;
   pre-filled and locked on Create New Company `[from SharePoint TS #048 EAINT-5972, 10164 & 11763, sheet EAINT-10164, rows 3-8]`.
   BO Company listing column "UCD Group" between "Company Type" and "Block STMS
   Transaction"; "-" when none `[rows 20, 28]`.
3. **ROC directors (EAINT-11763):** number and names "auto selected & auto populated
   respectively based on director(s) data from SSM Document"
   `[from SharePoint TS #048 EAINT-5972, 10164 & 11763, sheet EAINT-11763, row 3]`.
4. **Approved Date / TAT columns (EAINT-11536):** format "DD MMM YYYY HH:MM AM/PM (e.g. 3
   Dec 2025 1:02 PM)"; "TAT = Approval Date - Submission Date"; "-" while not approved or
   rejected `[from SharePoint TS #014 EAINT-11536, sheet EAINT-11536, rows 4, 12-13, 17]`.
5. **Application expiry cronjob (EAINT-11829):** "Cronjob updates Application Status to
   "Expired" after 90 days - Application Status = Expired - Expired email notification
   received - OB link → Application Link Expired popup displayed → Redirect to Application
   Link Expired page" `[from SharePoint TS #014 EAINT-11536, sheet EAINT-11829, row 3]`;
   already Expired → no second email `[row 11]`; Rejected stays Rejected and Approved stays
   Approved, no expiry email, link opens Application Payment Success `[rows 13-14]`.
6. **Showroom edit (EAINT-11978):** Application pre-fills Showroom Address, Postcode,
   State, City from the Pre-Application; UCD cannot pick "No Showroom", BO can; editable
   in Pending, KIV, Revise; "If status = Pending Approver, cannot do any changes";
   Pre-Application record unchanged `[from SharePoint TS #027 EAINT-11978, sheet Test Script, rows 2-9]`.
7. **No [Verify] step (EAINT-11979):** "[Activate] is disabled/unavailable until [Save] is
   completed"; accounts are created with Save > Activate only
   `[from SharePoint TS #028 EAINT-11979, sheet Test Script, row 2]`.
8. **Approval emails (EAINT-12341)** `[from SharePoint TS #041 EAINT-12341, sheet Sheet1]`:
   1. "Trigger | Application approval only. Pre-Application approval is not a trigger" `[meta row 5]`.
   2. UCD receives the RHB Account Registration Guideline email, CC apply@eauto.my,
      subject "RHB Online Account Opening - [Application No] - [Company Name]" or "RHB
      Branch Account Opening - …" `[rows 13-14]`.
   3. A foreign director (Sdn Bhd) or non-Malaysian partner (LLP) gets Email Template 2 `[rows 21, 26]`.
   4. RHB Support receives the Appointment Letter email, To BIS.Support@rhbgroup.com, CC
      the UCD email and apply@eauto.my, subject "Approved eAuto Registration - [Company
      Name] - [BRN Number]", letter attached `[rows 30-32]`.
   5. "The existing approved application email carrying the 3 RHB documents (Offer
      Letter, Direct Debit Application form, Board of Resolution) is no longer sent" `[row 36]`.
9. **RHB Offer Letter sample in the onboarding email (EAINT-12219):** Sdn Bhd/ROC "S1.1
   RHB Sdn Bhd OL with BOD Reso Reflex Cash Management Application.pdf"; ROB "S1.1 RHB
   Enterprise OL with Checklist.pdf"; numbering S1.1, S1.2 … unchanged
   `[from SharePoint TS #037 EAINT-12219, sheet Test Scenarios, rows 2-3, 7]`.

---

## 13. AATF and eDereg

1. eDereg Pre-Checking needs an approved pre-check within 6 months: "This vehicle is
   allowed to create eDereg Transaction" (green) or "Approved eDereg Pre-Checking within
   6 months is required to proceed" `[from SharePoint TS #098 EAINT-9306, sheet E2E, rows 3-4]`
   (full flow: [flow-edereg.md](flow-edereg.md)).
2. eSIM vehicle numbers used: GLB000000I success; VEL000100E failed; ENF000013E
   cancelled; VEL000102E final submission failed
   `[from SharePoint TS #075 EAINT-8655 & 9043, sheet E2E Flow, rows 3-9]`.
3. AATF/PBT Decision Maker Name allows only ' / . , : - @; Contact and Email optional
   `[from SharePoint TS #082 EAINT-8773, sheet 8773, rows 14-18]`.
4. Thumbprint pages (AATF): Dereg Step 1 Owner ("Please use Owner's MyKad."), Step 3 AATF
   ("Please use login user's MyKad"), Upload COD Step 1, Manage Users add/update, Create
   New AATF Company Account `[from SharePoint TS #121 List of Modules and Pages that requires Thumbprint (UCD & AATF), sheet AATF, rows 3-15]`.

---

## 14. Service Portal (bank and credit companies)

1. Listings on the portal: Ownership Claim Enquiry, Hire Purchase Record Creation
   Listing, JomCheck Report Listing `[from SharePoint TS #010 EAINT-10937, sheet Functional Testing (S&F), row 3]`.
2. Date range mandatory: "Please select From Date and To Date."; also "Please select To
   Date." / "Please select From Date."; max one month; To not before From
   `[from SharePoint TS #119 EAINT-9951, sheet Functional TS, rows 3, 38-41]`.
3. Hire Purchase Record Creation Listing (EAUTO SDN BHD users): partial match on Credit
   Company Name, Dealer Company Name, New BRN, Vehicle Number, Owner IC; Chinese
   characters removed; Record Status Active, Expired, Complete, Inactive, "B" (Insurance
   BER case), "T" (Insurance TL case); eSTM status Approved or "-" (not tagged)
   `[from SharePoint TS #119 EAINT-9951, sheet Functional TS, rows 4-58]`. The link shows
   only for EAUTO SDN BHD users `[from SharePoint TS #119 EAINT-9951, sheet Permission TS, rows 3, 7]`.
4. eSTM listing columns: 'Jom Check' right of 'eSTM approved date' showing "Yes";
   'Insurance' column after it `[from SharePoint TS #091 EAINT-9103, sheet E2E Flow (Azfar), row 3]`.
5. Bulk download: "[Download files (n)] with file name eauto_service_portal.zip", one
   folder per transaction "{VehicleNo}_{BuyerID}" `[… row 4]`; BBHM file
   "Butir_{VehicleNo}.pdf" `[from SharePoint TS #091 EAINT-9103, sheet E2E Flow (latest changes), row 6]`.
6. Insurance tab download button by insurer: "Chubb & Tokio Marine > Download Policy -
   Takaful > Download E-Certificate - Lonpac > Certificate Of Insurance + Policy S…"
   `[… row 8]`.
7. JomCheck and insurance records appear for a credit company only when the UCD and
   vehicle plate match the eSTM shown on the portal `[from SharePoint TS #091 EAINT-9103, sheet Overall Progress, rows 16-17]`.

---

## 15. Biometric device, browser, installer

1. Dermalog messages `[from SharePoint TS #053 EAINT-7229]`:
   1. No device: "Please plug in Dermalog Biometric Device and click [Reconnect]" `[sheet Dermalog TS, row 10]`.
   2. Unplugged while reading: "Unable to read photo. Please try again." `[row 12]`.
   3. No card: "No card is detected. Please insert IC and click [Scan IC] to try again." `[sheet MyKad TS, row 11]`.
   4. After a good read: "Place Thumb on reader" `[sheet Dermalog TS, row 13]`.
2. Installer v2 (EAINT-9944, on hold per BA 16/04/2026): button "Dermalog Biometric
   Software Upgrade v2"; with v1 installed on a gated page: "Update Required Please
   update the Dermalog Biometric Device to the latest version…"
   `[from SharePoint TS #117 EAINT-9944, sheet UCD & AATF, row 3]` `[from SharePoint TS #117 EAINT-9944, sheet Version Check, row 3]`.
3. Applet certificate CRs are tested with "one happy flow ONLY" per module, on both Java 7
   and Java 8 `[from SharePoint TS #103 EAINT-9590, sheet High Level Test Scope, row 3]`.
4. UCD thumbprint pages: STMS Step 1 Seller (Owner) and Step 3 Buyer (Dealer); eSTM Step 1
   Buyer (Customer) and Step 3 Seller (Dealer); eSerahan Permission director checks and
   user activation (Sub, L1, L2); BMK Step 1 Owner and Step 3 Dealer; Update Insurance
   Permission director checks and activation; Company/Business Profile update Step 3 (MVD
   License Agreement); Manage Users add user; first login of a new Main UCD
   `[from SharePoint TS #121 List of Modules and Pages that requires Thumbprint (UCD & AATF), sheet UCD, rows 3-52]`.

---

## 16. UCD content, guides, contact

1. Hotline "03-27798899"; Contact Us hours "Mon to Fri (9am to 6pm) Sat, Sun & P.Holiday
   (10am to 4pm)" `[from SharePoint TS #071 EAINT-8620 & EAINT-8627, sheet EAINT-8620, rows 4-5]`.
2. Hotline appears in error messages, e.g. "RHB account is inactive. Please call eAuto at
   03-27798899", "Verification unavailable now. Please call eAuto at 03-27798899.",
   "Name and IC do not match the selected user. Please contact 03-27798899 for
   assistance." `[… rows 9, 11, 13]`; failed eLKM "Harap maaf, permohonan LKM anda gagal.
   Sila hubungi eAuto Support Team di 03-27798899 untuk keterangan lanjut."
   `[from SharePoint TS #071 EAINT-8620 & EAINT-8627, sheet 18th Dec 2025 Patching, row 4]`.
3. Company address on documents: "Level 15, Sunway Tower, Jalan Ampang, 50450 Kuala
   Lumpur"; documents dated before 5/5/2025 keep "10-1 & 10-2, Jalan PJU 7/16, Mutiara
   Damansara, 47810 Petaling Jaya" `[from SharePoint TS #071 EAINT-8620 & EAINT-8627, sheet EAINT-8620, row 26]`
   `[from SharePoint TS #071 EAINT-8620 & EAINT-8627, sheet EAINT-8627, rows 3-4]`.
4. Account closure: "emailing us at compliance@eauto.my"
   `[from SharePoint TS #071 EAINT-8620 & EAINT-8627, sheet EAINT-8620, row 18]`.
5. Contact Us no longer shows the eAuto bank account number
   `[from SharePoint TS #033 EAINT-12130, sheet Test Scenario, row 2]`.
6. User guides are served from a URL that "starts with cdn"
   `[from SharePoint TS #019 EAINT-11835, sheet STMS, row 3]`. eSTM without eSerahan
   permission: "Anda belum dibenarkan menggunakan eSerahan. Sila rujuk User Guide (sini)
   untuk mengetahui cara Main user/Director menambah pengguna e-Serahan."
   `[from SharePoint TS #019 EAINT-11835, sheet eSTM, row 14]`.
7. eAuto logo with TM on new documents; existing approved transactions "Remain as old
   version eAuto logo (without TM)" `[from SharePoint TS #099 EAINT-9555, sheet Existing Approved Transaction, row 3]`.

---

## 17. Production regression folder (listed only)

`Shared Documents/1. eAuto Project/eAuto - Test Evidence/3. Production Regression/` holds
96 dated deployment folders (960 files), one per production deployment or patch, named
`YYYYMMDD - <date> Deployment (<scope>)`. Earliest "20250519 - 19th May 2025 Deployment
(Pre e-Invoice)", latest "20261014 - 14th October Night Deployment Items". Examples of
scope labels: "(eDereg Prechecking)", "(BMK e-Invoice)", "(Bypass SSM)", "(e-Invoice)",
"(Database and Tomcat …)", "(XStar)", "(Applet New Cert)", "(JPJ Official …)", "(JomCheck
API Update)", "(Add RM5 STMS & UTU)", "(SSM LLP + XML Log + SST)", "(MacroKiosk + Recon +
Adhoc)", "(Wholesale 2.0 …)", "LKM Refund + STMS APT Increase Service Charge". From
mid-2026 the folders switch to "<date> Morning/Night Deployment Items".
`[from SharePoint library listing 2026-10-16, _reference/sharepoint/library-listing-2026-10-16.json, folder prodReg]`

---

## 18. Secarang and CIBO

1. **Payment Mode values (EAINT-11541):** Secarang "Fiuu" on/after the cutoff, "RMS"
   before; eAuto "RHB"; Makrokiosk "Bold Pay"
   `[from SharePoint TS #129 EAINT-11541, sheet EAINT-11541, rows 3-10]`. (EAINT-12327 later
   changed the format — see [cibo.md](cibo.md).)
2. **Discount line on Secarang receipt/email/WhatsApp (EAINT-8331/8334/7199):** Discount and
   Total Amount show only for codes MF / EAUTO / ER; hidden for other codes and when no
   code `[from SharePoint TS #133 EAINT-8331, 8334 & 7199, sheet EAINT-8331, 8334 & 7199, rows 14, 17, 20]`.
3. **Lonpac 14-day grace (EAINT-9062):** "Policy expired and is still within 14-day renewal
   period | Able to purchase Lonpac insurance"; beyond 14 days unable
   `[from SharePoint TS #137 EAINT-9062, sheet EAINT-9062, rows 2-3]`.
4. **CIBO money columns (EAINT-9979 / 10052)** `[from SharePoint TS #140 EAINT-9979, sheet Test Scenario]`:
   1. "Gross Premium (RM) refers to total premium amount after NCD (No Claim Discount) plus
      any add-ons." `[row 4]`
   2. "Service Tax = Gross Premium (RM) x 8%" `[row 5]`; stamp duty "always RM10" `[row 6]`.
   3. Total Premium = total payable before discount `[row 7]`.
   4. Discount codes: "EAUTOOFF10 - Discount 10% of Gross Premium (automatically applied to
      eAuto transaction) 2. RJC7 - Discount 7% of Gross Premium 3. COTEAM - Discount 5% of
      Gross Premium 4. SCW5 - Discount 5% of Gross Premium"; no code → " 0.00 " `[rows 8-9]`.
   5. Insurance commission "10% applied automatically to transaction made in eAuto";
      Secarang per Discount Code Management `[row 10]`.
   6. Commission to sub-agent: RJC7 3% `[from SharePoint TS #128 EAINT-10052, sheet Test Scenario, row 11]`.
   7. "Total Direct Cost = Discount to Customers + Commission to Sub Agent"; "Gross Profit =
      Insurance Commission Amount − Total Direct Cost"; " 0" when no discount code
      `[from SharePoint TS #128 EAINT-10052, sheet Test Scenario, rows 12-13]`.
5. **Hire Purchase columns (EAINT-10052 / 9900):** "(Claimed by)" = X STAR TECHNOLOGY
   MALAYSIA SDN BHD for X-Star, else "-"; "(User Submission)" = the credit company the UCD
   chose ("-" for X-Star); "(Returned by JPJ)" = JPJ value; Secarang rows " - "
   `[from SharePoint TS #128 EAINT-10052, sheet Test Scenario, rows 4-8]`.
6. **Export file names:** Transaction Management "Transaction_Management_YYMMDDHHmm.csv e.g:
   Transaction_Management_202605080846" `[from SharePoint TS #140 EAINT-9979, sheet Test Scenario, row 2]`;
   Payment Report "Payment_Report_YYMMDDHHmm.csv" `[from SharePoint TS #128 EAINT-10052, sheet Test Scenario, row 2]`
   (the examples are actually yyyyMMddHHmm). The Referred Risk Log script reuses the
   Payment_Report pattern `[from SharePoint TS #139 EAINT-9900, sheet Test Scenario, row 2]` — likely a copy error `[unconfirmed]`.
7. **Transaction Listing export column order after "E-Certificate No. / Policy No."**:
   Coverage Type, Year, Make, UCD City, UCD State, Vehicle Model, Hire Purchase (eAuto only)
   `[from SharePoint TS #134 EAINT-8657 & 8956, sheet 8657 & 8956 (Latest), rows 12-18]`.
   UCD City/State come from eAuto BO Company Details `[rows 15-16]`.
8. **Referred Risk Log export:** "1 Inquiry Date 2 Inquiry By 3 Platform 4 Reference No 5
   Company Name 6 Company Registration No 7 Vehicle No. 8 Vehicle Type 9 Insured Name 10
   Insured ID 11 Insurance Company 12 Year 13 Make 14 UCD City 15 UCD State 16 Vehicle
   Model 17 Hire Purchase…" `[from SharePoint TS #139 EAINT-9900, sheet Test Scenario, row 3]`;
   Inquiry Date "DD-MM-YYYY HH:MM (24hrs system)", Inquiry By "UCDID/userID"
   `[from SharePoint TS #139 EAINT-9900, sheet Reference, meta rows 3-4]`; UCD City is the
   branch's city `[from SharePoint TS #139 EAINT-9900, sheet Test Scenario, row 8]`.
9. **CIBO roles (EAINT-9840, post-implementation)** `[from SharePoint TS #138 EAINT-9840, sheet TS Post-Implementation]`:
   1. Admin: all modules — Dashboard, User Account Management, CRM, Transaction
      Management, Payment Management, Referred Risk Log, Payment Report, Commission
      Report, Visitor Management, Agent Management, Discount Code Management `[row 2]`.
   2. Admin Insurance: "ONLY … DASHBOARD - TRANSACTION MANAGEMENT - PAYMENT REPORT -
      COMMISSION REPORT - DISCOUNT CODE MANAGEMENT" `[row 24]`.
   3. Temporary insurance staff: Dashboard, Transaction Management, Payment Report,
      Commission Report `[row 34]`.
   4. Ops support: Dashboard and Transaction Management; "The Print & Export button will
      be hidden; user is unable to download the Transaction Listing" `[rows 52, 54]`.
10. **Takaful PDS on Secarang (EAINT-8786):** [Product Disclosure (English)] / (Malay) links at
    Step 2 and Step 4 'More Info' and in the [Confirm and Pay] section; the e-Policy email
    ZIP contains the PDS `[from SharePoint TS #135 EAINT-8786, sheet EAINT-8786, rows 3-6]`.

---

## 19. Wholesale

1. Wholesale STMS Reference No: "must NEVER repeat and never go backwards. Only a REPEATED
   Reference No is a defect"; "GAPS WITHIN A LEG ARE EXPECTED AND CORRECT. The seller, buyer
   and refund legs now share one pool of numbers"; "Prefix, length and format must be
   exactly as they are today. Each leg keeps its own prefix"
   `[from SharePoint TS #001 14th_Sep_Deployment_Staging_Regression, sheet 12042 STMS Ref No, meta rows 5-7]`.
2. JomCheck price on the chatbot is an operator setting, not code; chatbot quote and payment
   page must move together; "Charged = shown."; reports bought earlier keep RM18 "No
   re-pricing, no top-up, no refund." `[from SharePoint TS #001 14th_Sep_Deployment_Staging_Regression, sheet 12279 JomCheck RM20, meta rows 2, 7 and rows 18, 27]`.
3. Wholesale BO Marketing tab: 20 rows by default, sort "Latest activity", Date From auto
   today − 30 days; empty state "No marketed vehicles match these filters."; ten pending
   listing statuses NEW, PENDING_PHOTO_PRICE, PENDING_PRICE, PENDING_PHOTO,
   PENDING_MILEAGE, PENDING_PHOTO_MILEAGE, PENDING_PRICE_MILEAGE,
   PENDING_PHOTO_PRICE_MILEAGE, PENDING_VEHICLE_INFO, PENDING_CONFIRMATION
   `[from SharePoint TS #127 eAuto Wholesale Test Scenarios COMPLETE v3, sheet EAINT-11999, rows 2, 10, 12]`.
4. Logistic v1 removed: "end to end flow only require QR validation by Logistic team from
   Delivery Order email"; old v1 QR buttons gone from BO details
   `[from SharePoint TS #127 eAuto Wholesale Test Scenarios COMPLETE v3, sheet EAINT-11949, rows 4, 9]`.
5. APT amount inside the seller booking fee follows the current APT fee
   `[from SharePoint TS #042 EAINT-12403, sheet APT, row 76]`.

---

## Contradictions found inside the sweep and against existing knowledge

1. **Homepage dialog order vs test scripts.** Resolved 2026-10-16: not a conflict. Campaign popups and their order change with the season and celebration, so each script's order holds only for its own campaign, and the captured page script reflects only the campaign live at capture time. `[from Faizuddin, 2026-10-16]`

2. **Allowed special characters in Decision Maker Name.** UCD company (EAINT-8644): "System
   should allow to insert Special Characters … "@MUHAMMAD# ABU&""
   (`#074, sheet EAINT-8644 (FUNC), row 10`). AATF/PBT (EAINT-8773) and Director/Owner
   Name (EAINT-8774): only ' / . , : - @ (`#082, sheet 8773, row 14`; `#083, sheet Sheet1,
   row 8`). The later CRs may have tightened the UCD field too. `[unconfirmed]`
3. **JomCheck Resubmit on Payment Failed + Tx Failed.** Resolved 2026-10-16: not a conflict. Both sheets expect Resubmit hidden on UCD and BO; the v1 TS5/TS10 titles contain a typo ("is showing"). See the JomCheck Resubmit rules.
4. **SSM single required document per role.** EAINT-8526: Main UCD STMS → Company Board
   Resolution, Sub UCD eSTM → Authorisation Letter (`#063, rows 20-25`). EAINT-8802: Main
   UCD STMS → Authorisation Letter, Sub UCD STMS → Company Board Resolution (`#086, sheet
   E2E, rows 8-9`). `[unconfirmed]`
5. **Fee reset scope** differs between EAINT-12289 (all non-completed) and EAINT-12403
   (Payment = Failed only) — §1.2.3. Not a defect; a per-CR decision.
6. **SSM document price** RM18.64 (EAINT-7548) vs RM19.44 (EAINT-10691 regression in
   EAINT-9247) — the later value supersedes.
7. **Browser priority.** The Notion page "eAuto - Web Browser Testing Priority" says UCD /
   AATF: Firefox; BO / JPJ: Chrome then Firefox (see
   [qa-process-from-notion-export.md](qa-process-from-notion-export.md)). EAINT-12180 ends
   Firefox support on 31 December 2026 (`#036, sheet Functional Testing, row 7`). From
   2027 Chrome is the only supported browser.
8. **EAINT-8606.xlsx** holds the EAINT-8534 script (`#070, sheet WEB, meta row 1`); the file
   name and content disagree. Known; the team will rename it later. No action. `[from Faizuddin, 2026-10-16]`


## Rules from Charmain's ledgers and SRD copies (added 2026-10-27)

Colleague notes, not verified live; source `_reference/codebases/eauto-qa-charmain/` (commit 0ab45d1). Full detail with line tags is in the flow files; key business rules only:

1. **EAINT-12155 password (new accounts):** 12–30 characters, upper, lower, number, one special from `! @ # $ % ^ & * ( ) _ + - =`, no spaces, English only; existing accounts exempt (REQ-001). Build strips spaces and non-English as typed and shows a five-line rule list instead of per-rule sentences. → flow-platform.md. `[charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:762-899]`
2. **EAINT-12054 bulk payment SSM:** with bypass all 3 documents per business type; without bypass the Board Resolution / Authorisation Letter plus a still-valid SSM; failures listed in one popup grouped by reason. → flow-stms.md. `[charmain-repo: docs/source-material/ucd-stms-bulk-payment-srd-v1.2.txt:238-337]`
3. **EAINT-12055 reconciliation:** same Payment Ref No = matched pair; both removed even across days and months; applies to existing records. Build also removes a same-reference pair with unequal amounts (QA ruling 2026-10-01). → flow-bo-shell.md. Consistent with §11 item 8 above (SharePoint TS #029). `[charmain-repo: docs/source-material/bo-all-reconciliation-exclude-resubmission-srd-v1.0.txt:140-331]`
4. **EAINT-104 LKM Refund:** fee bands RM0/5/10/35/50 + 8% tax on eAuto fees only; reconciliation amounts RM5.40/10.80/37.80/54.00. → flow-stms-addons.md. `[charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:41-50]` `[charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:329-332]`
5. **EAINT-11982 Extend:** once only, +30 days from expiry (before) or from click (after, up to 3 calendar months); status back to Approved; no email. → flow-application-reactivation.md §10. `[charmain-repo: test-scenarios/bo-application-extend/bo-application-extend.md:38-50]`
6. **EAINT-12131 Special Remark:** CSE may edit and save; listing flag "Yes"; 500-character cap (observed). → flow-service-hub.md. `[charmain-repo: test-scenarios/bo-service-hub-bdp-si/bo-service-hub-bdp-si.md:42-48,252-254]`
