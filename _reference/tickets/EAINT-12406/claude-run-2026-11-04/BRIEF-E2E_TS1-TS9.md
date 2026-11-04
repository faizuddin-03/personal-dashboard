# Real-API run: 12406_E2E_TS1 then 12406_E2E_TS9 (step plan)

Written 2026-11-04 while the browser was busy with the 12028 run. Nothing below has run yet.

**Sources**
- Steps and points: `scripts/eauto-12406/cr/EAINT-12406/01-intake/ts.json`.
- Selectors: Azfar's page objects, `scripts/eauto-12406/automation/src/pages/secarang/*` and `pages/cibo/*`.
  He verified these on /ia/ on 29–30.10 with the simulator. The real API could change what appears,
  but not the DOM.

## Data

| What | Value | Source |
|---|---|---|
| Secarang | https://staging.secarang.com/ia/car-insurance | STATUS |
| Site password | `sitePassword` | `app/eauto/12107/page.tsx` DEFAULT_CREDS |
| Car + owner | PROCEED rows of `../secarang-insurance-checker_2026-11-02 (1).xlsx`, in order: rows 5, 6, 11, 13, 14, 15, 17, 18 … | Faizuddin 04.11 |
| Postcode | 55000 | TS steps |
| Owner name / email / phone | DEFAULT_CREDS ownerName / ownerEmail / ownerPhone. Type the phone **without the leading 0**, as the TS says. If the real API pre-fills the name, keep the API's value and note it. | Faizuddin 19.10 |
| FPX | RHB Bank, then the Fiuu Bank Simulator: login bankUsername / bankPassword, Status **00 Approved**, Request TAC, copy the TAC into Enter TAC, Pay now | DEFAULT_CREDS; `fiuu-popup.page.ts` |
| CIBO | https://staging.secarang.com/cibo/auth/login, ciboLoginId / ciboPassword | DEFAULT_CREDS |

Record the row and plate used in `SESSION-LOG.md`. Never copy the IC.

## Selectors (Azfar, verified on /ia/)

**Site gate**
- `input[type=password]` (visible), then the button "Login".

**Home**
- The form holding the "Get quotation" button.
- Inputs `formcontrolname` plateNo / (IC) / postcode. Confirm the IC field's name on the first run.
- Tab "Private Car".
- A promo pop-up arrives a moment after the page loads; close it.

**Car Details** (not always shown)
- `app-confirm-details`, then "Get quotation".

**All Quotations**
- `.insurance-card`. The insurer comes from `img[alt]`, e.g. "Allianz logo".
- Premium: `h6` containing RM.
- Sum insured: `.sum-insured select`.
- Buy button: role button /Buy/.

**Add-ons**
- `.addon-card`, with ADD / REMOVE buttons.
- Price bar: `app-price-topbar a.text-primary.pointer`.
- "Back to insurance selection".
- "Continue" (last visible). A reminder pop-up may follow.

**Confirmation**
- Owner fields: `input[formcontrolname]` name / email / phoneNo / addr1 / addr2 / addr3.
- `select[formcontrolname=gender]` (MALE / FEMALE).
- Pricing: `.pricing-details .row`. Wait for `.pricing-details .spinner-border` to go.
- Agent line: `small.agent-text`. Its 'i' is `i.bi-info-circle` in that row.
- Button "Confirm and Pay".

**Payment**
- Tiles: labels holding `input[formcontrolname=paymentType]`.
- FPX bank: label holding `input[formcontrolname=bank]`, e.g. alt "RHB Bank".
- The Fiuu window is a popup, so wait for the `page` event before the click.

**Fiuu FPX popup**
- Login: user and `input[type=password]`.
- `select#status_code` set to 00.
- `button#tac-btn` (Request TAC).
- TAC is in `input#otp` or `div.otp`.
- Type it into `input#tac_no` / `#otp-input`.
- Pay with `button#pay-btn`.

**Success**
- Text "Thank you for your purchase!".
- Receipt: button or link /Receipt/.
- Print: /Print/.

**CIBO**
- Login: two visible inputs, then "Login". It lands on /dashboard.
- Transaction Management: `input[formcontrolname=search]`, then "Search".
- Transaction Details: URL contains /transaction-details/. Buttons "Receipt" and "e-Certificate".

## 12406_E2E_TS1: FPX purchase, then CIBO (8 points)

1. `R.start('12406_E2E_TS1', situation, points)`, then `R.site('Secarang', 'real Allianz UAT API', url)`.
2. Pass the gate, choose Private Car, enter the plate, IC and 55000, then Get quotation, then Car Details if shown.
   **If Allianz has no card:** note the cards shown, then `R.finish('Allianz did not quote: row N')`.
   Start again with the next row (a new TS attempt, not a re-run to green).
3. **E1:** red box on the Allianz card (logo), then Buy. Add-ons opens for Allianz.
4. Add-ons: keep the default and wait. Screenshot the amounts, then Continue.
5. **E2:** Confirmation shows insurer Allianz and the premium = the Add-ons amount. Screenshot the breakdown
   and the agent line, then Confirm and Pay.
6. **E3:** the four tiles are Card, FPX, SPayLater and PayLater by Grab.
7. FPX, RHB, `R.payWindow` (popup): Approved 00, TAC, Pay now.
8. **E4:** the Success page with Receipt No, Purchase Date and Payment Method "Online Banking - RHB Bank".
   Download the Receipt to `downloadable/`. Open [Print receipt] if offered.
9. **E5:** the receipt PDF's Total Premium = the Confirmation total. Read it with
   `pdftotext` (poppler) from the shell after `finish`, or show it on screen.
10. `R.portal('CIBO')`, then log in. **E6:** in Transaction Management, search the plate. The row should show
    Allianz, the Serba Sentral badge, Paid, and "Insurance created". Record Payment Mode.
11. **E7:** Transaction Details: Cover Note No and Policy No are not "-" (this is Q44, now on the real API);
    Payment Ref ID has SFX (record the code).
12. **E8:** the e-Certificate and Receipt buttons are there. The e-Certificate opens a document for this plate.
13. `R.finish()`, save `finish.json`, run `node scripts/claude-run/finish-ts.mjs`, add a line to `RESULTS.md`.

Step 8 of the TS (JPJ status the next day) is recorded by hand tomorrow. It is not a point.

## 12406_E2E_TS9: Tokio Marine first, back to Allianz, add-ons, gender, PIAM (7 points)

Use the same car as TS1 or the next PROCEED row. Note which one in the log.

1. All Quotations: Tokio Marine, Buy, then on Add-ons go back. Record any "Kindly confirm your navigation" pop-up.
2. **E2:** record the Allianz sum insured options. If there is more than one, change it once and note the price.
   Then Buy Allianz.
3. **E1:** Add-ons and Confirmation are for Allianz, with no Tokio Marine name or price.
4. **E3:** tick two add-ons and note the premium each time. Untick one and note the premium.
5. Confirmation: screenshot the required "*" fields with their colour, and the agent line and commission %.
6. **E4 (the real-API point):** Total Premium with MALE, then with FEMALE. Wait for the pricing spinner.
   Set it back if needed.
7. **E5:** the PIAM 'i' pop-up names **Serba Sentral Sdn Bhd** (record the wording and the PIAM ID).
8. FPX, then Success, then the Receipt.
9. **E6 + E7:** the add-on left ticked and its amount match on Confirmation, the receipt and CIBO Transaction
   Details. Allianz shows everywhere, with no Tokio Marine.

## Known traps (from Azfar's STATUS)

- **D2:** the Allianz receipt's "Premium after NCD" is RM20 too high, and the console shows
  `TypeError … reading 'amount' at autoAddAddonIfAllianz`. Check the console during Add-ons and Confirmation.
- **Fiuu refuses over MYR 2,000** (P15). Keep a single purchase under that: no "all add-ons".
- A card payment once hung on "Just a little moment...". If that happens, record it and do not pay again.
- **Q44:** on the simulator, no cover note ever came back. If the real API returns one, that answers Q44.
- Receipts are emailed to the owner email. Azfar's went to Spam from noreplyiatest@bintangprospek.com.
