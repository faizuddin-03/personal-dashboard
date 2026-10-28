# Addenda — facts found while writing flow-secarang-insurance.md / flow-cibo.md that belong in files this agent did not own

Each entry: target file → section → text to add (provenance included).

## knowledge/eauto-payments.md → § "The important capability: gateway payment is already automated"

1. Add after the 4-step list: "Full page-by-page flow, verbatim selectors with
   file:line, config knobs and the unconfirmed GrabPay / card / failed-page
   handles: [flow-secarang-insurance.md](flow-secarang-insurance.md)."
2. Correct the implied scope: the chain is verified for **FPX only**. The Fiuu
   e-wallet and card popups have never been captured; `scripts/eauto-12107/pages/FiuuSandboxPage.ts:6-16`
   says so verbatim ("ENTIRELY UNCONFIRMED — no capture of this popup exists yet").
3. `[verified]` There is **no stop-before-payment switch** in either Secarang
   project (unlike `E2E_STOP_BEFORE_PAYMENT` in eauto-e2e). grep 2026-10-15.

## knowledge/eauto-payments.md → § "CIBO Payment Mode column format (EAINT-12327)"

4. Item 7 "Not in the SRD": add "**BoldPay as a Secarang gateway.** The 12107
   SRD §2.2.2 says the Secarang payment page offers only Credit/Debit Card and
   FPX (Fiuu); 12327 lists BoldPay TouchNGo / FPX / MBBMGATE_MS. Whether BoldPay
   is a second live Secarang gateway, a historical one, or another front is
   `[unconfirmed]` — ask Lim Yi Link together with the missing Fiuu card/FPX
   string."

## knowledge/eauto-portals.md → portal list (the CIBO bullet)

5. Add a sibling bullet: "**Secarang** — **not an eAuto portal.** The public
   (B2C) insurance site: no user login, staging site-password gate only, Angular
   SPA, Fiuu-hosted payment. Same insurers as eAuto; its transactions appear only
   in CIBO. See [flow-secarang-insurance.md](flow-secarang-insurance.md).
   `[verified: scripts/secarang-insurance/fixtures/sessionFixture.ts:6-8; SRD EAINT-12151 §2.1.1]`"

## knowledge/quirks.md → § Dates, after "A From/To date search accepts at most ONE MONTH"

6. "**CIBO is not covered by that rule yet.** The one-month rule was stated for
   eAuto modules. The EAINT-12151 SRD (§2.1.1 assumption 2) only says CIBO's
   From/Till validation is 'the existing Transaction Listing filter behaviour',
   and the signed-off 12151 TS05 uses 1 Aug–28 Sep 2026. Treat CIBO's limit as
   `[unconfirmed]`; use one month until proven otherwise. `[from SRD EAINT-12151; TS 12151_TS05]`"

## knowledge/quirks.md → new § "Secarang (Angular)"

7. "Responsive duplicates: the bank grid and quotation cards render a hidden
   second copy — scope banks to `.d-md-block`, iterate cards with `isVisible()`.
   `[verified: scripts/secarang-insurance/pages/PaymentTypePage.ts:33-34; QuotationPage.ts:120-128]`"
8. "The three home-form inputs have no id/name/placeholder — positional only;
   read each value back after filling. `[verified: HomePage.ts:12-14,95-119]`"
9. "The staging site-password gate reappears on the Fiuu popup and on the
   success page. `[verified: BankLoginPage.ts:11-13; PaymentSuccessPage.ts:33-34,43-44]`"
10. "The Fiuu popup closes itself after Pay Now — check `isClosed()` before
    any page call. `[verified: BankTACPage.ts:84-95]`"

## knowledge/flow-eauto-insurance-enquiry.md → "Payment Report (Pemaju)" paragraph

11. Cross-reference: "Not the CIBO Payment Report — that is a different page in a
    different system (see [flow-cibo.md](flow-cibo.md) §4.6). Both carry a
    Payment Mode / insurer column; do not conflate test evidence."

## knowledge/flow-insurance-purchase.md → § not covered, the "BO-side and CIBO views" bullet

12. Point the CIBO half at [flow-cibo.md](flow-cibo.md) instead of cibo.md only.

## knowledge/flows.md → "Modules with no flow document yet"

13. Remove "CIBO, Secarang" from the list (both now have one; CIBO's is
    mockup-sourced, Secarang's is code-sourced with no live HTML).

## lib/ticketStudies.ts → EAINT-12107 entry, `automation.blockers`

14. Add: "No Secarang HTML captured either — the GrabPay tile, Full Amount
    sub-option, Fiuu e-wallet popup, card popup and failed page are driven by
    unconfirmed selectors (`scripts/eauto-12107/pages/PaymentTypePage.ts:7-13`,
    `FiuuSandboxPage.ts:8-16`, `PaymentFailedPage.ts:10-12`)."

## _reference/html/README.md (not edited — read-only rule)

15. First-visit capture list for Secarang (`_reference/html/secarang/`): home
    form, vehicle details, quotation cards, add-ons, confirmation, select payment
    method (post-12107), Fiuu FPX login + TAC popup, Fiuu e-wallet popup, Fiuu
    card popup, payment success, payment failed. For CIBO (`_reference/html/cibo/`):
    login, Transaction Management (filters + listing), Transaction Details,
    Payment Management, Payment Report, plus one real export file of each listing.
