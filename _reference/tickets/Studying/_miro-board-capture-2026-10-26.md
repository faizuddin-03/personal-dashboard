<!-- Source: Miro board "eAuto - QA Resource Planning"
     https://miro.com/app/board/uXjVLqFnnAU=/?share_link_id=694056267956
     Captured 2026-10-26 by Claude via the board's Web SDK (miro.board.get(), read-only), Comment-only access.
     Scope: frame "October 2027" (title on board; content is October 2026) columns from 26TH OCT DEPLOYMENT onward,
     plus frame "November 2026". Earlier columns (1st–23rd Oct), the "??TH MAY" / "18TH SEPT" /
     "PACKAGE - Shopping Cart Phase 2" parking column and older month frames were NOT captured here.
     Card text is verbatim. Empty template lines kept as on the board. -->

# Miro capture — future deployments (2026-10-26)

## Column map

| Column on board | Tickets |
| --- | --- |
| 26TH OCT DEPLOYMENT | EAINT-12431, EAINT-12589 |
| 27TH OCT DEPLOYMENT | EAINT-10108 |
| 28TH OCT DEPLOYMENT | EAINT-12253 |
| 29TH OCT DEPLOYMENT | EAINT-12257, EAINT-12153 |
| TBC (pending requirement) | EAINT-11179 |
| TBC (update by 8/10/2026) | EAINT-xxxxx - LKM Refund (Phase 2) |
| TBC | EAINT-12580 |
| READY FOR TESTING TICKETS | EAINT-8767, EAINT-12121, EAINT-12230, EAINT-12087, EAINT-12123, EAINT-12124 |
| READY FOR TESTING → PACKAGE - ENFORCE 12-CHAR PASSWORD | EAINT-12125, EAINT-12228, EAINT-12299, EAINT-12333 |
| 3RD NOV DEPLOYMENT | EAINT-12088 |
| 5TH NOV DEPLOYMENT | EAINT-12099 |
| 26TH NOV DEPLOYMENT (SIT Testing: TBC, UAT Testing: TBC, Target Deployment: TBC) | EAINT-12028, EAINT-11868, EAINT-12348, EAINT-12019 |

Board also has a "TICKET ASSIGNMENT" frame with stamps for NAIM, MAY, AZFAR, FAIZ, HUI XIN, AZILA, CHARMAIN (stamp-to-name mapping not readable as text).

---

## 26TH OCT DEPLOYMENT

### EAINT-12431
```
EAINT-12431 - 🔴[eAuto-UCD] To Send Email and WhatsApp Notifications to Car Owner for LKM Refund when UCD proceeding to Step 3 (Part 1)
- To deploy on:
- Test Env: staging/uat4
- BA: Yi Link
- QA: Charmain
- Test Env Point to:
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- QA start Testing:
- Est. Testing Mandays: 1 day (1 QA)
- Base Testing Time: 0.5 day
- Buffer (Req Change + Bug Fix + Retest Bug): 0.5 day
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Manual + Automation Testing)
- E2E Flow
- STMS Individual
- STMS Company (Phase 2??)
- Email and WhatsApp
- Notification
- Reminder
```

### EAINT-12589
```
EAINT-12589 - [eAuto - BackOffice] Ins Cancellation Balance % - show on STMS & Insurance Cancellation listings and STMS export whenever a value exists
- To deploy on:
- Test Env: /uat4
- BA: Yi Link
- QA:
- Test Env Point to:
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- QA start Testing:
- Est. Testing Mandays: 1 day (1 QA)
- Base Testing Time: 0.5 day
- Buffer (Req Change + Bug Fix + Retest Bug): 0.5 day
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation)
-
```

## 27TH OCT DEPLOYMENT

### EAINT-10108
```
EAINT-10108 - 🔴[eAuto-UCD] STMS - Enhance Perakuan Step 1 & Step 3 Wording to Require Customer Email Address
- To deploy on:
- Test Env:
- BA: Yi Link
- QA: Charmain?
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- Est. Testing Mandays: 3 hours (1 QA)
- Base Testing Time: 2 hours
- Buffer (Req Change + Bug Fix + Retest Bug): 1 hour
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation Testing)
- E2E Happy Flow
- Individual
- Company
- Make sure Step 1 and 3 Perakuan, Slip Pengesahan PDF showing correctly
```

## 28TH OCT DEPLOYMENT

### EAINT-12253
```
EAINT-12253 - 🔴[eAuto-UCD] To Display Browser Reminder in Last Step of Transaction for Mozilla Firefox to Google Chrome Migration Effective 1 January 2027
- To deploy on:
- Test Env: staging/uat1
- BA: Yi Link
- QA: May
- Test Env Point to:
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- Est. Testing Mandays: 5 days (1 QA)
- Base Testing Time: 3 days
- Buffer (Req Change + Bug Fix + Retest Bug): 2 days
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Manual / Automation Testing)
- Changes: Show Browser Reminder popup at the Last Step of each Transaction
- User Type: Main & Sub UCD
- Browser:
- Firefox: should show the popup
- Chrome / any other Browser (eg: Edge): should NOT show the popup (Regression)
- Modules Affected:
- STMS - step 6 show popup
- STMS Wholesale - step 6 show popup
- UCD to UCD - Standard - step 6 show popup
- UCD to UCD - Interstate - step 6 show popup
- eSTM
- After eSTM Approval Flow - eSTM Step 6 should NOT show popup > redirect to Insurance Step 1 > Insurance Step 4 show popup
- 69E Flow - Insurance Step 4 show popup > eSTM Step 6 show popup
- BMK - step 6 show popup
- APT - step 6 show popup
- Insurance - step 4 show popup
- Service Hub - step 4 show popup
- Jomcheck - show after Payment success
- Dereg - step 6 show popup
- e-Dereg Pre-checking - step 3 show popup
- Functional:
- [View PDF Guide  查看操作指南] button --> open User Guide in a new tab, Transaction page remain showing behind the popup
- [Continue 继续] button --> close the popup & return to the last step of Transaction
- Scenario:
- Manually refresh the page w/o closing popup - should show popup
- Close the banner & refresh the page - should NOT show popup
```

## 29TH OCT DEPLOYMENT

### EAINT-12257
```
EAINT-12257 - 🔴[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application (DUITNOW QR)
- To deploy on:
- Test Env:
- BA: Yi Link
- QA: Faiz
- Test Env Point to:
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- Est. Testing Mandays: 3 days (1 QA)
- Base Testing Time: 2 day
- Buffer (Req Change + Bug Fix + Retest Bug): 1 day
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Manual + Automation Testing)
-
```

### EAINT-12153
```
EAINT-12153 - 🔴[eAuto-Application] Add B2B Payment Channels for Pre-application and Application (B2B)
- To deploy on:
- Test Env:
- BA: Yi Link
- QA: Faiz
- Test Env Point to: -
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- Est. Testing Mandays: 3 days (1 QA)
- Base Testing Time: 2 days
- Buffer (Req Change + Bug Fix + Retest Bug): 1 day
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation)
- Application Module:
- Pre Application > Payment Page
- Application > Payment Page
- Business Type:
- Sdn Bhd / ROC
- ROB
- LLP
- Business Trading (Sabah)
- Business Trading (Sarawak)
- Payment Type:
- Credit or Debit Card
- VISA
- MasterCard
- Online Banking (Business) - B2B
- All Bank - 10
- Retain FPX (Personal)
- Regress any bank?
- Test Scenarios:
- New Transaction
- Payment = OK
- Payment = Failed
- Existing Transaction
- Payment = OK
- Payment = Failed
```

## TBC

### EAINT-11179 — column "TBC (pending requirement)"
```
EAINT-11179 - 🔴[eAuto-UCD] STMS - Move LKM Refund & Insurance Cancellation Add-on from Step 5 to Step 4
- To deploy on:
- Test Env:
- BA:
- QA:
- Test Env Point to:
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- QA start Testing:
- Est. Testing Mandays: days (1 QA)
- Base Testing Time: days
- Buffer (Req Change + Bug Fix + Retest Bug): day
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation + Manual Testing)
-
```

### EAINT-xxxxx LKM Refund (Phase 2) — column "TBC (update by 8/10/2026)"
```
EAINT-xxxxx - LKM Refund (Phase 2)
- To deploy on: 5th Mar
- Test Env: staging/preprod1 & /preprod2
- BA: MJ, Yi Link
- QA: Charmain / Azila
- Test Env Point to: JPJ Staging
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- Est. Testing Mandays: days (1 QA)
- Base Testing Time: days
- Buffer (Req Change + Bug Fix + Retest Bug): day
- ETA to complete testing latest by:
- Regression Testing:
- SIT Testing: Connect to 3rd party staging for QA to test the integration
- ETA for SIT Testing:
- SIT Date / Testing Mandays:
- UAT Testing: Walkthrough with client / insurance party come over to eAuto for UAT testing
- UAT Walkthrough with eAuto:
- UAT Walkthrough with JPJ/Insurance Party/RaffTech/any 3rd party:
- Testing Scope:
- Regression Scope (before UAT)
- E2E Happy Flow
- Individual
- Company
- LKM Refund Payment = Failed
- LKM Refund Submission = Failed
- Pending item
- IC automation test result
```
Note: "To deploy on: 5th Mar" and the env lines look copied from the Phase 1 card (EAINT-104/10093/10119, 1st Oct column). Treat as template carry-over, not a plan.

### EAINT-12580 — column "TBC"
```
EAINT-12580 - [eAuto - Insurance Cancellation] Copy of IC split saves watermark pieces instead of the IC as Front IC / Back IC
- To deploy on:
- Test Env: /preprod1
- BA:
- QA: Azila
- Test Env Point to:
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- QA start Testing:
- Est. Testing Mandays: 1.5 days (1 QA)
- Base Testing Time: 1 days
- Buffer (Req Change + Bug Fix + Retest Bug): 0.5 day
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation)
-
```

## READY FOR TESTING TICKETS

### EAINT-8767
```
EAINT-8767 - 🟣[eAuto-Insurance] To Fix Cronjob of Insurance for "Quotation Expired" & Allow Special Remarks Field to Accept Special Character
- To deploy on:
- Test Env:
- BA:
- QA:
- Test Env Point to:
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- QA start Testing:
- Est. Testing Mandays: 3 days (1 QA)
- Base Testing Time: 2 days
- Buffer (Req Change + Bug Fix + Retest Bug): 1 day
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation / Manual Testing)
- Transaction Type
- New eAuto Insurance Transaction
- Existing eAuto Insurance Transaction
- Transaction Status
- Before Payment
- Payment = -, Tx Status = Pending Payment
- After Payment
- Payment = Pending, Tx Status = Pending Payment
- Payment = Failed, Tx Status = Failed
- Payment = OK, Tx Status = Insurance Created
- Tx Status = Quotation Expired
- Tx Status = Quotation / Pending Approval???
- Test Scenario
- Tx Status updated to Quotation Expired after 24 hours
- Transaction Status remains unchanged after 24 hours
- Insurance Transaction Details Page > Special Remarks Field
- Functional Test Scenarios
```

### EAINT-12121
```
EAINT-12121 - 🔴[eAuto-UCD] SSM: Remove 7 Days Validation After First Purchase to Allow SSM Repurchase
- To deploy on:
- Test Env:
- BA: Yi Link
- QA:
- Test Env Point to: -
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- Est. Testing Mandays: 9 days (1 QA)
- Base Testing Time: 7 days
- Buffer (Req Change + Bug Fix + Retest Bug): 2 days
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Manual + Automation Testing)
- Module Affected
- STMS Company
- eSTM Company
- [Purchase SSM] button
- Before 10min - hide
- After 10min - show
- Before 7 days - show
- After 7 days - show
- STMS & eSTM Existing Transactions
- Cross Module (STMS + eSTM) Checking
- SSM 7 Days Handling
- SSM Cronjob Resubmission
- SSM Document Validation Checking
- Business / Company Status Checking FAILED
- Director / Owner IC Checking FAILED
- e-Info returned WRONG Info
- SSM 2 Layer Permission???
- ~100 TS
```

### EAINT-12230
```
EAINT-12230 - 🔴[eAuto-UCD] SSM: Add Duplicate Purchase Validation on Payment Step to Prevent Double Charge
- To deploy on:
- Test Env:
- BA:
- QA:
- Test Env Point to:
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- QA start Testing:
- Est. Testing Mandays: days (1 QA)
- Base Testing Time: days
- Buffer (Req Change + Bug Fix + Retest Bug): day
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation + Manual Testing)
- Test together with EAINT-12121
```

### EAINT-12087
```
EAINT-12087 - 🟣[eAuto-Backend] Build Cronjob to Auto-Expire Software Installation Slot After 60 days
- To deploy on:
- Test Env:
- BA: Batrisyia
- QA:
- Test Env Point to: -
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- Est. Testing Mandays: 3 days for 1 QA
- Base Testing Time: 2 days
- Buffer (Req Change + Bug Fix + Retest Bug): 1 day
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Manual + Automation Testing)
- Refer to previous TS drafted in miro
```

### EAINT-12123
```
EAINT-12123 - 🔴[eAuto-BackOffice] Differentiate Reference Number for Multiple Records under Same SR in Biometric Device Purchase & Software Installation Listing
- To deploy on:
- Test Env:
- BA:
- QA:
- Test Env Point to:
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- QA start Testing:
- Est. Testing Mandays: 3 days (1 QA)
- Base Testing Time: 2 days
- Buffer (Req Change + Bug Fix + Retest Bug): 1 day
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation + Manual Testing)
- Transaction Type
- Software Installation ONLY
- 1 installation
- more than 1 installation
- Biometric Device Purchase ONLY
- 1 device
- more than 1 device
- Biometric Device Purchase + Software Installation
- 1 device + 1 installation
- more than 1 device + more than 1 installation
- Affected Pages (BackOffice)
- Service Request Listing Page
- Export Excel file
- Reference No search field
- Service Request Transaction Details Page
- Appointment Calendar > Add Appointment
- Appointment Calendar / Installation Failed > Reschedule Appointment
```

### EAINT-12124
```
EAINT-12124 - 🔴[eAuto-Service Hub] Create Email Notification with CC to Support for Biometric Device Purchase
- To deploy on:
- Test Env:
- BA:
- QA:
- Test Env Point to: -
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- QA start Testing:
- Est. Testing Mandays: 2 days (1 QA)
- Base Testing Time: 1 days
- Buffer (Req Change + Bug Fix + Retest Bug): 1 day
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation + Manual Testing)
- Transaction Type
- Biometric Device Purchase
- Biometric Device Purchase + Software Installation (Free)
- Biometric Device Purchase + Software Installation (Add On)
- Software Installation
- Test Scenarios
- E2E Happy Flow
- Payment = Failed
```

### PACKAGE - ENFORCE 12-CHAR PASSWORD

#### EAINT-12125
```
EAINT-12125 - 🟣[eAuto] Existing UCD: Enforce 12-Character Password Complexity Across All Portals with uppercase, lowercase, number & special character
- To deploy on:
- Test Env:
- BA: Yi Link
- QA:
- Test Env Point to: -
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- Est. Testing Mandays: 3 days for 1 QA
- Base Testing Time: 2 days
- Buffer (Req Change + Bug Fix + Retest Bug): 1 day
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation)
- Portals:
- eAuto - Core (Web)
- Main UCD
- Sub UCD
- BO (different role)
- eAuto - Core (App)
- Main UCD
- Sub UCD
- eAuto - AATF
- Main User
- Sub User
- eAuto - Service Portal
- Secarang
- CIBO
- Cross portal?
- Test Scopes:
- E2E testing (full user journey)
- New user registration > confirm password
- New user > change password
- Existing > change password
- BO Reset password
- BO change password
- Login > Logout > Relogin
- UCD Login Thumbprint Related
- AATF Login Thumbprint Related
- Functional Testing (Boundary testing)
- Role Testing
- Cross Browser Testing
- Regression testing
```

#### EAINT-12228
```
EAINT-12228 - 🔴[eAuto-Login Page] Add Forgot Password Link at Login Page for Self-Service Password Reset
- To deploy on:
- Test Env:
- SA: MJ
- QA:
- Test Env Point to: -
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- Est. Testing Mandays: days for 1 QA
- Base Testing Time: days
- Buffer (Req Change + Bug Fix + Retest Bug): day
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation)
-
```

#### EAINT-12299
```
EAINT-12299 - 🔴🟣[eAuto-UCD & BackOffice] Rename Uploaded File with Chinese Characters upon Upload in Pre-Application & Application
- To deploy on:
- Test Env:
- BA: Yi Link
- QA:
- Test Env Point to: -
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- Est. Testing Mandays: 4 days for 1 QA
- Base Testing Time: 2 days
- Buffer (Req Change + Bug Fix + Retest Bug): 2 days
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Manual + Automation Testing)
- UCD Upload E2E Test Scenarios
- Existing transaction
- New transaction
- Business Type
- Sdn Bhd / Bhd
- Sole Prop / Partnership
- LLP
- Business Trading (Sabah)
- Business Trading (Sarawak)
- 35 files per business type, total around 175 files
- Flows
- Pre-Application
- Application
- Registration Document
- Functional Test Scenarios
- Upload
- Download
- View
- Issue trigger point: Create Account button in BO
```

#### EAINT-12333
```
EAINT-12333 - 🔴[eAuto-BackOffice] To Create Invoice for Proforma Invoice Module
- To deploy on:
- Test Env:
- BA: Yi Link
- QA:
- Test Env Point to:
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- QA start Testing:
- Est. Testing Mandays: 5 days (1 QA)
- Base Testing Time: 3 days
- Buffer (Req Change + Bug Fix + Retest Bug): 2 days
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation + Manual Testing)
- Transaction Type
- Existing Transaction
- Invoice auto-generated upon deployment (no BackOffice action)
- e-Invoice Status, e-Invoice No. and e-Invoice PDF remain unchanged
- Existing records not covered by the deployment backfill follow the New Transaction flow ([Generate Invoice & e-Invoice])
- New Transaction
- [Generate Invoice & e-Invoice] button
- Valid TIN: Invoice + e-Invoice generated
- Invalid / No TIN: Invoice generated only; no e-Invoice; e-Invoice Status unchanged
- Invoice Format
- Follows existing production invoice format, field for field
- Invoice numbering
- Regression
- Proforma Invoice / e-Invoice Listing + Export
- Proforma Invoice Details page buttons (Print Proforma Invoice, Print e-Invoice, Mark as Paid, Cancel)
- Credit Note (Raise from Proforma, Listing + Export)
- e-Invoice / Consolidated e-Invoice Listing ("Proforma Invoice Only") + Consolidated report
- Existing invoice generation cron: no duplicate invoices for Proforma
- UCD Portal (Web / Mobile): no change (out of scope)
- Menu access by user list
- MyInvois Portal
```
Note: two lines between "Invoice numbering" and "Regression" may be missing — a capture chunk was skipped at that point.

---

## November 2026

### EAINT-12088 — 3RD NOV DEPLOYMENT
```
EAINT-12088 - 🟣[eAuto-UCD] Automate Public Holiday List via Google Calendar Integration
- To deploy on:
- Test Env:
- BA: Batrisyia
- QA:
- Test Env Point to: -
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- Est. Testing Mandays: 1 day for 1 QA
- Base Testing Time: 0.5 day
- Buffer (Req Change + Bug Fix + Retest Bug): 0.5 day
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation Testing)
- Affected Areas (m&m)
- UCD > SI Flow
- UCD > BDP + SI Flow
- BackOffice > Appointment Calendar
- Reschedule flow
- Google Calendar
- Observed and tentative date
- To compare gcal with system
- Moved and blocked > Reminder Email
```

### EAINT-12099 — 5TH NOV DEPLOYMENT
```
EAINT-12099 - 🔴[eAuto-BackOffice] Shopping Cart - To Create Inventory Control Module
- To deploy on:
- Test Env:
- BA: Mei Jia
- QA:
- Test Env Point to: -
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- QA start Testing:
- Est. Testing Mandays: 7 days (1 QA)
- Base Testing Time: 5 days
- Buffer (Req Change + Bug Fix + Retest Bug): 2 days
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation + Manual Testing)
- New Pages
- BackOffice > Service Hub > Inventory Control Report (search & filter panel, 18-column listing)
- BackOffice > Service Hub > Stock In Request
- BackOffice > Service Hub > Stock Out Request
- BackOffice > Service Hub > Inventory Control Dashboard
- UCD > Biometric Device Purchase (available stock only)
- Stock In Request and Stock Out Request
- Dashboard
- Year filter, 7 columns, colour coding, last-updated note
- Safe Level % formula and the colour that follows it
- 6:00 AM refresh + low-stock email (fires once per drop - stock must recover above 30% and fall again to retest)
- UCD - Available Stock
- Paid-but-not-shipped units now count as taken
- Stock checked at order and re-checked before the card is charged
- Cross-cutting
- Permission matrix - Ops / CSE / Finance / IT
- Concurrency - 2 Ops on one batch, simultaneous Upload, stale page
- 47 message strings - asserted literally
- Audit log - user, action, Reference No., result
- Phone scan limits - 2,000 scans / 32 characters
- Left menu - new Service Hub section, existing BDP & SI link moved out of the Proforma Invoice / e-Invoice box
- Regression
- BO > Update Shipping Details
- BO > Delivery Status state machine
- BO > Delivered closes the service request and re-issues its payment report
- BO > BDP & SI Listing
- BO > listing export (carries device serials today)
- BO > DO template + 20-row split from EAINT-12166
- UCD > BDP Receipt page
- eauto-cron 1:00 AM must keep working alongside three new 6:00 AM behaviours
- ~250 TS
```

### 26TH NOV DEPLOYMENT (SIT Testing: TBC / UAT Testing: TBC / Target Deployment: TBC)

#### EAINT-12028
```
EAINT-12028 - 🔴[eAuto-BackOffice] New Module – Association Payment Listing (Automate Association/Vendor Payment Requests)
- To deploy on:
- Test Env:
- BA: MJ
- QA: Faiz
- Test Env Point to:
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- Est. Testing Mandays: 10 days (1 QA)
- Base Testing Time: 8 days
- Buffer (Req Change + Bug Fix + Retest Bug): 2 days
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation + Manual)
- E2E Approval Workflow
- Search and Filter
- Role and Permission
- E-Signature
- ~150 TS
```

#### EAINT-11868
```
EAINT-11868 - 🔴[eAuto-Application] To Implement Email Reminders & Application Link Reactivation
- To deploy on:
- Test Env: staging/uat1
- BA: Yi Link
- QA:
- Test Env Point to:
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- Est. Testing Mandays:  6 days (1 QA)
- Base Testing Time: 4 days
- Buffer (Req Change + Bug Fix + Retest Bug): 2 days
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope:
- Modules:
- Application form
- Test Scenarios:
- Reactivation Flow
- Reminder Emails (Reactivation)
- Compete E2E cycle testing trigger from different entry point
- 30 days > no reactivation email > 60days > no reactivation email > 90 days > send reactivation email
- TS01: Reactivation when Application Status = Pending > Payment = OK -> SSM Checking = OK >  Reactivation = Approved -> verify e-Invoice / Invoice -> verify MyInvois
- TS02: Reactivation when Application Status = Approved > Payment = OK -> Reactivation = Approved
- TS03:  Reactivation when Application Status = Rejected > Payment = OK -> Reactivation = Approved
- TS04: Reactivation when Application Status = Expired > Payment = OK -> Reactivation = Approved
- TS05: Special TS: extend once → expire → reactivate → expire → reactivate
- TS06: Payment = Failed
- TS07: LHDN Failed , e-Invoice not available
- click btn > UCD make payment > create new PA record > SSM checking
- roc , rob > purchase SSM
- trading > to upload trading license
- TS08: PA (A) -> A -> Expired -> Reactivation -> create PA(B) , PA(B) = A but not PA(A)
- Reminder Emails (After Approval)
- 3days after approval of Application- to submit required softcopy docs
- approval within 3days - docs completed
- Reminder Emails (Expiry)
- 2months before expiry
- 1 month before expiry
- No expiry if application complete
- Reminder Email (Payment)
- 1day - to complete payment (after Assignee verify Softcopy , Softcopy Docs = Checked, Registration Fee = Pending UCD)
- Reminder Emails (Hardcopy)
- 3days after payment
-
- E2E - Existing Application (include email reminder)
- Regression
- Business Type - to cover all 5business types?
```

#### EAINT-12348
```
EAINT-12348 - 🔴[eAuto-AATF & BackOffice] eDereg: Enable PBT Organisations as Active eDereg Users
- To deploy on:
- Test Env:
- BA:
- QA:
- Test Env Point to:
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- QA start Testing:
- Est. Testing Mandays: days (1 QA)
- Base Testing Time: days
- Buffer (Req Change + Bug Fix + Retest Bug): day
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation)
-
```

#### EAINT-12019
```
EAINT-12019 - 🔴[eAuto-UCD] eMOVE – Standalone Logistics Service
- To deploy on:
- Test Env:
- BA:
- QA:
- Test Env Point to:
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- QA start Testing:
- Est. Testing Mandays: days (1 QA)
- Base Testing Time: days
- Buffer (Req Change + Bug Fix + Retest Bug): day
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation)
-
```
