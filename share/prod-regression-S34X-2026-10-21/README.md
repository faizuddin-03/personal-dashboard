# S34.X production regression – 12107, 12327, 12412

Deployment: 21 Oct 2026 (AM). Built 2026-10-20 from the Deployment Checklist (Y2023-2026) patterns and the staging TS.

## Checklist rows

### Item 17 – EAINT-12107

**[Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay**

```
Secarang
1. Get a quotation with a random car plate and proceed until the Select Payment Method page ONLY
2. Ensure ShopeePay (SPayLater) and GrabPay (PayLater by Grab) are displayed as payment channels
3. Ensure Credit or Debit Card and FPX Online Banking are still displayed
4. DO NOT click [Pay]. DO NOT MAKE PAYMENT. Close the page.

CIBO > Payment Management
1. Login into CIBO production
2. Open the Payment Channels filter
3. Ensure "Fiuu - eWallet" is displayed
4. Tick "Fiuu - eWallet". Ensure 3 sub-options are ticked: GrabPay, GrabPay - PayLater by Grab, ShopeePay
5. Ensure "ShopeePay - SPayLater" is NOT displayed
6. Untick one sub-option. Ensure only that sub-option is unticked
7. Untick "Fiuu - eWallet". Ensure all 3 sub-options are unticked
8. Set the date range to 1 month from current date > [Search] > [Export]
9. Ensure the listing and the exported file load without error
10. Existing Card / FPX rows: Payment Reference ID does NOT carry "EW"
```

Unable to test on prod: payment through ShopeePay / GrabPay / Card / FPX (real charge and real policy), failed and cancelled payment (no Fiuu sandbox in prod), dev-patched PayLater by Grab data (12107_TS01-TS05, TS07-TS10).

Payment Reference ID with "EW" can only be verified when a real e-wallet payment is made after deployment. See Next Day Morning row.

### Item 18 – EAINT-12327

**[CIBO] To Enhance Payment Mode Column Format in Transaction Listing and Payment Report**

```
CIBO > Transaction Management
1. Login into CIBO production
2. Set the date range to 1 month from current date > [Search]
3. Ensure the Payment Mode column is displayed after the Payment column and before the Discount Code column
4. Ensure the other columns remain unchanged
5. Ensure existing transactions display the new format, for each mode found:
   - BoldPay | eWallet – TouchNGo
   - BoldPay | Online Banking – FPX-<Bank Name>
   - BoldPay | Credit/Debit Card – <card>
   - Fiuu | eWallet – ShopeePay
   - Fiuu | eWallet – GrabPay – Full Amount – Single Payment
   - Fiuu | eWallet – GrabPay – BNPL – Installment
6. Ensure a transaction with no payment displays dash "-"
7. Ensure eAuto (Platform = eAuto) rows display a Payment Mode value
8. [Export]. Ensure the exported file has the Payment Mode column in the same position, with the same value as the listing ("-" for no payment)

CIBO > Payment Report
1. Set a short date range (7 days) > [Search]
2. Ensure the Payment Mode column position remains unchanged
3. Ensure the Payment Mode value uses the new format and is never blank
4. [Export]. Ensure the exported value is the same as the page

Same transaction, 4 places
1. Pick 1 transaction. Ensure the Payment Mode value is identical in the Transaction Listing, its export, the Payment Report and its export
```

Only applicable if there are real transactions already made for each payment mode. Record the transaction no. used for each mode.

Known issue: EAINT-12566 (On Hold) – Secarang Fiuu FPX transactions show only "Fiuu". Note it, do not fail the CR on it.

Staging Payment Report hung on a long range (2026-10-16). Keep the range short.

### Item 19 – EAINT-12412

**[eAuto-UCD & BackOffice] JomCheck: Split Invoice & e-Invoice Charge into JomCheck Service Charge and eAuto Service Charge**

```
Record the exact deployment completion time (cut-off = transaction approval date and time).

UCD – price display (unchanged)
1. Ensure the JomCheck price still shows "RM20.00 + 8% Service Tax" on: UCD Home Page, JomCheck Report page, Get JomCheck Report page
2. Get JomCheck Report: enquiry Vehicle number ONLY > Submit > Tx = Pending. DO NOT MAKE PAYMENT.

Existing JomCheck transactions (approved BEFORE deployment)
BO > JomCheck Details
1. [Invoice]: Ensure 1 line item "JomCheck service charge", RM20.00 + RM1.60 = RM21.60
2. [e-Invoice]: Ensure 1 line item, Total Payable RM21.60, no resubmission (same UIN and Submission Date)
3. Repeat for 2-3 transactions
UCD > JomCheck Details (only if the test UCD company has an approved JomCheck)
1. [Invoice] and [e-Invoice]: same as BO

Regression – other products (existing data, download only)
1. BO eSTM Details > [Invoice] and [e-Invoice]: Ensure layout unchanged
```

Unable to test on prod: new JomCheck purchase from UCD / Wholesale / invalid-TIN UCD (real payment + real LHDN submission), eSim Report Result = Failed (staging only), BO [Resubmit] of a failed transaction (real LHDN submission; EAINT-12554 still open), new eSTM / Insurance purchases (12412_TS01-TS04, TS09, TS12 purchase half).

DO NOT click [Resubmit] on any JomCheck transaction.

Test Data (fill in):
Approved before deployment:
1. J__________
2. J__________
3. J__________

### Next Day Morning

```
Next Day Morning After Deployment
1. Monitor P1 modules to ensure there are no abnormal transactions
   - STMS
   - eSTM

2. EAINT-12412 – new JomCheck, Tx Status = Approved after the deployment time
   BO JomCheck Details > [Invoice]: 2 line items
     - JomCheck report: RM18.00, Tax RM1.44, Total RM19.44
     - JomCheck service charge: RM2.00, Tax RM0.16, Total RM2.16
     - Subtotal RM20.00, Tax RM1.60, Total Payable RM21.60
   BO JomCheck Details > [e-Invoice]: same 2 line items, classification code 022 on both, LHDN = OK
   BO SST Payment Report (JomCheck): Amount 20.00, Service Tax 1.60, Total 21.60, EAUTO 6.00, ezAUTO Asia 14.00
   BO e-Invoice / Consolidated e-Invoice Listing: 1 row, Total Including Tax 21.60

3. EAINT-12107 / EAINT-12327 – new Secarang e-wallet payment after the deployment (if any)
   CIBO Payment Management: Payment Reference ID carries "EW"; filter GrabPay / ShopeePay returns it
   CIBO Transaction Listing + Payment Report: Payment Mode = Fiuu | eWallet – ShopeePay / Fiuu | eWallet – GrabPay – ...
```

Only applicable if there are real transactions already made after the deployment.

EAINT-12412 Download Payment Document (weekly zip): check after the deployment week ends.

## Scope

| CR | Staging TS | Prod | How / Why |
|---|---|---|---|
| EAINT-12107 | TS01 Successful Pay With Grab | Partial | Secarang: payment page tiles only, no payment. CIBO half: next-day, only if a real GrabPay payment exists. |
| EAINT-12107 | TS02 Successful ShopeePay | Partial | Same as TS01. |
| EAINT-12107 | TS03 Failed Pay With Grab | No | Needs Fiuu sandbox Failed status. Real payment in prod. |
| EAINT-12107 | TS04 Failed ShopeePay | No | Needs ShopeePay simulator. Real payment in prod. |
| EAINT-12107 | TS05 CIBO different payment method | No | Needs dev data patch. |
| EAINT-12107 | TS06 CIBO Filter function | Yes | Filter options, tick/untick, Search, Export. View only. |
| EAINT-12107 | TS07 Regression Card | Partial | Card tile shown; existing Card rows have no "EW". No payment. |
| EAINT-12107 | TS08 Regression FPX | Partial | FPX tile shown; existing FPX rows. No payment. |
| EAINT-12107 | TS09 Cancelled Pay With Grab | No | Needs a real Fiuu GrabPay session. |
| EAINT-12107 | TS10 Cancelled ShopeePay | No | Needs a real Fiuu ShopeePay session. |
| EAINT-12327 | TS11 New Payment Mode column | Yes | View existing data. |
| EAINT-12327 | TS12 Payment Mode value per method | Partial | Only the modes that already have real transactions. |
| EAINT-12327 | TS13 Transaction with no payment | Yes | Existing unpaid rows show "-". |
| EAINT-12327 | TS14 Transaction Listing export | Yes | Export is a download. |
| EAINT-12327 | TS15 Payment Report format | Yes | View, short date range. |
| EAINT-12327 | TS16 Payment Report export | Yes | Export is a download. |
| EAINT-12327 | TS17 Same value on 4 places | Yes | Pick any existing transaction. |
| EAINT-12327 | TS18 Existing transactions | Yes | Existing rows show the new format. |
| EAINT-12327 | TS19 eAuto (RHB) and RMS rows | Yes | View existing eAuto and pre-cutoff Secarang rows. |
| EAINT-12412 | TS01 New JomCheck from UCD | Next day | No purchase by QA. Check a real new Approved JomCheck next morning (BO). |
| EAINT-12412 | TS02 New JomCheck from Wholesale | No | Real purchase. |
| EAINT-12412 | TS03 UCD with invalid TIN | No | Real purchase. |
| EAINT-12412 | TS04 Paid JomCheck ends Failed | No | eSim is staging only. |
| EAINT-12412 | TS05 BO matches UCD | Partial | BO only, unless the test UCD company has a JomCheck. |
| EAINT-12412 | TS06 SST Payment Report | Next day | Generate for the new real transaction. |
| EAINT-12412 | TS07 e-Invoice in LHDN MyInvois | Next day | LHDN = OK in BO. MyInvois portal only if access is given. |
| EAINT-12412 | TS08 Existing approved keeps 1 line | Yes | Main prod check on deployment night. |
| EAINT-12412 | TS09 Existing failed resubmitted | No | Resubmit submits to LHDN. EAINT-12554 open. |
| EAINT-12412 | TS10 Finance reports | Next day | e-Invoice / Consolidated listing, 1 row 21.60. |
| EAINT-12412 | TS11 Download Payment Document | Later | After the deployment week ends. |
| EAINT-12412 | TS12 Other products keep layout | Partial | Download existing eSTM invoices only. No purchase. |
