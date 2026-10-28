# EAINT-12107 — attachments and status

## Files in this folder

| File | Source | Note |
|---|---|---|
| `SRD_EAINT-12107_[Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay_v1.1_20260911.pdf` | Jira attachment 156604 | **Latest SRD**, 22 pages, read in full 2026-09-15. |
| `EAINT-12107-study.html` | session artifact, 2026-09-15 | Study page: status banner, testability matrix, Teams timeline, REQ mapping, agreed test scope. |
| `Session-Handoff-2026-09-17-12107.md` | handoff note | Ownership and status as of 2026-09-17. |

Not in this folder: v0.1 / v0.2 / v1.0 / v1.1 `.docx` twins, `secarang_payment_channels_prototype.html` (155669), and the v1.0 PDF (156523, superseded; a copy sits in `Downloads\Chrome\`).

Download method: navigate Chrome to `https://mfservices.atlassian.net/secure/attachment/<id>/<filename>`; files land in `Downloads\Chrome\`.

## Jira (2026-10-15)

1. Status Code Review. Assignee Lim Yi Link. QA field: Muhammad Amirul Azfar Bin Kamarulazam. Dev field: Shane. Fix version "S34.X-20261020/21 🌞 TBC" (release date 2026-10-20; version description "Main item(s): 1. Secarang - ShopeePay & GrabPay 2. CIBO - Payment & Transaction Listing"). Links: "relates to" EAINT-12327.
2. Dev status field: "[Yi Link] As of 15.09.2026 (Tues) | Dev side has done code review for this ticket and it is ready for testing."
3. Comments (Shane): 2026-09-07 "changes are up in staging ya, showing both grabpay and shopeepay, all payment method working fine except for shopeepay (this 1 has to do with fiuu shopeepay, its stimulator in sandbox doesn't work as well). and as mentioned, we wont be able to select the paylater option."; 2026-09-09 "cibo staging changes are up as well, added filter for fiuu ewallet payment and introduced this payment method in transaction management."; 2026-09-09 "it's confirmed that we can disable any payment method by data patching".

## Ownership

1. 2026-09-15: handed to Amirul Azfar (May Chin Mei Theng, eAuto QAs). Faizuddin's drafted TS xlsx (E2E + negative flow; regression TS pending) shared with Azfar the same day.
2. 2026-10-15 10:11: May Chin Mei Theng asked Faizuddin to study and confirm "1 + 1 = 2 days" for this ticket, with EAINT-12327 "test together with 12107", targeting deployment 20 or 21 Oct. Kasheng Liew confirmed 2026-10-07 12:55 that both can deploy in the morning session.

## Agreed test scope (eAuto QAs chat, May Chin Mei Theng and Faizuddin, 2026-09-11)

1. E2E: GrabPay Payment OK; GrabPay Payment Failed; regression of an existing method (Card or FPX) Payment OK.
2. Dev-patched: Payment = ShopeePay; Payment = SPayLater; Payment = PayLater by Grab.
3. Functional: CIBO filter and payment-type display, including the export file.

Combined 12107 + 12327 workbook is the execution copy (2026-10-15), see below.

Full detail: `knowledge/eauto-payments.md` § "ShopeePay / GrabPay channel (EAINT-12107)".

## Test script — v0.2 (2026-10-15)

Current script: `EAINT-12107 - [Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay.xlsx` = Faizuddin's 2026-09-15 draft (9-column per-portal layout, kept as a special case) plus these edits made 2026-10-15 against the study:

1. TS01, TS02, TS07, TS08 Secarang expected: Payment Method page options now "3. ShopeePay (Full Amount / SPayLater) / 4. GrabPay (Full Amount / PayLater by Grab)" per SRD v1.1 REQ-001/002 (was "SPayLater / PayLater by Grab" as tiles).
2. TS01, TS02 steps: "Select GrabPay, then Full Amount" (only sandbox-testable option, SRD §2.2.8; was "Select PayLater by Grab").
3. Payment Reference ID "EW" (REQ-014/015) added: Transaction Details, Payment Management and Payment Report lines on TS01, TS02, TS03-05; listing & excel line on TS06 step 3-5; negative "does not contain EW" (red) on TS07, TS08.
4. Payment Report "Payment mode = Fiuu" now carries "(after EAINT-12327: Fiuu | eWallet – GrabPay – Full Amount – Single Payment)" on e-wallet rows and "(re-check once EAINT-12327 is on staging)" on TS07/TS08. Note: EAINT-12327's 7 formats list no Fiuu Credit/Debit Card or Fiuu FPX string; raise with Yi Link.
5. TS06 step 19 expected reworded to REQ-013 ("only ShopeePay is unticked; the other 3 stay ticked"); Remarks: "(Open) Whether the parent Fiuu - eWallet tick also clears is not in the SRD."

Superseded copies in this folder: `... (superseded v0.1, Faizuddin 2026-09-15 draft).xlsx` (the untouched original, with its PDF export) and `... (superseded, generated 2026-10-15 7-col).xlsx` (the generator's 12-row version, retired because the draft already covered the scope).

## Combined test script with EAINT-12327 — 2026-10-15

May Chin Mei Theng (eAuto QAs, 2026-10-15 10:11) asked for 12327 to be tested together with 12107, so the two scripts were merged into one workbook:
`EAINT-12107 + EAINT-12327 - Combined TS - [Secarang-Fiuu] ShopeePay and GrabPay + [CIBO] Payment Mode Column Format.xlsx` (this folder; copy in Faizuddin's OneDrive "20-21 October Items").

1. Rows 4-18 = 12107 v0.2 unchanged, except the Payment Report "Payment mode" lines: TS01/TS02 now state the 12327 value directly ("Fiuu = Fiuu | eWallet – GrabPay – Full Amount – Single Payment"); TS03-05 point to 12327_TS02; TS07/TS08 carry "(Open)" because 12327 has no Credit/Debit Card or FPX format string.
2. Row 19 banner "EAINT-12327 - [CIBO] PAYMENT MODE COLUMN FORMAT (TESTED TOGETHER WITH EAINT-12107)" (same purple style as REGRESSION), then rows 20-27 = 12327_TS01..TS08 in the 9-column layout. Secarang Steps column says which 12107 transaction to reuse; Secarang Expected = N/A; CIBO Steps / Expected carry the 12327 checks with bold pages/buttons and the red negative on 12327_TS05 ("No row shows "BoldPay" or "Fiuu" alone").
3. 12327_TS02 Remarks: "(Open) No format string for Fiuu Credit/Debit Card or Fiuu FPX in the EAINT-12327 SRD. Applies to 12107_TS07 / 12107_TS08."
4. Status dropdown and Pass/Fail/Not Started/In Progress colours extended to H20:H27.

The standalone 12107 v0.2 and the generated 12327 workbook stay in their folders as the per-ticket copies; the combined file is the one to execute.

## Automation — scripts/eauto-12107 (built 2026-10-15, not yet run live)

Runner page `/eauto/12107` (`app/eauto/12107/page.tsx`), routes `app/api/eauto-12107/{run,history,download-all}`, specs `scripts/eauto-12107/tests/`. Same standard flow as EAINT-12339 (queue of one TS per run call, detailed mode, per-TS evidence and zip, past runs, detailed log).

1. Automated (Secarang leg only): `12107_TS01` GrabPay Full Amount, Status = Success; `12107_TS02` GrabPay Full Amount, Status = Failed (company car, Tokio Marine); `12107_TS07` Credit or Debit Card; `12107_TS08` FPX (RHB). The chain (site gate, home form, vehicle details, quotation, add-ons, confirmation) is copied from `scripts/secarang-insurance/pages/` unchanged; `utils/secarangFlow.ts` wraps it in `test.step()` calls and `verifyPaymentSuccess()` checks the success page, premium vs confirmation page, Payment Method text and the receipt PDF (saved as `<TS>-receipt.pdf` evidence).
2. Manual: `12107_TS03-TS06` and all of `12327_TS01-TS08` (CIBO; no page objects, no captured HTML). Rendered disabled on the page.
3. **Unconfirmed selectors — capture before trusting a pass.** No Secarang HTML exists in `_reference/html/`. Guessed: the GrabPay / Credit-Debit tile (`label` with text), the "Full Amount" sub-option, a Pay/Proceed button, and the whole Fiuu e-wallet / card sandbox popup (`FiuuSandboxPage.ts` tries `select#status_code` + a Pay button, the FPX simulator's shape). Each of these logs the page text, selects and buttons on the first run. Paste the HTML of (a) the Select Payment Method page after 12107 was pushed, (b) the Fiuu GrabPay popup, (c) the Fiuu card popup, and save them under `_reference/html/secarang/`.
4. Data: private car defaults to the regression's WYN3837 / IC 730620065847 / 55000; the company car vehicle no. and SSM for TS02 have no default (type them on the page). Insurer per TS is pre-filled from the test script (Lonpac / Tokio Marine) and editable.
5. Environment default `https://staging.secarang.com/preprod` (the only Secarang host in the repo); confirm with Shane that 12107 is on it.

## CIBO automation — 2026-10-16

`scripts/eauto-12107/tests/cibo.spec.ts` (12107_TS06 + 12327_TS01-TS08), page
objects `pages/cibo/CiboPages.ts`, data `data/cibo.ts`. Built from live staging
HTML (`_reference/html/cibo/`). Findings: see `knowledge/cibo.md`
"Live staging check — 12107 + 12327 (2026-10-16)".

## TS v2 — "New 19_10_26" workbook (2026-10-19)

Checked the 2026-10-15 combined TS against the legacy-CR knowledge study (finished 2026-10-16).
New file: `New 19_10_26 - EAINT-12107 + EAINT-12327 - Combined TS - ....xlsx` (also in OneDrive "20-21 October Items"). Original untouched.

1. 12107_TS02 Secarang expected 2 → "Ensure system returns to the Select Payment Method page and another payment method can be selected" [SRD 12107 v1.1 REQ-007].
2. 12107_TS06 rows 9-13: "excel" → "exported file" (CIBO exports are CSV) [knowledge/business-rules-from-test-scenarios.md §18 item 6].
3. 12327_TS02 data item 5: BoldPay rows are Makrokiosk insurance transactions [knowledge/cibo.md, from SharePoint TS #129 EAINT-11541]. Secarang /ia is wired to prod BoldPay — do not make a new Makrokiosk payment [knowledge/environments-history.md:102].
4. 12327_TS06 expected 3-4 added: Payment Reference ID identical in the export, contains EW for Fiuu eWallet rows [SRD 12107 REQ-015 e].
5. New 12327_TS09: eAuto (RHB) and pre-cutoff Secarang (RMS) rows show a Payment Mode value, same on all 4 surfaces [EAINT-11541 values; 12327 SRD has no RHB/RMS format].

Not changed (reported for review): 12107_TS02 CIBO expected "Ensure insurance created" / "transaction created" on Payment Report for a FAILED payment (inference, medium); cancelled-payment scenario REQ-008 (outside agreed scope); Payment Method text on success page (strings unconfirmed); export column position wording.

Automation (backend only, no dashboard fields yet): 12107_TS02 now asserts the return to Select Payment Method (`PaymentFailedPage.returnToPaymentMethods()`); 12327_TS06 checks Payment Ref ID in the export; new 12327_TS09 (env `CIBO_REF_EAUTO_RHB`, `CIBO_REF_SECARANG_RMS`, mapped in the run route as `ciboRefEautoRhb` / `ciboRefSecarangRms`).

**Added 2026-10-19 (Faizuddin: "yes" to a cancel TS):** 12107_TS09 "Cancelled Pay With Grab" under a new "CANCELLED PAYMENT" banner (rows 19-20; 12327 block moved down two rows). Expected: back on Select Payment Method, quotation retained, another method selectable [SRD 12107 v1.1 REQ-008]. Automation `tests/grabpay.spec.ts` 12107_TS09 (env `SECARANG_TS09_VEHICLE_NO`; `FiuuSandboxPage.cancel()` — sandbox cancel control unconfirmed, falls back to closing the popup). No dashboard field yet.

**Updated 2026-10-19 (Faizuddin: "remove all yellow cell colour"):** yellow fill (FFFFFF00) removed from the New 19_10_26 workbook — cells E2:F3, E17:F17, E22:F30 (CIBO header and CIBO columns). Content, Status dropdown and Pass/Fail/Not Started/In Progress colours unchanged.

**Renumbered 2026-10-19 (Faizuddin: "take note of the numbering style. this is also the default style"):** 12327_TS01-TS09 → 12327_TS10-TS18 in the New 19_10_26 workbook, cross-references included (12327_TS02 → TS11, TS03 → TS12). Automation titles in scripts/eauto-12107/tests/cibo.spec.ts and /eauto/12107 still use 12327_TS01-TS09.

**Dashboard defaults + CIBO ref finder (2026-10-19, Faizuddin):** /eauto/12107 now pre-fills the Secarang link `https://staging.secarang.com/ia/car-insurance` and site password (same on /ia and /preprod), postcode 55000, a random Kuala Lumpur address (lines 1/2/3), and the CIBO staging login. A saved blank value falls back to these. The "BR…" ref boxes are optional: a blank ref is found on CIBO at run time (`scripts/eauto-12107/utils/ciboRefFinder.ts`, see knowledge/cibo.md item 13). Not run live yet.

**Owner defaults (2026-10-19, Faizuddin):** /eauto/12107 pre-fills owner name MUHAMMAD FAIZUDDIN BIN BIDI, phone 0189812839, email faizuddin@modefair.com; a saved blank value falls back to these. Inputs also carry autoComplete off / new-password so Chrome no longer fills a saved login into Base URL + Site password.

**Owner IC + running vehicle no. (2026-10-19, Faizuddin):** Owner IC default 030217141005. Private car vehicle no. = running number HXA####A, own counter (localStorage eauto_12107_vn_counter), auto-advance + lock toggle same as /eauto/12412; each private-car TS gets its own consecutive number. Not run live: knowledge/flow-secarang-insurance.md section 6 item 2 says Secarang needs a vehicle it can quote with the real owner IC.

**Live automation run (2026-10-19, Claude, CLI with the dashboard's env):** details in knowledge/cibo.md "Live run — 12107 + 12327 automation (2026-10-19)" and knowledge/flow-secarang-insurance.md §7 item 15. Automation fixes made: Paid-badge regex, sidebar links by href, Platform = Secarang for RMS rows, "Insurance created" rows for refs read on Payment Report, same-day ref cache (.cache/cibo-refs.json), clear filters after the finder, Payment Management export column "Payment Reference ID", skip export on an empty listing, soft per-ref lookup on Payment Report, phone typed without the 0, Add-ons Continue wait/retry, card tile popup, bank simulator site-gate skip, clear errors for "unable to retrieve your vehicle information" / rejected FPX login / Fiuu card form. 12327 TS timeout 18 min, 12107 run route cap 20 min. Suite needed `npx playwright install chromium` (build 1248).

**2026-10-19 decisions (Faizuddin):** run on staging /ia; Fiuu test card for 12107_TS07 to be found by Faizuddin; FPX simulator login Gaara / Letmepaywithsand (capital L) is the dashboard default.

**Automation renumbered (2026-10-19):** /eauto/12107 and scripts/eauto-12107/tests/cibo.spec.ts now use 12327_TS10-TS18 to match the workbook (TS01→10 … TS09→18).

**Company car (2026-10-19, Faizuddin):** needs a specific registered vehicle and company details, so no running number; the company vehicle no. and SSM boxes sit on the 12107_TS02 row (shown when ticked), not in the top fields.

**GrabPay tile (2026-10-19):** on /ia the GrabPay channel tile reads "PayLater by Grab" (logo alt "GrabPay") and opens the Fiuu GrabPay popup on click; ShopeePay tile reads "SPayLater" (alt "ShopeePay"). Automation matched on text "GrabPay" and wrongly reported it missing; fixed. 12107_TS01 passed (receipt 26101921300018). Page HTML saved to _reference/html/secarang/payment-methods-2026-10-19-after-failed-payment.html.

**Payment Report one-week window (2026-10-19):** applied — every Payment Report search sets Insurance Created From/Till (ref date to +6 days; TS14 page check = last 7 days). Calendar HTML at _reference/html/cibo/payment-report-datepicker-open.html. TS14/TS15/TS16 now find all insured refs; BR69006072 (ShopeePay, failed payment, no insurance) is correctly absent.

**Dev patch plan (2026-10-19):** dev will patch BR60006266 (HXA0007A) → ShopeePay, BR60006264 (HXA0016A) → GrabPay PayLater (Full Amount), BR60006259 (TEST1111UD) → GrabPay PayLater (Instalment). ShopeePay Full Amount and SPayLater both show "ShopeePay" (Fiuu confirmed). GrabPay Full Amount data: TEST1234AB, LOL122. Details in knowledge/cibo.md.

**Payment Report window changed (2026-10-19, Faizuddin):** every Payment Report search now uses the 7 days up to today; the ref finder picks transactions insured in that week for 12327_TS14-TS18. Only GrabPay Full Amount (BR60006269) has one today.

**Evening 2026-10-19:** TS11/TS14 ShopeePay line merged and TS14 bare-Fiuu check changed in the repo workbook (OneDrive copy locked); automation matches; TS18 uses a one-week window per ref; dev patch live (BR60006266 ShopeePay, BR60006259 GrabPay BNPL). TS14 + TS17 pass.

**12107_TS07 card (2026-10-19):** dashboard has a "Fiuu test card" field (default Visa 4111111111111111 / 12/next-year / 111); automation types it into the Fiuu card form. Both Fiuu test cards (Visa 4111…, Mastercard 5105…) refused with P10 "not valid". OneDrive workbook updated (ShopeePay merge, bare-Fiuu line, auto-fit + trailing line).

**2026-10-20 — 12107_TS06:** SPayLater shows as ShopeePay (Faizuddin: "both of them will show the same display"). Workbook (repo + OneDrive) and automation: old steps 12-14 replaced by one check that only GrabPay / GrabPay - PayLater by Grab / ShopeePay are listed; 15-20 → 13-18; "all 4" → "all 3". Live run: new step passes; still fails on 4 non-EW refs, BR60006259 channel "Fiuu eWallet GrabPay" under the PayLater filter, RHB/CIMB rows under the group. BR60006264 (PayLater Full Amount patch) shows the plain GrabPay Full Amount string. Details: knowledge/cibo.md.

**2026-10-20 — ShopeePay payable on /ia:** "SPayLater" tile → Fiuu QR popup → QR decodes to bank-simulator.fiuu.com/shopeepay/spsimulator → Success / Failed + "PROCEED TO PAY". Automated (PaymentTypePage.selectShopeePay, FiuuSandboxPage.openQrLink, jsQR). Live: Success → receipt 26102021300005, Payment Method "ShopeePay"; Failed → "Unsuccessful payment You may try again." Not yet wired to a TS (TS03/TS04 still say dev patch). Details: knowledge/flow-secarang-insurance.md §7 item 17.

**2026-10-20 — 12107_TS02 changed:** now "Successful Pay With ShopeePay — private car, Lonpac" (was Failed Pay With Grab, company car, Tokio Marine; Secarang has no insurer for company cars). Workbook (repo + OneDrive) row rebuilt from TS01 with ShopeePay steps (QR → simulator → PROCEED TO PAY) and CIBO "Fiuu | eWallet – ShopeePay"; automation tests/shopeepay.spec.ts. Live pass: receipt 26102021300007. GrabPay Failed is no longer covered by any TS.

## TS v3 — "New 20_10_26" workbook (2026-10-20) — CURRENT

**Current TS:** `New 20_10_26 - EAINT-12107 + EAINT-12327 - Combined TS - [Secarang-Fiuu] ShopeePay and GrabPay + [CIBO] Payment Mode Column Format.xlsx` (here and in OneDrive "20-21 October Items"). The 19_10_26 file is renamed `… (superseded v2).xlsx`.

Built from Faizuddin's pasted working copy ("start changing from here"; verbatim in `EAINT-12107-12327-current-TS-pasted-2026-10-20.txt`), formatting from the v2 workbook. Decisions (2026-10-20):
1. 12107_TS01 Successful GrabPay · TS02 Successful ShopeePay (private car, QR → simulator) · **TS03 Failed GrabPay (new)** · **TS04 Failed ShopeePay (new)** · TS05 PayLater by Grab dev patch · TS06 filter · TS07 card · TS08 FPX · TS09 Cancelled GrabPay.
2. Dropped: ShopeePay and SPayLater dev-patch TS (ShopeePay is paid for real in TS02; SPayLater shows the same value).
3. 12327_TS10-TS18 unchanged in number; TS11 uses 12107_TS01 / TS02 / TS05 + existing BoldPay; 6 Payment Mode strings ("Fiuu | eWallet – ShopeePay" once).
4. Re-applied: TS06 no SPayLater filter option; ShopeePay one value; TS09 Cancel; 12327_TS18 eAuto/RMS. Not re-applied: the bare-"Fiuu" Payment Report line.
5. Follows the paste otherwise: "listing & excel"; TS07/TS08 Payment Report ends at "Payment mode = Fiuu"; no (Open) remarks; QA "Faiz"; Pass on 12107_TS01, TS08, 12327_TS11, TS13, TS16, TS17.

Automation matches (dashboard + specs): TS03 `grabpay.spec.ts`, TS04 `shopeepay.spec.ts`, shared `utils/verifyPaymentFailed.ts`; the CIBO SPayLater ref box removed. Live 2026-10-20: TS02 pass (receipt 26102021300007), TS03 pass, TS04 pass.

## TS v3.1 — 12107_TS10 Cancelled ShopeePay, 12327 shifted (2026-10-20) — CURRENT

1. Faizuddin: "why the TS only have 1 cancel payment. i thought i told you to make 2
   cancel payments". No earlier message asking for 2 was found in the session logs;
   added now. Numbering choice (AskUserQuestion): "Shift 12327 by one".
2. New row 21 **12107_TS10 Cancelled ShopeePay** under CANCELLED PAYMENT. Steps 1-4 as
   12107_TS04; 5. Fiuu ShopeePay QR code page; 6. [Cancel the transaction]; 7. [OK] on
   "Are you sure?". Expected as 12107_TS09. CIBO columns N/A.
3. **12327_TS10–TS18 → 12327_TS11–TS19** in the workbook (A column + 13 cross-references),
   `tests/cibo.spec.ts`, `app/eauto/12107/page.tsx`, `data/cibo.ts`, `utils/ciboRefFinder.ts`.
   Older sections of this file and knowledge/cibo.md keep the old numbers (dated history).
4. Workbook: repo copy written. The OneDrive copy was open in Excel ("Device or resource
   busy") — the same file is at scratchpad `out10.xlsx`; built from the OneDrive copy as
   it was (keeps the user's Pass statuses).
5. Automation: `tests/shopeepay.spec.ts` 12107_TS10 — passed live 2026-10-20 (HXA0021A).
   `FiuuSandboxPage.cancel()` now clicks [OK] on the "Are you sure? Cancel this payment."
   confirm; the first run without it "passed" falsely (nothing cancelled).
6. FPX line (2026-10-20): "Fiuu" for FPX (Open) in 12327_TS12 / TS15; 12327_TS12 takes the
   FPX transaction from 12107_TS08. See knowledge/cibo.md § "FPX Payment Mode = Fiuu".
   Repo copy written; OneDrive still locked by Excel (scratchpad `out11.xlsx`).
7. OneDrive copy written 2026-10-20 after Excel closed (same file as the repo copy).
8. **OPEN — wait for Faizuddin's go:** 12107_TS06 still screenshots the listing before
   the filter is applied (his check of the dashboard run 1792479572472, 14:59,
   2026-10-20 — after the waitForQuiet fix). "update this later when i say so".
9. Done 2026-10-20 on Faizuddin's go: TS06 filter screenshots now show only the Payment
   Channel box + dropdown (`captureFilter`), plus a new `12107_TS06-group-listing`
   after [Search]. TS07 passes with VISA 4456 5300 0000 1096 (3D Secure OTP step added);
   dashboard default card switched to it. FPX TS lines → "Fiuu | Online Banking –
   FPX-<Bank Name>" (SA); workbook written to OneDrive + repo.
10. QA-Issue **EAINT-12566** (2026-10-20, under EAINT-12327): "[eAuto - CIBO] Payment Mode shows only "Fiuu" for Secarang FPX transactions" — Medium, On Hold, assigned to Faizuddin, Developer unset; evidence 12327_TS12 red-box screenshot of BR60006293 inline in Actual Result.
