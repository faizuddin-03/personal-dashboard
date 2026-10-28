# EAINT-12153 — QA Team test script study (2026-10-27)

## Sources read

1. **Text copy** `_reference/sharepoint/qa-team-ts/EAINT-12153 - 🔴[eAuto-Application] Add Payment Channels for Pre-application and Application.md` (export 27/10/2026, 6:43:03 pm; "Cell text only, row by row; formatting and images are not kept."). Read in full.
2. **Workbook** itself (SharePoint, modified 27/10/2026, 10:48:52 am) — **not opened**; the version number is not in the text copy.
3. **Earlier snapshot** `_reference/tickets/EAINT-12153/EAINT-12153-official-TS-sharepoint-v38-20261021.md` (v38, TS1–TS8) — used to spot changes.
4. `_reference/tickets/EAINT-12153/Session-Handoff-2026-10-26-12153.md`, `_reference/tickets/Studying/EAINT-12153/EAINT-12153-study.md`, `knowledge/flow-payment-channels.md` (§0, §2, §3, §9, §9b, §9c, card section), `lib/ticketStudies.ts` (12257 entry, which records the 12153 split).
5. **Not read:** SRD PDFs v1.1 / v1.2 (already distilled in `knowledge/flow-payment-channels.md`; not re-read for this study).

Cell references below use the text copy's row numbers and the column letters from row R2/R3: **A** TS No. · **B** Scenario · **C** Initial Steps · **D/E** Pre-Application Payment (Test Steps / Expected Result) · **F** Continuation Steps · **G/H** Application Payment (Test Steps / Expected Result) · **I** QA · **J** Status (Pass/Fail) · **K** Remarks.

## 1. Header

1. **Ticket:** EAINT-12153 — "🔴[eAuto-Application] Add Payment Channels for Pre-application and Application" (Sheet1 R1).
2. **Portal / module:** UCD dealer onboarding — **Pre-Application** review payment (page 2, Business Info Review) and **Application** step 5 payment; BackOffice (BO) listings and approvals in the continuation steps.
3. **Workbook:** "EAINT-12153 - 🔴[eAuto-Application] Add Payment Channels for Pre-application and Application.xlsx", library "eAuto - CR Test Scenarios", modified 27/10/2026 10:48:52 am.
4. **Sheets:** one — **Sheet1**.
5. **Scenarios:** **12** (12153_TS1 – 12153_TS12, rows R4–R15). Notes in R17–R19. R16 is not in the copy (blank).
6. **Results (column J):** **11 Pass**, **1 Not Started** (12153_TS7), **0 Fail**.
7. **Tester (column I):** "Faiz" on every row. **No dates** written in the sheet. **Remarks (column K):** empty on every row.
8. **Change since v38 (2026-10-21):** TS9–TS12 added (these were the "Suggestion by Claude" retry rows); status column filled (v38 was all "Not Started"); TS3 D step 6 reworded (see §4 item 10).

## 2. What the ticket changed, as the TS shows it

1. **New payment methods** on both payment points: **FPX (B2B)** — also written "Online Banking (Business)" — and **Credit or Debit Card**, beside the existing **FPX (B2C)** (Sheet1 R4–R11 column B).
2. **B2B Pending Approval state:** a B2B payment can stop at a "Payment is Pending Approval" page until an authorizer approves (Sheet1 R6 E/H).
3. **Common failure handling:** a failed payment returns the user to the payment page with the "Unsuccessful Payment" message and allows a retry (R5, R7, R9, R11–R15).
4. **Retry robustness rows (TS9–TS12):** BO Payment Details after a retry, reopening the link in a new browser, a second session, and BO listing status around a failure (R12–R15).

## 3. Scenarios

Every row uses the same **Initial Steps** (column C): "1. Open eAuto Login page and click "Apply eAuto". Complete Captcha verification ⏎ 2. Fill in the Pre-Application form (<business type>) and click next ⏎ 3. Tick the Declaration statement box". Every row uses the same **Continuation Steps** (column F): BO copies the Application Link → UCD fills the application → "BO (mfared) - Set UCD group to Authorized Dealer and click "Submit For Approval"" → "BO (jasons) - Click the Approve button" → UCD uploads Page 4 documents → BO (mfared) Registration Documents "Click Verified" → "Ensure system redirects to Application Page 5".

### A. FPX (B2B) — new channel

1. **12153_TS1** (R4) — B2B, Maybank (Pre-App) / CIMB Bank (Application), Success, Sdn Bhd / Bhd. Expected: "Pre-Application Submitted for Review"; "Application Payment Success page"; "Status = Approved and Registration Fee = OK". **Pass.**
2. **12153_TS2** (R5) — B2B, AmBank / Public Bank, Failed then redo, Sole Proprietorship / Partnership. Expected: redirect to "Pre-Application page 2 (Business Info Review)" / "Application Page 5" with the "Unsuccessfull Payment" message. **Pass.**
3. **12153_TS3** (R6) — B2B, AmBank / Public Bank, "Pending Approval (revisit) > Approved", Sole Proprietorship / Partnership. Expected: "Payment is Pending Approval" page, "Payment Status = Pending Approval"; after approval the normal success page; Pre-Application listing "Status = New". **Pass.**
4. **12153_TS4** (R7) — B2B, HSBC / Affin Bank, "Failed > Success", LLP. Expected: failure message, then success after the authorizer approves; Pre-Application listing "Status = New". **Pass.**

### B. FPX (B2C) — regression

5. **12153_TS5** (R8) — B2C, RHB / HongLeong Bank, Success, LLP. Expected: normal success pages, "Registration Fee = OK". **Pass.**
6. **12153_TS6** (R9) — B2C, HSBC / Affin Bank, Failed then redo, Business Trading (Sabah). Expected: failure message on both legs. **Pass.**

### C. Card

7. **12153_TS7** (R10) — "Card (Credit)", VISA, Success, Business Trading (Sarawak). Expected: card portal opens; normal success pages. **Not Started.**
8. **12153_TS8** (R11) — "Card (Debit)", Mastercard, "Failed > Success", Sdn Bhd / Bhd. Expected (Pre-App leg): ""To confirm the exact error message""; (Application leg): "Unsuccessfull Payment" message. **Pass.**

### D. Payment retry (FPX B2C) — added after v38

9. **12153_TS9** (R12) — Maybank / CIMB Bank, "Failed > Success", "Check : BO Payment Details after redo payment". Expected: "In BO, the Payment Details section shows the same Payment ID, Payment Method and Date/Time as the payment details page, with Payment Status = Paid". **Pass.**
10. **12153_TS10** (R13) — Public Bank / AmBank, "Failed > Success", "Check : Close the browser and reopen the link". Expected: "After reopening the link, system will display Pre-Application page 2 (Business Info Review) with the payment methods" and "Application Page 5 with the payment methods". **Pass.**
11. **12153_TS11** (R14) — RHB / HongLeong Bank, Success, "Check : Pre-Application link opened in a second session". Expected: "The Incognito window shows an error message that the Pre-Application is not allowed to be edited". **Pass.**
12. **12153_TS12** (R15) — HSBC / Affin Bank, "Failed > Success", "Check : BO listing payment status". Expected: company not in Pre-Application listing before the redo, then "Status = New"; Application listing "Registration Fee = Failed", then "OK", each also through the filter. **Pass.**

### Business-type coverage

1. **Sdn Bhd / Bhd:** TS1, TS8, TS9.
2. **Sole Proprietorship / Partnership:** TS2, TS3, TS10.
3. **LLP:** TS4, TS5.
4. **Business Trading (Sabah):** TS6, TS11.
5. **Business Trading (Sarawak):** TS7, TS12.

## 4. Business rules and system behaviour the TS reveals

1. **Failure message (both legs):** "Unsuccessful Payment ⏎ Something went wrong and your payment didn’t go through. Please choose a payment method and retry." (Sheet1 R7 column E; R5/R9 spell it "Unsuccessfull").
2. **Where a failed payment returns:** Pre-Application — "Pre-Application page 2 (Business Info Review)"; Application — "Application Page 5" (Sheet1 R5 columns E and H).
3. **Success pages:** Pre-Application — "the confirmation page "Pre-Application Submitted for Review""; Application — "Application Payment Success page" (Sheet1 R4 E/H).
4. **B2B pending page:** "System will display the "Payment is Pending Approval" page, Payment Status = Pending Approval" (Sheet1 R6 E, item 2).
5. **B2B approval needs an authorizer step:** "Approve the transaction as authorizer (B2B simulator)" (Sheet1 R6 D, step 7); "Redo Payment until Payment Status = Success, then approve as authorizer" (Sheet1 R7 D, step 7).
6. **Pre-Application listing only shows paid records:** "Before redo payment, the company is not displayed in Pre-Application listing" and "After redo payment, the company is displayed in Pre-Application listing with Status = New" (Sheet1 R15 E, items 3 and 5). Matches `knowledge/flow-payment-channels.md` §9 item 5.
7. **Application listing Registration Fee tracks payment:** "Before redo payment, Application listing shows Registration Fee = Failed" and "Filter Registration Fee = OK displays the application" (Sheet1 R15 H, items 3 and 8).
8. **BO Payment Details after a retry:** "same Payment ID, Payment Method and Date/Time as the payment details page, with Payment Status = Paid" (Sheet1 R12 E, item 5).
9. **Pre-Application link is session-locked:** "The Incognito window shows an error message that the Pre-Application is not allowed to be edited" (Sheet1 R14 E, item 1). Exact on-screen wording is not in the sheet.
10. **TS3 revisit wording changed:** Pre-App step now reads "6. Close the tab and reopen the page from the link" (Sheet1 R6 D); v38 read "reopen the page from the email link". The Expected Result still says "3. Email link opens the Payment is Pending Approval page" (Sheet1 R6 E). The Application leg still says "reopen the Application Link from the email link" (Sheet1 R6 G).
11. **B2B UI scope:** "Confirm with dev whether or not the new requirements have different UI to be tested, or only from Fiuu side [Answer: the popup page from Fiuu side only]" (Sheet1 R19 column B).
12. **Card failure message still open:** Pre-App leg Expected Result is ""To confirm the exact error message"" (Sheet1 R11 E, item 2), yet the row is marked Pass.

## 5. Test data, environments, accounts, setup

1. **Environment:** not written in the sheet. Known from the repo: staging (`knowledge/flow-payment-channels.md` §0b) `[unconfirmed for this sheet]`.
2. **BO accounts:** "BO (mfared)" — Submit For Approval and Registration Documents Verified; "BO (jasons)" — Approve (Sheet1 column F, every row). No passwords in these cells.
3. **Fiuu bank sandbox:** "Sandbox Creds" with a username and password — **credentials present** (Sheet1 R17 columns B–C).
4. **Card test numbers:** "Card Details (Cannot remember either Razorpay or Fiuu. Need to confirm first)"; "Expiry date of the card must be valid values"; positive and negative Mastercard / VISA numbers with CVVs (Sheet1 R18 column B). **Credentials present** (test card data).
5. **Banks per leg:** listed per row in column B (see §3).
6. **Amount:** card steps use a placeholder, "Click "Pay MYR XXX.XX"" (Sheet1 R10 D, step 3). No fee amount is checked anywhere.

## 6. Gaps or risks a regression should still cover

1. **TS7 not run.** Card (Credit) VISA success is the only Not Started row. Deploy is 29 Oct; QA deadline EOD 28 Oct (handoff 2026-10-26).
2. **Card failure method in the notes is out of date.** R18 negative Mastercard "5555555555554440" — `knowledge/flow-payment-channels.md` (card section, 2026-10-26) says this card **does not fail**; the working method is Mastercard 5200 0000 0000 1096 + wrong OTP on 3D Secure. The sheet note was not updated.
3. **TS8 Pre-App message never pinned down** (R11 E). A regression should record the exact text shown after a failed card on the Pre-Application leg.
4. **Listing checks on the wrong listing.** TS1, TS5, TS7 H say "Ensure in Pre-Application listing, it is Status = Approved and Registration Fee = OK" (R4, R8, R10). The Pre-Application listing has **no payment column** (`knowledge/flow-payment-channels.md` §9 item 5.1). TS2, TS6, TS8 H check the Pre-Application listing on the Application leg (R5, R9, R11). `[unconfirmed]` these mean the Application listing.
5. **Pre-Application status inconsistent.** Most rows expect "Status = Approved"; TS3/TS4 expect "Status = New" (R6, R7). TS12 E expects both: "Status = New" (item 5) then "Status = Approved" (item 7) (R15). `[unconfirmed]` "Approved" is the state after the BO approval in the continuation steps.
6. **Step-label mismatches.** TS1/TS5 G step 5 "choose Payment Status = Approved" while the Pre-App leg says "Success" (R4, R8). TS7/TS8 E say "After click "Submit and Pay"" while D says "Click "Pay MYR XXX.XX"" (R10, R11). TS8 D numbers repeat ("4. … 5. … 4. … 5.").
7. **Affin naming.** TS4/TS6/TS12 still say "Affin Bank" (R7, R9, R15). Knowledge §9c item 11 says the TS bank was changed to **AffinMax**; staging still shows "Affin Bank B2B" (`FPX_B2B_ABBM`) as of 2026-10-26 (handoff open item 5).
8. **B2B banks vs simulator.** The simulator FAQ lists only Affin / Affin Multi-Bank / Hong Leong as B2B (§9c item 8.1), yet TS1 (Maybank/CIMB) passed live (§9c item 14). Which B2B banks really reach a simulator is worth one check per release `[unconfirmed]`.
9. **No row for B2B cancel / close.** Rule 2026-10-27: "for b2b, the result remain the same, closing/cancelling it wont show" (knowledge §"Closing the payment gateway page", item 14). Not in the TS.
10. **No row for B2B maker Reject vs checker Reject.** TS2/TS4 say "any failed status" only.
11. **No row for the 7-day B2B expiry** ("If it is not approved within 7 days, the payment will expire", knowledge §9c item 13.2), or for the Pending Approval **email** content (SRD §2.3 per the Studying study, item 102).
12. **No amount check** on the payment summary, invoice or e-Invoice. Registration fee changed to RM 1,500.00 on staging (knowledge §0b item 1).
13. **e-Invoice download:** every row expects it, but staging does not offer it ("the e-invoice memang kenot download. cus issue with TIN. so ignore that. consider it PASS", Faizuddin 2026-10-22, knowledge §"e-Invoice download not offered"). Pass results include that waiver.
14. **Results vs automation record.** Handoff 2026-10-26 lists TS02–TS04 failed on 23 Oct and TS10/TS11 failed on 26 Oct; the sheet now shows Pass. `[unconfirmed]` whether these were manual or later automated re-runs.

## Knowledge candidates

1. **Official 12153 TS now has TS1–TS12** (TS9–TS12 retry rows adopted). Update `knowledge/flow-payment-channels.md` §0 table (says "v38 … TS1–TS8") and §9b ("not yet in the official sheets"). Source: SharePoint text copy 27/10/2026, Sheet1 R12–R15.
2. **12153 status as of 27/10/2026:** 11 Pass, TS7 Not Started, 0 Fail. Source: Sheet1 column J, R4–R15.
3. **Pre-Application link is session-locked — TS passed:** "The Incognito window shows an error message that the Pre-Application is not allowed to be edited" (Sheet1 R14 E), J = Pass. Confirms the code-analysis claim in §9 item 3 at TS level; exact wording still to capture.
4. **Reopened link returns to the payment step with methods shown** (both legs) — TS10 Pass (Sheet1 R13 E/H). Resolves §9b item 2 "Never run live" in part; the handoff (2026-10-26) records that the reopened browser shows reCAPTCHA.
5. **BO Payment Details after a retry match the UCD page, Payment Status = Paid** — TS9 Pass (Sheet1 R12 E item 5).
6. **Application listing Registration Fee = Failed before redo, OK after, both filterable** — TS12 Pass (Sheet1 R15 H items 3, 4, 8).
7. **TS3 revisit wording changed** from "email link" to "the link" on the Pre-App leg (Sheet1 R6 D step 6); E still cites the email link. Note under §0 item 3.
8. **Sheet note R18 still lists card 5555555555554440 as the negative test**, which the card section says does not fail. Flag in the card section so nobody copies the note.
