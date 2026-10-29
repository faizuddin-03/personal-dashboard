# EAINT-12257 — QA Team test script study (2026-10-27)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-12257 -🔴[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application.md` (text copy dated 27/10/2026, 6:45:04 pm; cell text only, no formatting). Row numbers below are the "R" numbers in that copy.
2. **Older official TS snapshot:** `_reference/tickets/EAINT-12257/EAINT-12257-official-TS-sharepoint-v19-20261021.md` (v19, 2026-10-21).
3. **SRD text:** `_reference/tickets/EAINT-12257/EAINT-12257-SRD-v1.0-20260910-text.md`.
4. **Handoff:** `_reference/tickets/EAINT-12257/Session-Handoff-2026-10-26-12257.md`.
5. **Knowledge:** `knowledge/flow-payment-channels.md` (§4f–4h and the 2026-10-23 / 2026-10-26 / 2026-10-27 sections); `lib/ticketStudies.ts` entry `EAINT-12257` (line 1239 on).
6. **Not read:** the `.xlsx` itself (cell colours / bold lost in the text copy); `_reference/tickets/Studying/EAINT-12257/` files beyond their names; the SRD PDF (text copy used instead).

## 1. Header

1. **Ticket:** EAINT-12257 — "[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application".
2. **Module / portal:** UCD onboarding — **Pre-Application** (public "Apply eAuto" flow) and **Application** (UCD application link, page 5 payment). BO used for listings and approvals.
3. **Workbook:** "EAINT-12257 -🔴[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 27/10/2026, 10:24:06 am.
4. **Sheets:** one — **Sheet1**.
5. **Columns (R2/R3):** TS No. | Scenario | Initial Steps | Pre-Application Payment (Test Steps, Expected Result) | Continuation Steps | Application Payment (Test Steps, Expected Result) | QA | Status (Pass/Fail) | Remarks.
6. **Scenarios:** **13** — TS1–TS5 (new DuitNow QR), REGRESSION banner at R9, TS6–TS13.
7. **Results (column J):**
   1. **Pass: 10** — TS1, TS2, TS3, TS4, TS6, TS7, TS8, TS9, TS10, TS11.
   2. **Fail: 2** — TS5 (Timer Expiry), TS12 (Cancel + reopen).
   3. **Not Started: 1** — TS13.
8. **Tester:** "Faiz" in the QA column on every row. No test dates written in the sheet.
9. **Remarks column:** empty on every TS row.

## 2. What the ticket changed, as the TS shows it

1. **New payment tile "DuitNow QR"** on both the Pre-Application fee and the Application (Registration) fee. TS1 R4 D1: "Select Online Banking (Personal), then select DuitNow QR".
2. **QR shown by the Fiuu sandbox.** Every QR row, E1 / H1: "After click "DuitNow QR", the Fiuu sandbox will display the DuitNow QR Code".
3. **Payment decided on a phone**, not in the browser. TS1 R4 D3: "Open the Fiuu QR app on phone and choose Payment = Success"; every QR cell ends "Open on phone: https://bank-simulator.fiuu.com/duitnow/viewqr".
4. **Four failure paths tested:** phone Reject (TS2, TS11), Cancel Transaction (TS3, TS12), close QR window (TS4), timer expiry (TS5, TS13).
5. **Existing channels kept as regression:** FPX (B2C), Card credit/debit, FPX (B2B) — TS6–TS10.

## 3. Scenarios

### A. New — DuitNow QR (R4–R8)

1. **12257_TS1** (R4) — Happy flow, Sdn Bhd / Bhd, Android on Pre-App, iPhone on Application. Expected: "Pre-Application Submitted for Review" then "Application Payment Success page"; H4 "Status = Approved and Registration Fee = OK". **Pass.**
2. **12257_TS2** (R5) — Reject on phone, then retry Success. Expected E2: "error message "[Follow existing system behaviour]""; E3 "Ensure Payment = Failed"; H4 "Application Submitted for Review". **Pass.**
3. **12257_TS3** (R6) — Cancel Transaction, then retry. Expected E2: "system will return to Pre-Application page 2 (Business Info Review) with the Declaration statement box unticked. No error message is displayed (follow existing behaviour)"; H2 "system will return to Application Page 5. No error message is displayed (follow existing behaviour)". **Pass.**
4. **12257_TS4** (R7) — Close QR Code window, then retry. Expected E2: "system will return to Pre-Application page 2 (Business Info Review). No error message is displayed (follow existing behaviour)". **Pass.**
5. **12257_TS5** (R8) — Timer expiry, then retry. Expected E2: "Unsuccessfull Payment ⏎ Something went wrong and your payment didn’t go through. Please choose a payment method and retry."; E3 "Ensure Payment = Failed". **Fail.**

### B. Regression — existing channels (R10–R14)

1. **12257_TS6** (R10) — FPX (B2C), RHB → HongLeong Bank, Success, LLP. Expected: bank sandbox portal opens, success pages. **Pass.**
2. **12257_TS7** (R11) — FPX (B2C), HSBC → Affin Bank, Failed then Success, Business Trading (Sabah). Expected E2: "system will redirect to Pre-Application page 2 (Business Info Review) with error message as below: Unsuccessfull Payment …". **Pass.**
3. **12257_TS8** (R12) — Card (Credit) VISA, Success, Business Trading (Sarawak). **Pass.**
4. **12257_TS9** (R13) — Card (Debit) Mastercard, Failed > Success, Sdn Bhd / Bhd. Same "Unsuccessfull Payment" message on failure. **Pass.**
5. **12257_TS10** (R14) — FPX (B2B), Maybank → CIMB Bank, Business Trading (Sarawak). Expected E2: "Payment follows the existing Online Banking (Business) flow (EAINT-12153 Pending Approval page if deployed)". **Pass.**

### C. Added retry / BO checks (R15–R17)

1. **12257_TS11** (R15) — Reject then retry, Sole Proprietorship / Partnership; checks BO Payment Details. Expected E5: "In BO, the Payment Details section shows the same Payment ID and Date/Time as the payment details page, with Payment Method = DuitNow QR and Payment Status = Paid". **Pass.**
2. **12257_TS12** (R16) — Cancel, close browser, reopen link, retry, LLP. Expected E3: "After reopening the link, system will display Pre-Application page 2 (Business Info Review) with the payment methods"; H3 "system will display Application Page 5 with the payment methods". **Fail.**
3. **12257_TS13** (R17) — Timer expiry with BO listing checks, Business Trading (Sabah). Expected E3: "Before retry payment, the company is not displayed in Pre-Application listing"; H3 "Before retry payment, Application listing shows Registration Fee = Failed". **Not Started.**

## 4. Business rules and system behaviour the TS reveals

1. **Pre-App success page** is "Pre-Application Submitted for Review" (TS1 R4 E2). SRD REQ-004 calls it "the Pre-Application Summary page".
2. **Application success page** is "Application Payment Success page" (TS1 R4 H2). TS2–TS5 H4 instead say "Application Submitted for Review" — two different names for the same step in one sheet.
3. **Shared failure message** (TS5 R8 E2, TS7 R11 E2, TS9 R13 E2): "Unsuccessfull Payment ⏎ Something went wrong and your payment didn’t go through. Please choose a payment method and retry." TS11–TS13 spell it "Unsuccessful Payment".
4. **Failed Pre-App payment returns to page 2 (Business Info Review)**; failed Application payment returns to **Application Page 5** (TS7 R11 E2 / H2).
5. **Cancel on Pre-App unticks the declaration** (TS3 R6 E2): "with the Declaration statement box unticked".
6. **Cancel / close show no message** in this sheet version: Faiz's Note R25 "Cancel the payment | Failed | No error message - follow existing behaviour (EAINT-12625, 26/10/2026)" and R26 "Close the QR Code window | Failed | No error message - follow existing behaviour (EAINT-12625, 26/10/2026)".
7. **Payment status after each failure** (Faiz's Note R23–R26): "Wait for the timer to end | Failed", "Cancel the payment | Failed", "Close the QR Code window | Failed".
8. **Pass/fail is set on the phone** (R27): "3. Where to set the payment pass/failed | In phone".
9. **Unpaid Pre-App is not listed in BO** (TS13 R17 E3): "Before retry payment, the company is not displayed in Pre-Application listing"; after paying E5 "the company is displayed in Pre-Application listing with Status = New".
10. **BO Application listing has a Registration Fee filter** (TS13 R17 G6 / G8): "Filter Registration Fee = Failed and click Search", "Filter Registration Fee = OK".
11. **BO Payment Details** shows Payment ID, Date/Time, Payment Method "DuitNow QR", Payment Status "Paid" (TS11 R15 E5).
12. **Reopened link resumes on the payment step** (TS12 R16 E3 / H3), with payment methods shown.
13. **Application approval chain** (Continuation Steps, every row): "BO (mfared) - Set UCD group to Authorized Dealer and click "Submit For Approval"" → "BO (jasons) - Click the Approve button" → UCD uploads Page 4 documents → "BO (mfared) - Open the Application Details > Registration Documents tab > Click Verified" → "Ensure system redirects to Application Page 5".

## 5. Test data, environments, accounts, setup

1. **Environment:** not written in the sheet. Staging per knowledge (`staging.eauto.my/obs/preOnb/...`, `knowledge/flow-payment-channels.md` §4h).
2. **Company types:** Sdn Bhd / Bhd (TS1–TS5, TS9), LLP (TS6, TS12), Business Trading (Sabah) (TS7, TS13), Business Trading (Sarawak) (TS8, TS10), Sole Proprietorship / Partnership (TS11).
3. **BO accounts:** usernames "mfared" (submit, verify) and "jasons" (approve). **No passwords in the sheet.**
4. **Phone simulator:** "https://bank-simulator.fiuu.com/duitnow/viewqr"; Android and iPhone alternated per leg.
5. **Banks:** RHB, HongLeong Bank, HSBC, Affin Bank (B2C); Maybank, CIMB Bank (B2B).
6. **Cards:** VISA credit (success), Mastercard debit with "invalid card details" (failure). Card numbers not in the sheet.
7. **Invoice / e-Invoice download** on every row.

## 6. Gaps and risks a regression should still cover

1. **Rule drift on Cancel / close.** The sheet (10:24 am, 27/10) says no message. Later the same day the rule changed: "update rule for the qr close popup and cancel payment, both will show error message. so considered as pass" `[knowledge/flow-payment-channels.md item 13, from Faizuddin 2026-10-27]`. TS3, TS4, TS12 and Faiz's Note R25/R26 are now out of date.
2. **TS12 marked Fail** in the sheet. Under the newer rule the 10-27 run showing the message is "usable" evidence `[knowledge/flow-payment-channels.md item 15]`. The sheet status may need updating `[unconfirmed]`.
3. **TS3 / TS4 marked Pass** on 10-26 runs that showed **no** message. Knowledge item 15: they "need a rerun under the new rule".
4. **TS5 marked Fail** (EAINT-12627). Knowledge item 8 says on 2026-10-27 "12257_TS05 timer expiry showed the message (EAINT-12627 looks fixed)". Rerun and update.
5. **TS13 expects Registration Fee = Failed** (R17 H3, H4). Knowledge item 16: "timer expiry on the Application leg leaves BO Registration Fee = Pending UCD, not Failed (Faizuddin, confirmed with BA, 2026-10-27)". TS13 text is out of date; still Not Started.
6. **Faiz's Note says timer / cancel / close = "Failed"** (R24–R26). The 2026-10-23 trace saw Cancel and timer return **PENDING** `[knowledge/flow-payment-channels.md "DuitNow QR Cancel returns PENDING, not FAILED"]`. Conflict not settled in the sheet.
7. **SRD open items not tested:** REQ §2.2.6 "Payment amount display" and the "Do Not Refresh!" refresh / Back / duplicate-payment question. No TS covers refresh, Back, or the 03:00 timer text from REQ-003 ("Scan QR in mm:ss").
8. **FPX B2B cancel / close** shows no message `[knowledge item 14]`; no TS covers it.
9. **Sheet text errors** that can mislead a tester:
   1. TS5 R8 G4 says "BO - Pre-Application Listing" on the Application leg.
   2. TS6–TS9 H4 say "Pre-Application listing … Registration Fee = OK" on the Application leg.
   3. TS8 / TS9 E1 say "After click "Submit and Pay"" but the step is "Click "Pay MYR XXX.XX"".
   4. TS9 R13 step numbers repeat ("4. … 5. … 4. … 5.").
   5. TS13 R17 E5 "Status = New" then E7 "Status = Approved" in one leg.
10. **e-Invoice** cannot be downloaded on staging (TIN issue) and was accepted as pass `[knowledge/flow-payment-channels.md line 520, Faizuddin 2026-10-22]`. Every row still asks to check it.
11. **Production:** Fiuu had not enabled DuitNow QR in prod as of Teams 19 Aug; nothing newer `[handoff item 10, unconfirmed]`.

## 7. Changes against existing knowledge

1. **Renumbering since v19.** v19 had no TS10 and FPX B2B was TS11 `[v19 snapshot line 62-63]`. The live sheet has **TS10 = FPX B2B**, **TS11 = Reject + BO Payment Details**, **TS12 = Cancel + reopen**, **TS13 = Timer + BO listing**. `knowledge/flow-payment-channels.md` line 55 still reads "TS1–TS9, TS11 (no TS10)" at v19.
2. **TS11–TS13 are now official.** Knowledge line 472 calls the 12257_TS11–TS13 suggestions "not yet in the official sheets". They are in Sheet1 R15–R17.
3. **v19 TS3/TS4 expected the error message and a BO Failed check.** The live sheet removed both (matches knowledge item 5, v27 changes).

## Knowledge candidates

1. **Official TS layout now 13 rows** (TS1–TS13, REGRESSION at R9; TS10 = FPX B2B; TS11–TS13 added). Source: SharePoint workbook modified 27/10/2026 10:24:06 am, Sheet1 R4–R17. Target: `knowledge/flow-payment-channels.md` line 55 table and line 472.
2. **Sheet results as of 27/10/2026 10:24 am:** 10 Pass, 2 Fail (TS5, TS12), 1 Not Started (TS13). Source: Sheet1 column J.
3. **Unpaid Pre-Application does not appear in BO Pre-Application listing; after payment it appears with Status = New.** Source: Sheet1 R17 E3 / E5, "Before retry payment, the company is not displayed in Pre-Application listing" / "the company is displayed in Pre-Application listing with Status = New". Tag `[unconfirmed]` until TS13 runs.
4. **BO Payment Details for a DuitNow QR payment:** "Payment Method = DuitNow QR and Payment Status = Paid", Payment ID and Date/Time match the UCD payment details page. Source: Sheet1 R15 E5; TS11 marked Pass.
5. **Sheet lags the 2026-10-27 rule change** on Cancel / close (R6, R7, R16, R25, R26 still say no message) and on TS13 Registration Fee (R17 H3 says Failed, BA says Pending UCD). Source: Sheet1 rows named vs `knowledge/flow-payment-channels.md` items 13 and 16.
