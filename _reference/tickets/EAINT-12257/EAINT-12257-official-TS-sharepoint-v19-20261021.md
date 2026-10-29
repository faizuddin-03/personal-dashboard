<!--
OFFICIAL test script for EAINT-12257 — the one the team follows (Faizuddin,
2026-10-21: "this will be the current TS we will follow ... after i consulted
with others").
Source: QATeam SharePoint
  /sites/QATeam/Shared Documents/1. eAuto Project/eAuto - CR Test Scenarios/
  EAINT-12257 -🔴[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application.xlsx
  version 19.0, last modified 2026-10-21T04:33:06Z. Read via SharePoint REST, cell text only.
Trimmed: in-cell bold/colour is not kept. Column F (Continuation Steps) and the
Initial Steps pattern are identical to the EAINT-12153 official TS
(EAINT-12153-official-TS-sharepoint-v38-20261021.md) and are not repeated.
Typos kept as in the sheet ("Unsuccessfull", "Andoird", "sanbox", repeated step
numbers). The xlsx lives only on SharePoint.
-->

# EAINT-12257 — official TS (SharePoint v19, 2026-10-21)

Sheet1, same 11 columns as 12153. REGRESSION banner at row 9. All J = "Not Started". Every QR test-step cell ends with "Open on phone: https://bank-simulator.fiuu.com/duitnow/viewqr".

## 12257_TS1 (row 4) — Happy Flow - Approved Payment · Sdn Bhd / Bhd
- D: 1. Select Online Banking (Personal), then select DuitNow QR 2. Click "Submit and Pay" 3. Open the Fiuu QR app on phone and choose Payment = Success 4. Scan the QR code using the phone (Android) 5. At the payment details page, download invoice and e-invoice
- E: 1. After click "DuitNow QR", the Fiuu sandbox will display the DuitNow QR Code 2. After completing payment, system will display the confirmation page "Pre-Application Submitted for Review" 3. Ensure the details of the Invoice and e-Invoice is correct 4. Ensure in Pre-Application listing, it is Status = Approved
- G: 1. Select DuitNow QR 2. Open the Fiuu QR app on phone and choose Payment = Success 3. Scan the QR code using the phone (iPhone) 4. At the payment details page, download invoice and e-invoice
- H: 1. After click "DuitNow QR", the Fiuu sandbox will display the DuitNow QR Code 2. After completing payment, system will display Application Payment Success page 3. Ensure the details of the Invoice and e-Invoice is correct 4. Ensure in Application listing, it is Status = Approved and Registration Fee = OK

## 12257_TS2 (row 5) — Negative Flow - Reject Payment & Retry Payment · Sdn Bhd / Bhd
- D: 1. Select DuitNow QR 2. Open the Fiuu QR app on phone and choose Payment = Rejected 3. Scan the QR code using the phone (iPhone) 4. Observe error message 5. Check the transaction payment status in BO - Pre-Application Listing 6. Retry with Payment = Success 7. At the payment details page, download invoice and e-invoice
- E: 1. After click "DuitNow QR", the Fiuu sandbox will display the DuitNow QR Code 2. After completing payment, system will display the confirmation page error message "[Follow existing system behaviour]" 3. In BO, check the transaction. Ensure Payment = Failed 4. After retry payment, system will display the confirmation page "Pre-Application Submitted for Review" 5. Ensure in Pre-Application listing, it is Status = Approved
- G: same as D, phone (Andoird), BO - Application Listing
- H: 1–3 as E 4. After retry payment, system will display the confirmation page "Application Submitted for Review" 5. Ensure in Application listing, it is Status = Approved

## 12257_TS3 (row 6) — Cancel transaction · Sdn Bhd / Bhd
- D: 1. Select DuitNow QR 2. Click the Cancel Transaction button 3. Observe error message in the system 4. Check the transaction payment status in BO - Pre-Application Listing 5. Retry with Payment = Success 6. At the payment details page, download invoice and e-invoice
- E: 1. After click "DuitNow QR", the Fiuu sandbox will display the DuitNow QR Code 2. After cancelling the payment, system will display the confirmation page error message "Unsuccessfull Payment / Something went wrong and your payment didn’t go through. Please choose a payment method and retry." 3. In BO, check the transaction. Ensure Payment = Failed 4. After retry payment, system will display the confirmation page "Pre-Application Submitted for Review" 5. Ensure in Pre-Application listing, it is Status = Approved
- G/H: same on the Application leg; H4 "Application Submitted for Review"; H5 Application listing Status = Approved

## 12257_TS4 (row 7) — Close QR Code Window · Sdn Bhd / Bhd
- D: 1. Select DuitNow QR 2. Close the QR Code window 3. Observe error message in the system 4. Check ... BO - Pre-Application Listing 5. Retry with Payment = Success 6. download invoice and e-invoice
- E: 1. QR Code displayed 2. "After cancelling the payment, system will display the confirmation page error message:" Unsuccessfull Payment ... 3. Ensure Payment = Failed 4. "Pre-Application Submitted for Review" 5. Pre-Application listing Status = Approved
- G/H: same on the Application leg; H4 "Application Submitted for Review"

## 12257_TS5 (row 8) — Timer Expiry · Sdn Bhd / Bhd
- D: 1. Select DuitNow QR 2. Wait until the timer expire 3. Observe error message in the system 4. Check ... BO - Pre-Application Listing 5. Retry with Payment = Success 6. download invoice and e-invoice
- E: 1. QR Code displayed 2. After the timer expire, error message Unsuccessfull Payment ... 3. Ensure Payment = Failed 4. "Pre-Application Submitted for Review" 5. Pre-Application listing Status = Approved
- G: same as D (step 4 also says "BO - Pre-Application Listing")
- H: same; H4 "Application Submitted for Review"; H5 Application listing Status = Approved

## REGRESSION (row 9)

## 12257_TS6 (row 10) — FPX (B2C) RHB, HongLeong Bank, Success · LLP
Same text as 12153_TS5 (E4 Pre-Application listing Status = Approved; H4 "Ensure in Pre-Application listing, it is Status = Approved and Registration Fee = OK").

## 12257_TS7 (row 11) — FPX (B2C) HSBC, Affin Bank, Failed · Business Trading (Sabah)
Same text as 12153_TS6.

## 12257_TS8 (row 12) — Card (Credit) VISA Success · Business Trading (Sarawak)
Same text as 12153_TS7.

## 12257_TS9 (row 13) — Card (Debit) Mastercard Failed > Success · Sdn Bhd / Bhd
Same as 12153_TS8 except E13 item 2 has the full message: "Unsuccessfull Payment / Something went wrong and your payment didn’t go through. Please choose a payment method and retry."

## 12257_TS11 (row 14) — FPX (B2B) Maybank, CIMB Bank, Success · Business Trading (Sarawak)
(No TS10 in the sheet — numbering jumps from TS9 to TS11.)
- D: 1. Select Online Banking (Business) 2. Select Bank (Maybank) 3. Click "Submit and Pay" 4. Log in the payment sandbox and complete payment
- E: 1. After click "Submit and Pay", the Fiuu sandbox will open the Maybank sandbox portal 2. Payment follows the existing Online Banking (Business) flow (EAINT-12153 Pending Approval page if deployed)
- G/H: same with CIMB Bank

## Faiz's Note (rows 16–24)
- C16 "Insert Error Message Here - Confirm with dev the exact error message spelling and style" → E16 "same error message as existing behaviour"
- C17 "CONFIRMKAN LUU - Confirm the actual payment status of the transaction if user cancels the payment" → E17 "same error message as existing behaviour"
- C19 "1. The exact error message the system will display if Payment = Failed" → D19 "Same as existing - popup will disappear"
- C20 "2. The payment status if user:" — C21 Wait for the timer to end → D21 Failed; C22 Cancel the payment → D22 Failed; C23 Close the QR Code window → D23 Failed
- C24 "3. Where to set the payment pass/failed" → D24 "In phone"
