<!--
OFFICIAL test script for EAINT-12153 — the one the team follows (Faizuddin,
2026-10-21: "this will be the current TS we will follow ... after i consulted
with others").
Source: QATeam SharePoint
  /sites/QATeam/Shared Documents/1. eAuto Project/eAuto - CR Test Scenarios/
  EAINT-12153 - 🔴[eAuto-Application] Add Payment Channels for Pre-application and Application.xlsx
  version 38.0, last modified 2026-10-21T05:02:42Z. Read via SharePoint REST, cell text only.
Trimmed: in-cell bold/colour is not kept. Column F (Continuation Steps) is
identical in every row and is written once below. Nothing else trimmed; typos
kept as in the sheet ("Unsuccessfull", "sanbox", repeated step numbers).
The xlsx itself lives only on SharePoint — re-read it there before quoting a
cell for a defect.
-->

# EAINT-12153 — official TS (SharePoint v38, 2026-10-21)

Sheet1. Columns: A TS No. · B Scenario · C Initial Steps · D/E Pre-Application Payment (Test Steps / Expected Result) · F Continuation Steps · G/H Application Payment (Test Steps / Expected Result) · I QA · J Status (Pass/Fail) · K Remarks. No REGRESSION banner row in this sheet. All J = "Not Started"; K empty.

## Column F — Continuation Steps (same in every row)
1. BO - Open Application Listing and view Pre-Application tab
2. BO - Copy the Application Link and open in a new tab
3. UCD - Fill in the application details until complete
4. BO (mfared) - Set UCD group to Authorized Dealer and click "Submit For Approval"
5. BO (jasons) - Click the Approve button in the BO Application form
6. UCD - Refresh the Application Link and upload the documents in Page 4
7. BO (mfared) - Open the Application Details > Registration Documents tab > Click Verified
8. UCD - Refresh the Application Link and Ensure system redirects to Application Page 5

## Column C — Initial Steps pattern
1. Open eAuto Login page and click "Apply eAuto". Complete Captcha verification
2. Fill in the Pre-Application form (<business type>) and click next
3. Tick the Declaration statement box

## 12153_TS1 (row 4)
- B: Payment Method : FPX (B2B) / Bank : Maybank, CIMB Bank / Payment Status : Success
- C: business type Sdn Bhd / Bhd
- D: 1. Select FPX (B2B) 2. Select Bank (Maybank) 3. Click "Submit and Pay" 4. Log in the payment sandbox 5. Complete TAC and choose Payment Status = Success 6. Complete payment 7. At the payment details page, download invoice and e-invoice
- E: 1. After click "Submit and Pay", the Fiuu sandbox will open the Maybank sandbox portal 2. After completing payment, system will display the confirmation page "Pre-Application Submitted for Review" 3. Ensure the details of the Invoice and e-Invoice is correct 4. Ensure in Pre-Application listing, it is Status = Approved
- G: 1. Select FPX (B2B) 2. Select Bank (CIMB Bank) 3. Click "Submit and Pay" 4. Log in the payment sandbox 5. Complete TAC and choose Payment Status = Approved 6. Complete payment 7. Download the invoice and e-invoice
- H: 1. After click "Submit and Pay", the Fiuu sandbox will open the CIMB Bank sandbox portal 2. After completing payment, system will display Application Payment Success page 3. Ensure the details of the Invoice and e-Invoice is correct 4. Ensure in Pre-Application listing, it is Status = Approved and Registration Fee = OK

## 12153_TS2 (row 5)
- B: Payment Method : FPX (B2B) / Bank : AmBank, Public Bank / Payment Status : Failed
- C: Sole Proprietorship / Partnership
- D: 1. Select FPX (B2B) 2. Select Bank (AmBank) 3. Click "Submit and Pay" 4. Log in the payment sandbox 5. Complete TAC and choose Payment Status = Failed (any failed status) 6. Observe the error message 7. Redo Payment until Payment Status = Success 8. At the payment details page, download invoice and e-invoice
- E: 1. After click "Submit and Pay", the Fiuu sandbox will open the AmBank sandbox portal 2. If Payment = Failed, system will redirect to Pre-Application page 2 (Business Info Review) with error message as below: "Unsuccessfull Payment / Something went wrong and your payment didn’t go through. Please choose a payment method and retry." 3. Ensure the details of the Invoice and e-Invoice is correct 4. Ensure in Pre-Application listing, it is Status = Approved
- G: same as D with Public Bank
- H: 1. After click "Submit and Pay", the Fiuu sandbox will open the Public Bank sandbox portal 2. If Payment = Failed, system will redirect to Application Page 5 with error message as below: (same message) 3. Ensure the details of the Invoice and e-Invoice is correct 4. Ensure in Pre-Application listing, it is Status = Approved

## 12153_TS3 (row 6) — B2B pending, revisit
- B: Payment Method : FPX (B2B) / Bank : AmBank, Public Bank / Payment Status : Pending Approval (revisit) > Approved
- C: Sole Proprietorship / Partnership
- D: 1. Select Online Banking (Business) 2. Select Bank (AmBank) 3. Click "Submit and Pay" 4. Log in the payment sandbox 5. Complete TAC and leave the payment Pending Approval (B2B simulator) 6. Close the tab and reopen the page from the email link 7. Approve the transaction as authorizer (B2B simulator) 8. Refresh the page 9. At the payment details page, download invoice and e-invoice
- E: 1. After click "Submit and Pay", the Fiuu sandbox will open the AmBank sandbox portal 2. System will display the "Payment is Pending Approval" page, Payment Status = Pending Approval 3. Email link opens the Payment is Pending Approval page 4. After approval, system will display the confirmation page "Pre-Application Submitted for Review" 5. Ensure the details of the Invoice and e-Invoice is correct 6. Ensure in Pre-Application listing, it is Status = New
- G: same as D with Public Bank; step 6 "Close the tab and reopen the Application Link from the email link"
- H: 1. ... Public Bank sandbox portal 2. System will display the "Payment is Pending Approval" page, Payment Status = Pending Approval 3. Email link opens the Payment is Pending Approval page 4. After approval, system will display Application Payment Success page 5. Ensure the details of the Invoice and e-Invoice is correct 6. Ensure in Application listing, it is Status = Approved and Registration Fee = OK

## 12153_TS4 (row 7) — B2B failed > success
- B: Payment Method : FPX (B2B) / Bank : HSBC, Affin Bank / Payment Status : Failed > Success
- C: LLP
- D: 1. Select Online Banking (Business) 2. Select Bank (HSBC) 3. Click "Submit and Pay" 4. Log in the payment sandbox 5. Complete TAC and choose Payment Status = Failed (any failed status) 6. Observe the error message 7. Redo Payment until Payment Status = Success, then approve as authorizer 8. At the payment details page, download invoice and e-invoice
- E: 1. ... HSBC sandbox portal 2. If Payment = Failed, system will redirect to Pre-Application page 2 (Business Info Review) with error message as below: "Unsuccessful Payment / Something went wrong ..." 3. After approval, system will display the confirmation page "Pre-Application Submitted for Review" 4. Ensure the details of the Invoice and e-Invoice is correct 5. Ensure in Pre-Application listing, it is Status = New
- G: same as D with Affin Bank
- H: 1. ... Affin Bank sandbox portal 2. If Payment = Failed, system will redirect to Application Page 5 with error message (Unsuccessful Payment ...) 3. After approval, system will display Application Payment Success page 4. Ensure the details of the Invoice and e-Invoice is correct 5. Ensure in Application listing, it is Status = Approved and Registration Fee = OK

## 12153_TS5 (row 8) — FPX (B2C) success
- B: Payment Method : FPX (B2C) / Bank : RHB, HongLeong Bank / Payment Status : Success · C: LLP
- D/G: Select FPX (B2C), bank RHB / HongLeong Bank, Submit and Pay, sandbox, TAC Success (G says "Approved"), complete, download invoice and e-invoice
- E: sandbox opens RHB portal; "Pre-Application Submitted for Review"; Invoice and e-Invoice correct; Pre-Application listing Status = Approved
- H: sandbox opens HongLeong Bank portal; Application Payment Success page; Invoice and e-Invoice correct; "Ensure in Pre-Application listing, it is Status = Approved and Registration Fee = OK"

## 12153_TS6 (row 9) — FPX (B2C) failed
- B: Payment Method : FPX (B2C) / Bank : HSBC, Affin Bank / Payment Status : Failed · C: Business Trading (Sabah)
- D/G: Select FPX (B2C), HSBC / Affin Bank, Submit and Pay, sandbox, TAC Failed (any failed status), observe error, redo until Success, download invoice and e-invoice
- E: HSBC portal; redirect to Pre-Application page 2 (Business Info Review) with "Unsuccessfull Payment ..." ; Invoice and e-Invoice correct; Pre-Application listing Status = Approved
- H: Affin Bank portal; redirect to Application Page 5 with same message; Invoice and e-Invoice correct; "Ensure in Pre-Application listing, it is Status = Approved"

## 12153_TS7 (row 10) — Card (Credit) VISA success
- B: Payment Method : Card (Credit) / Card Type : VISA / Payment Status : Success · C: Business Trading (Sarawak)
- D/G: 1. Select "Credit or Debit Card" 2. Enter correct card details (Credit Card Details) 3. Click "Pay MYR XXX.XX" 4. At the payment details page, download invoice and e-invoice
- E: 1. After click "Submit and Pay", the sandbox will open the card payment portal 2. "Pre-Application Submitted for Review" 3. Invoice and e-Invoice correct 4. Pre-Application listing Status = Approved
- H: card payment portal ("sanbox"); Application Payment Success page; Invoice and e-Invoice correct; "Ensure in Pre-Application listing, it is Status = Approved and Registration Fee = OK"

## 12153_TS8 (row 11) — Card (Debit) Mastercard failed > success
- B: Payment Method : Card (Debit) / Card Type : Mastercard / Payment Status : Failed > Success · C: Sdn Bhd / Bhd
- D/G: 1. Select "Credit or Debit Card" 2. Enter invalid card details (Debit Card Details) 3. Click "Pay MYR XXX.XX" 4. Observe the error message 5. Redo payment until Payment Status = Success 4. Complete payment 5. At the payment details page, download invoice and e-invoice
- E: 1. ... card payment portal 2. If Payment = Failed, system will redirect to Pre-Application page 2 (Business Info Review) with error message as below: "To confirm the exact error message" 3. Invoice and e-Invoice correct 4. Pre-Application listing Status = Approved
- H: card payment portal; redirect to Application Page 5 with "Unsuccessfull Payment ..." ; Invoice and e-Invoice correct; "Ensure in Pre-Application listing, it is Status = Approved"

## Notes (rows 13–15)
- B13: Sandbox Creds: username : Gaara / p/w : letmepaywithsand
- B14: Card Details (Cannot remember either Razorpay or Fiuu. Need to confirm first): Expiry date of the card must be valid values. Positive: Mastercard 5105105105105100 (CVV 444), VISA 4111111111111111 (CVV 111). Negative: Mastercard 5555555555554440 (CVV 444), VISA 4111111111111110 (CVV 111)
- B15: "Update the B2B TS with the new requirements - Confirm with dev whether or not the new requirements have different UI to be tested, or only from Fiuu side [Answer: the popup page from Fiuu side only]"
