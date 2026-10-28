# Flow: Secarang car insurance purchase — quote → add-ons → confirm → Fiuu payment → success / failed

Written 2026-10-15 from the two Playwright projects that drive this flow
(`scripts/secarang-insurance`, confirmed working for FPX; `scripts/eauto-12107`,
the EAINT-12107 extension with unconfirmed GrabPay / card selectors), the
EAINT-12107 SRD v1.1, the EAINT-12327 SRD v1.0, and the ticket notes under
`_reference/tickets/EAINT-12107/`. **No live HTML capture of any Secarang page
exists in the repo** (`_reference/html/` has no `secarang/` folder) — every DOM
handle below is "verified" only in the sense that the FPX regression has run green
with it; handles marked `[unconfirmed selector]` have never matched a real page.
`[verified: ls _reference/html, 2026-10-15]`

## 1. Why this flow matters, and what depends on it

1. **Secarang is the public (B2C) insurance front.** It is not an eAuto portal and
   has **no user login** — a member of the public types a plate number, an IC or
   SSM number and a postcode, picks an insurer, pays, and gets a receipt. The only
   gate is the staging site password. `[verified: scripts/secarang-insurance/fixtures/sessionFixture.ts:6-8 · "Secarang has no user login"; scripts/eauto-12107/data/config.ts:15 · "not a user login — Secarang has none"]`
2. **It is the only module in this repo whose payment genuinely redirects to a
   gateway (Fiuu) and whose gateway leg is fully automated** — bank login, status
   picker, OTP read from the DOM, Pay Now. UCD onboarding's payment step uses the
   same Fiuu sandbox, so its automation ports from here. See
   [eauto-payments.md](eauto-payments.md) § "The important capability".
3. **Every Secarang transaction lands in CIBO** (Transaction Management, Payment
   Management, Payment Report) with the UCD columns dashed — so a Secarang test is
   always a two-system test: Secarang for the purchase, CIBO for the record. See
   [flow-cibo.md](flow-cibo.md) and [cibo.md](cibo.md).
   `[from SRD EAINT-12151 §2.1.1 assumption 1: "CIBO covers both eAuto and Secarang insurance transactions"]`
4. **Secarang shares the insurers with eAuto** (Lonpac, Zurich, Tokio Marine, Allianz
   seen in the mockup/TS data) and all insurers share one payment gateway, so one
   insurer is enough for a payment-channel test.
   `[from QA team — Charmain via KJ, relayed by Faizuddin to May Chin, eAuto QAs chat, 2026-09-11 16:37]`
5. Tickets that depend on it: EAINT-12107 (ShopeePay / GrabPay via Fiuu),
   EAINT-12327 (CIBO Payment Mode format — needs one Secarang transaction per
   payment mode), EAINT-12151 and EAINT-12058 (CIBO listing columns — need a
   Secarang row to prove the "-" case).
6. **Agency per insurer (Secarang / CIBO): Serba Sentral = Allianz / eTiqa.** The
   EAINT-8331/8334/7199 TS (Secarang — Remove Discount Line) pre-req lists the agencies:
   "Bintang Prospek (RHB / Takaful) - Pemaju Eksklusif (Lonpac / Tokio Marine) -
   Serba Sentral (Allianz / eTiqa)".
   `[from TS SC_EAINT-8331_8334_&_7199 text copy, rows 23-25 · _reference/inbox/eauto-flows-run/ts-text/]`
   EAINT-12406 (Allianz back on Secarang) expects Allianz sales "under agency Serba
   Sentral in CIBO payment and commission reports".
   `[from ticket EAINT-12406, SRD v1.1 §2.1.3 b]` `[source: pipeline EAINT-12406, Scribe related history, 2026-10-27]`

### Secarang vs eAuto insurance — the differences that trip people

| | eAuto UCD insurance ([flow-insurance-purchase.md](flow-insurance-purchase.md)) | Secarang |
|---|---|---|
| Who buys | a dealer (UCD) logged into the portal | the public, no login |
| Test IDs | fake IC/SSM in a real format | **real** IC and SSM numbers `[from QA team, 2026-08-12 — eauto-insurance.md § Before testing]` |
| Payment | PAY NOW button + popups, no gateway | **Fiuu hosted gateway** in a popup: Credit/Debit Card, FPX, and (EAINT-12107) ShopeePay, GrabPay |
| Record afterwards | UCD listing, BO listing, CIBO | **CIBO only** — Secarang has no listing of its own `[unconfirmed — no Secarang post-purchase page is driven or captured; the only post-purchase surfaces the scripts touch are the success page and its receipt PDF]` |
| Framework | legacy jQuery pages, duplicate ids | **Angular SPA** (`formcontrolname`, `app-*` component tags, `mat-select` fallbacks) `[verified: scripts/secarang-insurance/pages/ConfirmationPage.ts:37; VehicleDetailsPage.ts:7,10]` |

## 2. Entry points

| Entry | URL | Status |
|---|---|---|
| Car insurance | `<base>/car-insurance` | **verified** — the only page either project ever `goto()`s; every later screen is reached by clicking. `[verified: scripts/secarang-insurance/tests/secarang-regression.spec.ts:33; scripts/eauto-12107/data/config.ts:17-19 · carInsurancePath]` |
| Motorcycle insurance | `<base>/motorcycle-insurance` | driven by the batch **checker** only (quote availability, no purchase). `[verified: scripts/secarang-insurance/utils/batch.ts:33-34]` |
| Return from Fiuu | gateway redirects the **main window** to the success / failed page; the popup closes itself | **verified for FPX** `[verified: scripts/secarang-insurance/pages/BankTACPage.ts:84-95 · waitForClose]`; e-wallet and card: `[unconfirmed]` |
| Any marketing / email / QR entry | — | `[unconfirmed — none known]` |

**Base URL.** Read from `SECARANG_BASE_URL`; the committed fallback is one staging
host (`https://staging.secarang.com/preprod`). That fallback is *a* host the
scripts were last run on, not a rule — the 12107 config itself says to confirm
with dev which host carries a given CR before the first run.
`[verified: scripts/secarang-insurance/data/config.ts:6; scripts/eauto-12107/data/config.ts:6-11]`

**Staging /ia entry link and password (2026-10-19).** The /ia car insurance link
is `https://staging.secarang.com/ia/car-insurance`, and the site-password gate
uses the **same password on /ia and /preprod**. Faizuddin, 2026-10-19: "the
password for both secarang staging/ia and staging/preprod is the same".
`[from QA team, 2026-10-19]` The /eauto/12107 dashboard pre-fills both; the
12107 config strips a trailing `/car-insurance` from the base URL so the full
link can be pasted. `[verified: app/eauto/12107/page.tsx · DEFAULT_CREDS; scripts/eauto-12107/data/config.ts · baseUrl]`

**Host per CR.** EAINT-12406 (Secarang — Allianz display) is tested on
**staging/ia**. Asked "Which Secarang staging host (/ia or /preprod) will the
developer deploy EAINT-12406 to?", Faizuddin answered "1. on staging/ia".
`[Faizuddin, dashboard chat to Scribe, 2026-10-27]`

**Site-password gate.** The staging host shows a password-only page (one
`input[type="password"]`, no username) before the app, and the gate can
**reappear on the Fiuu popup and again on the success page** — every page object
that lands on a new document calls `passSiteGate()` first. Password from
`SECARANG_SITE_PASSWORD`, fallback committed in `data/config.ts`.
`[verified: scripts/secarang-insurance/pages/SiteGatePage.ts:9-24; BankLoginPage.ts:11-13; PaymentSuccessPage.ts:33-34,43-44; data/config.ts:7]`

The checker fixture also clears any inherited `Authorization` header
(`ctx.setExtraHTTPHeaders({ 'Authorization': '' })`) because the site uses its own
gate. `[verified: scripts/secarang-insurance/fixtures/sessionFixture.ts:26-27]`

## 3. URL map, step by step

**Secarang is an Angular SPA and neither project records the route of any screen
after `/car-insurance`** — the page objects detect arrival by component tag or body
text, never by URL. The table therefore gives the *arrival signal* that is in use;
the URL column is a gap to fill on the first live capture.
`[verified: no waitForURL / url() assertion in either pages/ directory, 2026-10-15]`

| # | Step | URL | Arrival signal (what the scripts wait for) |
|---|---|---|---|
| 1 | Site gate | `<base>/car-insurance` (gate overlays it) | `input[type="password"]` present, **or** `button:has-text("Car")` present (= already past the gate) `[verified: SiteGatePage.ts:10-12]` |
| 2 | Home form | `<base>/car-insurance` | three bare `input[type="text"]:visible, input:not([type]):visible` in DOM order (plate, IC/SSM, postcode) `[verified: HomePage.ts:12-14]` |
| 3 | Vehicle details ("Are these your vehicle details?") — **not always shown** | `[unconfirmed]` | `app-confirm-details` component, or body text `are these your vehicle details`, or `get quotation` + `/plate no\|chassis\|engine no\|seat\b/` `[verified: VehicleDetailsPage.ts:7,21-25]` |
| 4 | Quotation cards | `[unconfirmed]` | `.insurance-card` (fallbacks `.quotation-card`, `.quote-card`, `.insurer-card`, `.plan-card`) `[verified: QuotationPage.ts:5,10-16]` |
| 5 | Add-ons | `[unconfirmed]` | body text `/add.?on\|extra cover\|optional cover\|additional benefit/i`, then `.addon-card` `[verified: AddOnsPage.ts:11-12,24]` |
| 6 | Reminder popup (sometimes) | — | `app-info-modal`, `mat-dialog-container`, `[role="dialog"]`, `.modal-content`, `.modal`, `app-modal`, `.dialog` `[verified: AddOnsPage.ts:214-216]` |
| 7 | Confirmation ("Confirm and Pay") | `[unconfirmed]` | body text `/confirm.*pay\|payment detail\|order summary\|premium\|total.*payable/i` `[verified: ConfirmationPage.ts:14]` |
| 8 | Select Payment Method | `[unconfirmed]` | `input[formcontrolname="paymentType"]` `[verified: PaymentTypePage.ts:11]` |
| 8a | FPX bank grid (after FPX tile) | same page | `input[formcontrolname="bank"]` `[verified: PaymentTypePage.ts:29]` |
| 9 | Fiuu gateway — **popup window** | `[unconfirmed — logged as `popup.url()` at run time, never recorded]` | new `page` event on the context, registered **before** the click `[verified: PaymentTypePage.ts:61-65]` |
| 9a | FPX simulator login (popup) | `[unconfirmed]` | a text/email/user input **and** `input[type="password"]` `[verified: BankLoginPage.ts:17-19]` |
| 9b | FPX simulator TAC page (popup) | `[unconfirmed]` | `select#status_code` + a Request TAC button `[verified: BankTACPage.ts:28,37]` |
| 10 | Payment success (main window) | `[unconfirmed]` | body text `/payment successful\|thank you for your purchase/i`; data block `app-payment-success .d-print-none` `[verified: PaymentSuccessPage.ts:36,48,62]` |
| 10' | Payment failed (main window) | `[unconfirmed]` | body text `/payment (was )?(failed\|unsuccessful\|declined\|not successful)\|unsuccessful\|declined\|failed/i` `[unconfirmed selector: scripts/eauto-12107/pages/PaymentFailedPage.ts:19 — never seen live]` |
| 10'' | Cancelled at gateway → back to Select Payment Method with quotation retained | — | `[from SRD EAINT-12107 REQ-008 — not automated]` |
| 11 | Receipt PDF | download from `button:has-text("Receipt"), a:has-text("Receipt")` `[verified: PaymentSuccessPage.ts:101]` | file `receipt-<timestamp>.pdf`, text read with `pdf-parse` |

Dynamic segments: none captured. The only dynamic values the scripts carry across
pages are the **Receipt No**, **Purchase Date** and **Payment Method** scraped from
the success page. `[verified: PaymentSuccessPage.ts:90-92]`

## 4. The real DOM handles — verbatim

Paths are relative to `scripts/secarang-insurance/pages/` unless prefixed
`eauto-12107/`. The two projects share identical copies of `AddOnsPage`,
`BankLoginPage`, `BankTACPage`, `ConfirmationPage`, `HomePage`, `QuotationPage`,
`SiteGatePage`, `VehicleDetailsPage` (`diff` clean, 2026-10-15); only `BasePage`
(demo mode + evidence helpers), `PaymentTypePage`, `PaymentSuccessPage` (same
body) and the new `FiuuSandboxPage` / `PaymentFailedPage` differ.
`[verified: diff scripts/eauto-12107/pages vs scripts/secarang-insurance/pages, 2026-10-15]`

### 4.1 Site gate — `SiteGatePage.ts`

| Target | Selector / strategy | Line |
|---|---|---|
| password field | `input[type="password"]` (first) | 10 |
| "already past the gate" signal | `button:has-text("Car")` | 12 |
| submit | `button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Enter"), button:has-text("Login"), button:has-text("Access")` — else `Enter` on the field | 19-21 |
| settle | `waitForLoadState('networkidle', 90s)` then 500 ms | 22-23 |

### 4.2 Home form — `HomePage.ts`

| Target | Selector / strategy | Line |
|---|---|---|
| vehicle type | `button:has-text("Car"), [role="radio"]:has-text("Car"), label:has-text("Car")`; motorcycle tries `Motorcycle`, `Motorbike`, `Motor` | 26-34 |
| owner type | private: `Private Car`, `Private Motorcycle`, `Private`, `Individual`; company: `Company Car`, `Company Motorcycle`, `Commercial`, `Company`, `Corporate`, `Business` — same `button / label / [role="radio"]` pattern | 50-57 |
| owner fallback | `input[type="radio"]` by index — **#0 Private, #1 Company** — `click({force:true})` because the radio hides behind a styled label | 15, 66-74 |
| the 3 inputs | **positional**: `input[type="text"]:visible, input:not([type]):visible` → `[0]` Vehicle Plate No., `[1]` Owner IC / Company SSM, `[2]` Postal Code. No name, id or placeholder exists to key on. Each value is read back with `inputValue()` and compared whitespace-stripped | 12-14, 95-119 |
| submit | `button:has-text("Get Quotation")`, then `Get Quote`, `Check Now`, `Submit`, `Proceed`, `Search`, also `input[value="…"]`; fallback `button[type="submit"], input[type="submit"]` | 126-139 |

### 4.3 Vehicle details — `VehicleDetailsPage.ts`

| Target | Selector / strategy | Line |
|---|---|---|
| component | `app-confirm-details` | 7 |
| declarations | every `input[type="checkbox"]` → `check({force:true})` | 8, 148-154 |
| variant (native) | first `select` on the page; options filtered to skip `/^(select\|choose\|--\|please)/i` and empty values; **first valid option chosen** | 9, 87-103 |
| variant (custom) | `mat-select, ng-select, [class*="variant" i] [role="combobox"]` → first of `mat-option, .ng-option, [role="option"]` | 10, 105-114 |
| error text | `/not found\|no record\|vehicle not\|unable to find\|error/i` on body → throw | 78 |
| CTA (regression) | `app-confirm-details button:has-text("Get quotation")` (last), fallback `app-confirm-details button.primary-btn` — after a **fixed 5 s wait** | 55-67 |
| CTA (checker) | `button:has-text("Get quotation")` (last) — polls up to 12 s for `isEnabled()` because the CTA **starts disabled while details validate**; click chain real → `force` → `el.click()` in page | 119-140 |
| "still on details" retry | checker re-clicks proceed up to 3× when cards haven't appeared after 15 s | `utils/batch.ts:108-115` |

### 4.4 Quotation cards — `QuotationPage.ts`

| Target | Selector / strategy | Line |
|---|---|---|
| card | `.insurance-card` (exact class token, not `[class*=]`, so `insurance-card-header-lg` children don't match) | 5-16 |
| "Get Quotation" if the page still shows it | `button:has-text("Get Quotation")`, `…("Get quotation")`, `…("Get Quote")` (last, visible, enabled) | 39-58 |
| cards or no-quote | `/no quotation\|quotation unavailable\|not available\|unable to provide/i` | 89 |
| **insurer name** | `img[alt]` inside the card, `alt` with trailing ` logo` stripped (`"Zurich logo"` → `Zurich`); fallback `[class*="name" i], [class*="title" i], h3, h4, h2` | 138-144 |
| find a card by insurer | all `img` alts on the card lower-cased, `some(a => a.includes(name))` — **only visible cards**; hidden responsive duplicates exist | 382-391 |
| card unavailable | card text contains one of `quotation unavailable`, `no quotation`, `not available`, `unable to provide`, `no quote` | 397-403 |
| Buy | `button:has-text("Buy")` on the card; fallback click the card | 411-423 |
| coverage type | `button:has-text("Comprehensive"|"TPFT")`, `[data-coverage="comprehensive|tpft"]`, `label:has-text(…)`, `input[value="comprehensive|tpft"]` — **no-ops silently** if none exists ("pending dev deploy") | 433-455 |
| sum insured | `.sum-insured select` on the insurer's card; price watched on `h6.mb-0` containing `RM` until it changes (15 s) | 203, 242-260 |
| price text | all `RM\s*[\d,]+(\.\d{1,2})?` matches in the card text | 293 |
| postcode on the quotation page | `input.postcode-field` ("confirmed in page source"), fallbacks `input[placeholder*="postcode" i]`, `…poskod…`, `input[name*="postcode" i]`, `input[id*="postcode" i]`; applied with **`button:has-text("Edit")`** (actual label), fallbacks Apply / Update / Kemaskini, else Enter; then `networkidle` up to 35 s | 305-368 |
| error modal | `app-info-modal` → title `h5.title, h5, h4`, sub `h6`; dismiss `button:has-text("OK"|"Ok"|"ok")` else `button.close, button:has-text("×"), button:has-text("✕")` | `BasePage.ts:42-62` |

### 4.5 Add-ons — `AddOnsPage.ts`

| Target | Selector / strategy | Line |
|---|---|---|
| card | `.addon-card` (visible ones only) | 24, 47-56 |
| add | `button:has-text("ADD"), button:has-text("Add")` inside the card; a card with no ADD button is treated as already selected | 130-144 |
| remove a pre-ticked add-on | `button:has-text("REMOVE")`, `Remove`, `Deselect`, `Uncheck`, `DELETE`, `Delete` | 62 |
| continue | `button:has-text("Continue")`, `Proceed`, `Next`, `Add to Cart`, `Confirm` (last) — missing button is **non-fatal** ("page may have auto-advanced") | 197-208 |
| post-add-ons popup | containers above; buttons `Proceed`, `Continue`, `OK`, `Ok`, `Confirm`, `Yes`, `Accept`, else the last `button` in the modal | 234-250 |

### 4.6 Confirmation — `ConfirmationPage.ts`

| Target | Selector / strategy | Line |
|---|---|---|
| owner fields | `input[formcontrolname="name"]`, `="email"`, `="phoneNo"`, `="addr1"`, `="addr2"`, `="addr3"` | 37, 49-54 |
| discount code | `div.w-100.position-relative` that has `span:has-text("Discount code")` → its first `input`; then `button:has-text("Apply discount code"), button:has-text("Apply")` (last) once enabled | 62-83 |
| data capture | every `.row.mb-2, .row.mb-4`: pattern 1 `.text-muted` label + first sibling `[class*="col"]` with text; pattern 2 first `.col` = label, last `.col, .col-auto` = value | 98-125 |
| IC as displayed | `icNumber.replace(/(\d{6})(\d{2})(\d{4})/, '$1-$2-$3')` — the page shows the IC **with dashes** | 95 |
| Confirm and Pay | `button[type="submit"]:has-text("Confirm and Pay"), button:has-text("Confirm and Pay")` (last) | 136 |

Captured labels used later for the cross-page check: Plate No, Model, Year,
Variant, Transmission, Seat, cc, Full Name, IC No, Email, Mobile Phone No., Basic
Premium, Premium After NCD, Gross Premium, Service Tax 8%, Stamp Duty, Total
Premium. `[verified: PaymentSuccessPage.ts:157-181]`

### 4.7 Select Payment Method — `PaymentTypePage.ts`

| Target | Selector / strategy | Line | Status |
|---|---|---|---|
| any option tile | `label` that has `input[formcontrolname="paymentType"]` | eauto-12107:20 | verified shape (FPX) |
| FPX tile | `label` filtered `hasText: /FPX/i` (first visible) | 17 / eauto-12107:58-60 | **verified** |
| Credit or Debit Card tile | `label` filtered `/credit\|debit/i` | eauto-12107:63-65 | `[unconfirmed selector]` |
| GrabPay tile | `label` filtered `/grab\s*pay/i` | eauto-12107:68-70 | `[unconfirmed selector]` |
| ShopeePay tile | not driven (not testable in sandbox); presence asserted by `/shopee\s*pay/i` in the joined option labels | eauto-12107 `utils/secarangFlow.ts:121-122` | `[unconfirmed]` |
| "Full Amount" sub-option | `label, button, [role="radio"], [role="button"]` filtered `/full\s*amount/i`, 10 s poll; a popup may open on this click (8 s listener) | eauto-12107:79-96 | `[unconfirmed selector]` |
| Pay / Proceed button after a tile | `button` filtered `/^(pay\|pay now\|proceed\|continue\|submit)/i`, popup listener 30 s | eauto-12107:103-117 | `[unconfirmed selector]` |
| bank grid | `.d-md-block input[formcontrolname="bank"]` — **desktop grid only**, the page renders a second responsive copy | 34 | verified |
| bank name | `input` → `xpath=ancestor::label//img` → `alt` | 39 | verified |
| pick a bank by value | `label` that has `input[formcontrolname="bank"][value="<code>"]`, first **visible** | 45-55 | verified |
| pick a bank by name | `label` that has `input[formcontrolname="bank"]` and `img[alt*="<name>" i]` | eauto-12107:145 | `[unconfirmed — added for "RHB"]` |

Bank codes known from the eAuto insurance runner and `REGRESSION.targetBank`:
`fpx_mb2u` (Maybank2u, default), `fpx_cimbclicks`, `fpx_amb`, `fpx_pbb`,
`fpx_rhb`, `fpx_hlb`, `fpx_hsbc`, `fpx_abb`, `fpx_bkrm`, `fpx_bsn`.
`[verified: scripts/secarang-insurance/data/regression.ts:28; app/eauto/insurance/page.tsx · FPX bank options]`
Whether Secarang's grid shows exactly these ten is `[unconfirmed]` —
`logAvailableBanks()` prints `value` + `alt` on every run for that reason.

### 4.8 Fiuu FPX simulator (popup) — `BankLoginPage.ts`, `BankTACPage.ts` — **verified**

| Target | Selector / strategy | Line |
|---|---|---|
| site gate on the popup | same `SiteGatePage` | BankLogin 11-13 |
| username | `input[name*="user" i], input[id*="user" i], input[placeholder*="user" i], input[type="text"]` (first) | BankLogin 28-30 |
| password | `input[type="password"]` (first) | BankLogin 38 |
| login button | `button:has-text("Login")`, `Log In`, `Sign In`, `Submit`, `Enter`, or `input[type="submit"][value*=… i]`; else Enter | BankLogin 46-58 |
| **outcome picker** | `select#status_code` — selected **before** Request TAC; default `00` | BankTAC 26-34 |
| Request TAC | `button:has-text("Request TAC")`, `Request OTP`, `Get TAC`, `Get OTP`, `Send TAC`, `TAC`, or `input[value*=… i]` | BankTAC 37-47 |
| OTP shown **in the page** | `div.otp, .otp, [class*="otp"]` → first `\d{6}` | BankTAC 53-64 |
| OTP input | `input#otp-input, input[name="otp-input"], input[class*="otp" i]` | BankTAC 68 |
| Pay Now | `button.pay-btn, button:has-text("Pay Now")` | BankTAC 77 |
| popup closes itself | `page.waitForEvent('close', 30s)` guarded by `isClosed()` | BankTAC 84-95 |

Sandbox login defaults (`REGRESSION_BANK_USER` / `REGRESSION_BANK_PASS`, and the
12107 twins `SECARANG_BANK_USER` / `SECARANG_BANK_PASS`) are committed in
`scripts/secarang-insurance/data/regression.ts:29-30` and
`scripts/eauto-12107/data/users.ts:68-69`.

### 4.9 Fiuu e-wallet / card sandbox (popup) — `eauto-12107/FiuuSandboxPage.ts` — **entirely unconfirmed**

No capture of this popup exists; the page object is a best-effort guess built on
the FPX simulator's shape and **logs everything it sees** (`logPage()`: body text,
every `select` with its options, every button) so the first run yields the real
structure. `[verified: scripts/eauto-12107/pages/FiuuSandboxPage.ts:6-16,25-47]`

| Target | Strategy tried, in order | Line |
|---|---|---|
| status | `select#status_code, select[name*="status" i], select[id*="status" i]` → option `value === '00'` or text `/success\|approved\|paid/i` for success, first other non-empty value for failed | 59-75 |
| status (fallback) | `label, button, [role="radio"]` filtered `/success\|approve\|paid/i` or `/fail\|decline\|unsuccess/i` | 77-84 |
| none found | **throws** — "pay with an unknown status" is never allowed | 86 |
| Pay | `button, input[type=submit|button]` filtered `/^pay now$/i`, `/^pay$/i`, `/pay/i`, `/submit\|confirm\|proceed/i`; then `input[type="submit"][value*="pay" i]` | 91-104 |

The TS wording the guess is based on: "System will popup the Fiuu GrabPay
browser / Set Payment Status = Success / Click [Pay]".
`[from TS: _reference/tickets/EAINT-12107/EAINT-12107 + EAINT-12327 - Combined TS … .xlsx, 12107_TS01 steps 5-7]`

### 4.10 Payment success — `PaymentSuccessPage.ts` — verified for FPX

| Target | Selector / strategy | Line |
|---|---|---|
| arrival | body text `/payment successful\|thank you for your purchase/i`, 60 s | 46-54 |
| data block | `app-payment-success .d-print-none`, rows `.row.mb-2, .row.mb-4, .row.mb-5`, same two label/value patterns as the confirmation page | 62-86 |
| keys read | `Receipt No`, `Purchase Date`, `Payment Method` | 90-92 |
| receipt | `button:has-text("Receipt"), a:has-text("Receipt")` → `download` event (30 s) → `pdf-parse` | 101-121 |
| PDF must contain | Receipt No, Plate No, Model, Full Name, IC No, Email, Total Premium, Basic Premium, Gross Premium, Stamp Duty (whitespace-collapsed, upper-cased `includes`) | 260-271 |
| phone comparison | `+60` / leading `60` stripped, spaces removed | 141 |
| name comparison | exact, or success-page value contains the first two words of the confirmation value | 150-152 |

**Payment Method text on the success page** per channel, as the 12107 specs expect
it: GrabPay `/grab\s*pay|e-?wallet/i`, card `/card|credit|debit|fiuu/i`, FPX
`/fpx|online banking|rhb|fiuu/i`. These regexes are deliberately loose — the real
strings are `[unconfirmed]`.
`[verified: scripts/eauto-12107/tests/grabpay.spec.ts:58; tests/regression.spec.ts:46,74]`

### 4.11 Payment failed — `eauto-12107/PaymentFailedPage.ts` — unconfirmed

Failed regex at line 19 (§3 row 10'), success regex line 20, retry/back control
`button, a` filtered `/retry|try again|back|payment method|pay again/i` (logged,
not asserted, line 46), receipt button absence line 54. The original regression
never asserted a failed page — it only proved the success page **did not** appear
(`secarang-regression.spec.ts:329-371`).

## 5. Decision points and what they branch on

1. **Vehicle type** — Car vs Motorcycle: different entry URL (§2) and different
   owner labels. Motorcycle is checker-only. `[verified: HomePage.ts:26-28; batch.ts:33]`
2. **Owner type** — Private (IC) vs Company (SSM). The second text input takes
   either. Company flow is wired for 12107_TS02 (Tokio Marine) but its vehicle/SSM
   defaults are empty env vars — **never run green**. `[verified: scripts/eauto-12107/data/users.ts:38-46]`
3. **Vehicle details page shown or skipped.** After submit the flow settles on
   *either* the details step *or* the cards directly. If details show: tick
   declarations, maybe pick a variant, click Get quotation. `[verified: VehicleDetailsPage.ts:31-40; secarang-regression.spec.ts:85-116]`
4. **Variant dropdown present or not** — most cars have none. `[verified: VehicleDetailsPage.ts:84-86]`
5. **Error modal / error text after submit** — `app-info-modal`, or body text
   `vehicle not found | no record | invalid plate | error occurred | something went wrong`
   → the checker records ERROR. `[verified: batch.ts:83-93]`
6. **Insurer card present / available / unavailable** — three outcomes from
   `selectInsurer()`; "unavailable" phrases in §4.4. Regression run defaults to
   Zurich, 12107 to Lonpac (TS01/07/08) and Tokio Marine (TS02).
   `[verified: QuotationPage.ts:375-429; regression.ts:10; users.ts:37-48]`
7. **Coverage type** Comprehensive vs TPFT — selector no-ops if the UI has no
   control. `[verified: QuotationPage.ts:433-455]` Whether Secarang exposes TPFT at
   all is `[unconfirmed]`.
8. **Sum insured** default / min / medium / max — only if the card has an enabled
   `.sum-insured select` with >1 option; "medium" with exactly 2 options falls
   back to default. `[verified: QuotationPage.ts:180-274]`
9. **Postcode change on the quotation page** — only when `REGRESSION_QUOTATION_POSTCODE`
   is set; price before/after is recorded as `postcodeChangeInfo`. `[verified: secarang-regression.spec.ts:130-164]`
10. **Add-ons** — named list (`REGRESSION_ADDONS`, comma-separated) vs "first 2
    simple add-ons"; **Zurich pre-ticks "All Drivers"** and the script unticks it
    unless requested. The 12107 flow keeps the defaults and just continues.
    `[verified: regression.ts:44-46; secarang-regression.spec.ts:204-240; secarangFlow.ts:88-93]`
11. **Post-add-ons reminder popup** — may or may not appear. `[verified: AddOnsPage.ts:211-251]`
12. **Discount code** — only when supplied. `[verified: ConfirmationPage.ts:59-88]`
13. **Payment method** — today: Credit or Debit Card, FPX Online banking.
    **⚠️ AMENDED 2026-10-20 (CIBO side only):** dev cannot tell ShopeePay Full Amount
    from SPayLater; CIBO shows both as `Fiuu | eWallet – ShopeePay` and the
    "ShopeePay - SPayLater" filter is dropped. Payment-page options not discussed.
    See [cibo.md](cibo.md) § "BA requirement update — 12107 + 12327 (2026-10-20)".
    `[from Teams, EAINT-12107 CR chat, Yi Link Lim, 2026-10-20]`
    After EAINT-12107: plus ShopeePay (Full Amount / SPayLater) and GrabPay
    (Full Amount / PayLater by Grab). Order on the page as the TS expects:
    "1. Credit or Debit Card / 2. FPX Online banking / 3. ShopeePay (Full Amount /
    SPayLater) / 4. GrabPay (Full Amount / PayLater by Grab)".
    `[from SRD EAINT-12107 §2.2.2; REQ-001/002; TS 12107_TS01 expected]`
    No amount limit on the e-wallet rails `[from SRD EAINT-12107 REQ-004]`; both
    released together `[REQ-005]`; BNPL tenure is Shopee's/Grab's business, not
    stored by Secarang `[SRD §2.1.1 assumption 3]`.
14. **FPX bank** — by `value` or by logo `alt`. `[verified: §4.7]`
15. **Gateway outcome** — FPX: `select#status_code` (`00` approved; `51`, `80`,
    `BC`, `22`, `99`, `OE`, `OF`, `OA`, `48/61/65`, `85/96/FE` … see
    [eauto-payments.md](eauto-payments.md) § FPX status codes). E-wallet/card:
    Success / Failed picker `[unconfirmed]`. Shane: "all payment method working
    fine except for shopeepay (… its stimulator in sandbox doesn't work as well).
    and as mentioned, we wont be able to select the paylater option."
    `[from Jira EAINT-12107, Shane, 2026-09-07]`
16. **Post-gateway handling** (same for old and new rails):
    success → "same confirmation and policy issuance outcome as an existing
    channel" `[REQ-006]`; failed → "returns the customer to the payment page and
    allows another payment channel to be selected" `[REQ-007]`; cancelled →
    "returns the customer to the payment page with the quotation retained"
    `[REQ-008]`. The automation models success (full verification) and "not
    success" only.
17. **Real-device legs the sandbox cannot replace**: ShopeePay completes inside the
    Shopee app `[REQ-009]`; GrabPay needs the customer to "approve the browser login
    from the Grab app, return to the browser to complete the payment" `[REQ-010]`.
    Neither exists in the sandbox simulator.

## 6. Preconditions, test data and safety switches

### Preconditions

1. Staging site password (`SECARANG_SITE_PASSWORD`, fallback committed).
2. A vehicle number that Secarang can quote, with the **real** IC/SSM of its
   owner `[from QA team, 2026-08-12]`. The committed regression defaults
   (`REGRESSION_VN`, `REGRESSION_IC`, postcode `55000`) are in
   `scripts/secarang-insurance/data/regression.ts:7-9` and reused by
   `scripts/eauto-12107/data/users.ts:27-29`; don't copy them into documents.
3. A working insurer on the chosen host (any one — see §1 item 4).
4. For 12107_TS02 a **company-registered** vehicle + SSM
   (`SECARANG_COMPANY_VEHICLE_NO`, `SECARANG_COMPANY_SSM`) — no defaults exist.
   `[verified: users.ts:38-41]`
5. Fiuu sandbox bank login (FPX) — committed defaults, §4.8.
6. For CIBO verification afterwards: a CIBO login with Transaction Management,
   Payment Management and Payment Report access `[from release study, 2026-10-15 — not in the repo]`.

### Config knobs and env vars

`scripts/secarang-insurance` (`.env.example` lists them all):

| Var | Default | Used for |
|---|---|---|
| `SECARANG_BASE_URL` | staging host | both specs |
| `SECARANG_SITE_PASSWORD` | committed | gate |
| `SECARANG_POSTCODE` | `55000` | checker + regression home form |
| `SECARANG_IC` | `''` | checker default IC when the row has none |
| `SECARANG_CONCURRENCY` | `1` | checker parallel contexts |
| `SECARANG_CHECK_VEHICLE_DETAILS` | `1` (`0` disables) | checker make/model/year extraction |
| `REGRESSION_VN / _IC / _POSTCODE` | committed | regression |
| `REGRESSION_INSURER` | `Zurich` | card to buy |
| `REGRESSION_COVERAGE_TYPE` | `comprehensive` | `comprehensive \| tpft` |
| `REGRESSION_QUOTATION_POSTCODE` | `''` | optional postcode change on the cards page |
| `REGRESSION_SUM_INSURED` | `default` | `default \| min \| medium \| max` |
| `REGRESSION_VEHICLE_TYPE / _OWNER_TYPE` | `car` / `private` | |
| `REGRESSION_ADDONS` | `''` (= first 2 simple) | comma-separated names |
| `REGRESSION_NAME / _EMAIL / _PHONE / _ADDR1-3` | committed | confirmation page |
| `REGRESSION_DISCOUNT` | `''` | discount code |
| `REGRESSION_BANK` | `fpx_mb2u` | bank input value |
| `REGRESSION_BANK_USER / _PASS` | committed | FPX simulator |
| `REGRESSION_PAYMENT_STATUS` | `00` | `select#status_code` |

`[verified: scripts/secarang-insurance/.env.example; data/config.ts; data/regression.ts]`
File contract with the dashboard: `./input-vehicles.xlsx` → `./output-results.xlsx`
(checker), `./regression-result.json` (regression) — do not move.
`[verified: config.ts:12-13; regression.ts:34]` Dashboard routes:
`app/api/secarang/check/route.ts:192-197` and `app/api/secarang/regression/route.ts:130-152`
inject exactly these vars.

`scripts/eauto-12107` (dashboard `app/eauto/12107`, route `app/api/eauto-12107/run`):

| Var | Default | Note |
|---|---|---|
| `SECARANG_BASE_URL`, `SECARANG_SITE_PASSWORD` | as above | |
| `SECARANG_VEHICLE_NO`, `SECARANG_IC`, `SECARANG_POSTCODE` | regression defaults | private-car TS |
| `SECARANG_TS01_VEHICLE_NO`, `SECARANG_TS02_…`, `SECARANG_TS07_…`, `SECARANG_TS08_…` | — | per-TS override, sent as `vehicleEnvVars` |
| `SECARANG_TS01_INSURER` … `_TS08_INSURER` | Lonpac / Tokio Marine / Lonpac / Lonpac | |
| `SECARANG_COMPANY_VEHICLE_NO`, `SECARANG_COMPANY_SSM` | `''` | TS02 |
| `SECARANG_OWNER_NAME / _EMAIL / _PHONE`, `SECARANG_ADDR1-3` | committed | |
| `SECARANG_BANK_VALUE` (exact `value`, wins) / `SECARANG_BANK_NAME` (`RHB`, matched on `img alt`) | | TS08 |
| `SECARANG_BANK_USER / _PASS` | committed | FPX simulator |
| `PW_HEADED`, `PW_VIDEO`, `PW_DETAILED`, `PW_DETAILED_DELAY`, `PW_JSON_REPORT`, `PW_STEP_REPORT`, `PW_EVIDENCE_DIR`, `PW_OUTPUT_DIR` | from the run route | demo mode / evidence contract |
| `EAUTO_12107_SCRIPT_DIR`, `EAUTO_12107_HISTORY_LIMIT` | `scripts/eauto-12107`, `30` | route |

`[verified: scripts/eauto-12107/data/users.ts; data/config.ts; app/api/eauto-12107/run/route.ts:17,292,444-448,508-528]`
Timeouts worth knowing: quotation cards **90 s** (`quotationTimeout`), gateway
outcome **120 s** (`paymentOutcomeTimeout`), whole test 360 s / 480 s in detailed
mode, route kills the child after 10 min.
`[verified: scripts/eauto-12107/data/config.ts:22-29; playwright.config.ts:13; run/route.ts:20]`

### Safety switches — and the one that is missing

1. **There is no "stop before payment" switch in either Secarang project.** The
   eAuto E2E has `E2E_STOP_BEFORE_PAYMENT=1`; Secarang's regression pays every
   time it reaches the gateway. A dry run must end at the checker (quotes only).
   `[verified: grep STOP_BEFORE scripts/secarang-insurance scripts/eauto-12107 → none, 2026-10-15]`
2. Sandbox money only — the Fiuu simulator signs a fake outcome. But the Secarang
   record is real on that host and **will appear in CIBO** (Paid / Failed), so a
   sandbox run is still test-data creation. Status `00` is the only positive
   outcome; any other code is treated as a negative scenario and the success page
   must *not* appear. `[verified: secarang-regression.spec.ts:329-336]`
3. The e-wallet sandbox page object **throws** rather than paying with an unknown
   status (§4.9).
4. Default `headless: false` in `scripts/secarang-insurance/playwright.config.ts:17`;
   the 12107 project follows `PW_HEADED`.

## 7. Traps

1. **Responsive duplicates.** The page renders a hidden second copy of the bank
   grid and of the quotation cards. Use `.d-md-block` for banks and iterate
   `isVisible()` cards; a `.first()` on either hits a hidden node.
   `[verified: PaymentTypePage.ts:33-34; QuotationPage.ts:120-128]`
2. **Positional home-form inputs.** No ids/names — a layout change silently fills
   the wrong field. The script reads each value back and aborts if the plate did
   not stick. `[verified: HomePage.ts:95-119; batch.ts:60-64]`
3. **Register the popup listener before the click**, or the Fiuu window is missed.
   `[verified: PaymentTypePage.ts:60-63]`
4. **The popup closes itself after Pay Now** — any method on a closed `Page`
   throws; check `isClosed()` before waiting. `[verified: BankTACPage.ts:86-93]`
5. **The site gate reappears** on the popup and on the success page (§2).
6. **"Get quotation" starts disabled**; clicking it too early is a no-op and the
   flow sits on the details step. The checker polls `isEnabled()` and re-clicks up
   to 3 times. `[verified: VehicleDetailsPage.ts:119-125; batch.ts:108-115]`
7. **Quotation cards are slow** — insurer APIs answer in 10–20 s, sometimes a
   minute; the 12107 project waits 90 s and the postcode refresh waits for
   `networkidle` up to 35 s. `[verified: eauto-12107 config.ts:26-27; QuotationPage.ts:355-360]`
8. **Zurich pre-ticks "All Drivers"** on the add-ons page. `[verified: regression.ts:42-46]`
9. **Phone and IC are reformatted by the page** (`+60` prefix, IC dashes) — compare
   normalised. `[verified: PaymentSuccessPage.ts:141; ConfirmationPage.ts:95]`
10. **Loose regexes in the 12107 page objects**: `/credit|debit/i` for the card
    tile and `/fail|decline|unsuccess/i` for the sandbox picker will match any
    label containing those words. Tighten after the first capture.
    `[verified: eauto-12107/PaymentTypePage.ts:64; FiuuSandboxPage.ts:77]`
11. **`devices['Desktop Chrome']` carries its own 1280×720 viewport** and
    silently overrides the top-level one — re-set it after the spread. A bare
    `video: 'on'` downscales to 800×800; use the object form with an explicit size.
    `[verified: scripts/eauto-12107/playwright.config.ts:40-51]`
12. **The 12107 Secarang host is an assumption.** The config comment says the only
    Secarang host recorded in the repo is the one the old checker used, and that
    Shane's "changes are up in staging" does not name it. Confirm before trusting
    a run that cannot find GrabPay. `[verified: scripts/eauto-12107/data/config.ts:6-9]`
13. **A ShopeePay tile that is present but broken is expected on staging** —
    Shane, 2026-09-07 (§5 item 15). Do not raise it as a defect.
14. **Teams renamed the ticket chat** to "… Enable SPAY Later and PayLater by
    Grab" while the Jira title still says ShopeePay and GrabPay — same ticket, same
    scope (BNPL are sub-options). `[from Teams, observed 2026-09-18 — eauto-payments.md]`

15. **Live run, staging /ia, 2026-10-19 (Claude, CLI runs of scripts/eauto-12107):**
    a. **/ia quotes a made-up plate** (HXA0001A-HXA0009A, IC 030217141005,
       postcode 55000 → HONDA HR-V, Lonpac RM884.48). **/preprod refuses it**
       with a popup "Sorry, we're unable to retrieve your vehicle information."
       The running vehicle no. on /eauto/12107 therefore only works on /ia.
       `[verified: live run 2026-10-19; QuotationPage.waitForCards]`
    b. **Phone field keeps "+60"**: typing "0189812839" gave "+600189812839" and
       the error "At least 12 digits including +60". Type the number without
       the leading 0 (the regression suite already uses '189812839').
       `[verified: live run 2026-10-19; scripts/secarang-insurance/data/regression.ts:22]`
    c. **Payment tiles on /ia**: "Credit or Debit Card | FPX Online banking |
       SPayLater | PayLater by Grab". **These ARE the 12107 channels**: the
       "PayLater by Grab" tile has logo alt "GrabPay" and opens the Fiuu GrabPay
       sandbox popup on click (bank-simulator.fiuu.com/grabid/..., select
       #status_code Success / Failed, button "Pay"); "SPayLater" has logo alt
       "ShopeePay". No "Full Amount" choice on Secarang. 12107_TS01 paid end to
       end (receipt 26101921300018, Payment Method "GrabPay"). An earlier note
       here said "no GrabPay tile" — wrong: the tile was read by text only and
       never clicked. HTML: `_reference/html/secarang/payment-methods-2026-10-19-after-failed-payment.html`.
       The tile names differ from SRD v1.1 REQ-001/002 (channel "ShopeePay" /
       "GrabPay" with Full Amount + BNPL options). `[verified: live run + pasted HTML, 2026-10-19]`
    d. **The card tile opens the Fiuu card form in a popup on click** — no Pay
       button on Secarang. The popup is a real card form (Card Number, Expiry
       Date, CVV, "Pay MYR 884.48", Powered by Fiuu) with **no payment status
       control**, so 12107_TS07 needs a Fiuu sandbox test card to finish.
       `[verified: live run 2026-10-19, popup screenshot]`
    e. **Fiuu Bank Simulator (RHB) has its own username + password form.** The
       site-gate helper filled the Secarang password into it ("Oops... Wrong
       username or password"); BankLoginPage now skips the gate when a username
       box exists. Simulator login is username "Gaara" with a capital-L
       password (Faizuddin, 2026-10-19; the lower-case copy in
       secarang-insurance/data/regression.ts:30 is rejected). The RHB0218 page
       shows the TAC in a read-only box, takes it in an "Enter TAC" box, has a
       status select (Approved = 00) and a "Pay now" button; BankTACPage copies
       the code across. 12107_TS08 paid end to end on /ia (receipt
       26101921300015, "Online Banking - RHB Bank"). `[verified: live run 2026-10-19]`
    f. **Add-ons Continue can be clicked before the page loads**; the old
       continue() then hit a stray "Confirm" and the run sat on Add-ons.
       continueToConfirmation() waits for Continue and retries until the
       confirmation page shows. `[verified: live run 2026-10-19; AddOnsPage.ts]`

16. **Plate / SSM checker, staging /ia, 2026-10-20** (`/eauto/secarang-plate-checker`,
    scripts/secarang-insurance `tests/plate-checker.spec.ts` + `utils/plateCheck.ts`).
    Runs the home form → vehicle details → quotation per row, 20 tabs at once, and
    reports Proceed (quotation cards) or the error Secarang showed. Nothing is bought.
    a. **Messages seen:** home form, fake company SSM → "Sorry, we're unable to
       retrieve your vehicle information." (popup); made-up plate QAT9100A with a real
       IC → "Ops, there is no instant quotation available from our insurers for your
       car at the moment." (popup, after vehicle details). HXA0001A-HXA0020A and
       ZZZ1A + IC 030217141005 proceed. `[verified: live run 2026-10-20]`
    b. **"Kindly confirm your navigation"** popup ("By leaving this page, you would
       need to restart your purchasing process", buttons "Leave this page" / "Cancel")
       on `/car-insurance/confirm-car-details/<uuid>` — 1-3 rows in 20 at 20 tabs.
       Not a vehicle answer; the checker re-checks the row from the start (up to 3
       tries). Capture: `_reference/html/secarang/navigation-confirm-modal.html`.
       `[verified: live run 2026-10-20]`
    c. **Speed:** 20 rows at 20 tabs ≈ 2 min; 24 rows ≈ 1.5 min. `[verified: live run 2026-10-20]`
    d. **Excel drop:** reads the columns titled "Vehicle" and "Company ROC" (header in the
       first 10 rows) and checks every row as a company car. `[from QA team, 2026-10-20]`

17. **ShopeePay can now be paid end to end on /ia (2026-10-20).** Faizuddin: scanning the
    QR "will open chrome link 'bank-simulator.fiuu.com/shopee.....'". `[from QA team, 2026-10-20]`
    a. **Tile** "SPayLater" (img alt "ShopeePay") opens a popup
       `sandbox-payment.fiuu.com/RMS/intermediate_app/viewqr.php`: "Kindly scan the QR
       code below to proceed with payment." QR = `img#qrcode_img.qrcode-img` (240 px).
       Capture: `_reference/html/secarang/fiuu-shopeepay-qr.html`.
    b. **QR link** = `https://bank-simulator.fiuu.com/shopeepay/spsimulator?q=<token>`
       ("Payment Simulator"): `select#status_code` "✓ Success" (1) / "✗ Failed" (6),
       `button#pay-btn` "PROCEED TO PAY". Capture:
       `_reference/html/secarang/fiuu-shopeepay-simulator.html`.
    c. **Automation:** `PaymentTypePage.selectShopeePay()` → `FiuuSandboxPage.openQrLink()`
       (screenshots the QR, decodes it with jsQR, opens the link in a new tab of the same
       browser) → `setPaymentStatus` + `clickPay`. No phone needed.
    d. **After Pay:** the simulator tab lands on `/ia/auth/login?returnUrl=/payment/check/<receipt>`
       (ignore it); the QR popup closes; the main window shows the outcome.
    e. **Success** → "Thank you for your purchase!", Payment Method "ShopeePay" (receipt
       26102021300005, HXA0093A). **Failed** → back on Select Payment Method with
       "Unsuccessful payment You may try again." (HXA0094A). `[verified: live run 2026-10-20]`
    f. This replaces item 13's "ShopeePay tile broken on staging" for /ia.
    g. **12107_TS02 is now "Successful Pay With ShopeePay — private car, Lonpac"**
       (was Failed GrabPay, company car, Tokio Marine). Faizuddin: "there are no insurance
       in secarang that supports company" and "make it shopee pay passed private". Tokio
       Marine showed "quotation unavailable" for a private car (HXA0095A). TS02 passed:
       receipt 26102021300007, Payment Method "ShopeePay". Both workbook copies updated.
       `[from QA team, 2026-10-20; verified: live run 2026-10-20]`
    h. **TS v3 (20_10_26):** 12107_TS03 = Failed GrabPay, 12107_TS04 = Failed ShopeePay
       (simulator "✗ Failed"), both private car, Lonpac. Both end on Select Payment Method
       with "Unsuccessful payment You may try again."; no receipt. Both passed live
       2026-10-20. Current TS: `_reference/tickets/EAINT-12107/New 20_10_26 - …xlsx`.
       `[verified: live run 2026-10-20]`

## 8. What is NOT covered

1. **Every screen URL after `/car-insurance`** (§3).
2. **Live HTML of any Secarang page** — none captured. First job of the next
   Secarang session: `_reference/html/secarang/<page>.html` for the home form,
   quotation cards, add-ons, confirmation, Select Payment Method (post-12107), the
   Fiuu e-wallet popup, the Fiuu card popup, success and failed pages.
3. **ShopeePay (Full Amount, SPayLater) and PayLater by Grab** — not testable in
   the Fiuu sandbox `[from SRD EAINT-12107 §2.2.8]`; covered by dev data patching
   of GrabPay transactions (12107_TS03-05). The patched rows are a CIBO check, not
   a Secarang flow.
4. **GrabPay Full Amount, Credit/Debit Card** — page objects exist, never run.
5. **Failed page and cancel path** (REQ-007/008) — wording and controls unknown.
6. **Company-owner (SSM) purchase** — wired, never run.
7. **Motorcycle purchase** — checker quotes only.
8. **TPFT on Secarang**, renewal, refund, e-cover note / policy documents beyond
   the receipt PDF, any customer email.
9. **BoldPay is not a Secarang gateway.** EAINT-12327 lists BoldPay payment modes
   (TouchNGo, FPX-Bank Name, MBBMGATE_MS card), while the EAINT-12107 SRD says the
   Secarang payment page offers only Credit/Debit Card and FPX (both Fiuu).
   `[from SRD EAINT-12327 §2.2.2 vs SRD EAINT-12107 §2.2.2]` Before 12327 the CIBO
   Payment Report showed "Bold Pay" for **Makrokiosk** transactions, "Fiuu" for
   Secarang on/after the cutoff, "RMS" for Secarang before it, and "RHB" for eAuto
   `[from SharePoint TS #129 EAINT-11541, sheet EAINT-11541, rows 3-10]` — so BoldPay
   is the Makrokiosk gateway. Supersedes the earlier `[unconfirmed]` "second live
   Secarang gateway?" question. Still open: 12327 has no format string for Fiuu card
   / Fiuu FPX — ask Lim Yi Link.
   `[from _reference/tickets/EAINT-12107/NOTES.md § Test script v0.2 item 4]`
10. **Fiuu `grabpay_indicator` values** (`GPWALLET` / `POSTPAID` / `INSTALMENT_4`)
    and the lack of a ShopeePay equivalent — Teams-derived, dev-side only, not
    visible in Secarang. `[from _reference/tickets/EAINT-12107/EAINT-12107-study.html, Teams 2026-09-03 — unconfirmed]`

**Fiuu card form, test cards (2026-10-19).** Faizuddin supplied Fiuu's test-card table
(positive Visa 4111111111111111 CVV 111, Mastercard 5105105105105100 CVV 444; expiry must
not be past). The form (`_reference/html/secarang/fiuu-card-form.html`): `#cardnumber`,
`#expdate` (MM / YY), `#cvv-flip` (password; copied to hidden `#cvv` on keyup), `#pay-online-btn`.
Both cards, typed key by key and read back correctly ("5105 1051 0510 5100", "12/27",
CVV 3 digits), were refused with "P10: Sorry, Your Credit Card Number or CVV or expiration
date is not valid". The Secarang site-gate helper used to type the site password into
`#cvv-flip` (it is a password box) — fixed in SiteGatePage: a page with any visible
text/tel/email box is not the gate. `[verified: live run 2026-10-19]`
18. **Cancelling ShopeePay on /ia (2026-10-20).** The Fiuu QR page's [Cancel the
    transaction] opens a confirm: "Are you sure?" / "Cancel this payment." with [OK] /
    [Cancel]. Only [OK] cancels; the popup then closes and the main window stays on "How
    would you like to pay?" with the same vehicle and premium (SRD 12107 REQ-008).
    `[verified: live run 12107_TS10, HXA0021A, 2026-10-20]`. Before [OK] the main window
    looks the same, so "back on Select Payment Method" alone does not prove a cancel.
19. **Fiuu card payment on /ia (2026-10-20).** Card form (input#cardnumber, #expdate,
    #cvv-flip, button#pay-online-btn). 4111 1111 1111 1111 (12/26, 111) is rejected:
    "P10: Sorry, Your Credit Card Number or CVV or expiration date is not valid". VISA
    4456 5300 0000 1096 (12/26, 111) opens "3D Secure Authentication" — "Enter One-Time
    Password (OTP)", "For testing: use OTP 123456", [PAY] / [CANCEL] ("Click CANCEL to leave
    transaction in Pending status for requery testing"). OTP + [PAY] → success page,
    receipt 26102021300019, Payment Method "Credit". Capture:
    `_reference/html/secarang/fiuu-card-3ds-otp.html`. `[verified: live 12107_TS07, 2026-10-20]`
    Master 5200 0000 0000 1096 (12/26, 111) also passes: same 3D Secure OTP 123456 page, receipt 26102021300022 (HXA0025A, 2026-10-20 3:35 PM).
    Dashboard default card = Master 5200 0000 0000 1096 (Faizuddin, 2026-10-20).


## Additions from the 2026-10-23 flows study

Source: lib/eautoFlows/modules/*.ts (data mirror for /eauto/flows). Only facts not already in this file.

- CIBO shows platform tag 'Secarang-MK', Payment Management eWallet filter, Referred Risk Log, Macrokiosk Template Management. [jira: EAINT-8669 2026-06-30] [jira: EAINT-12218 2026-10-05]
- Payment link expires 24 hours after the WhatsApp message; message text ends 'Reply OPT-OUT to stop updates.' [miro: uXjVNi7Nu44= (Macro Kiosk - Workflow)] [jira: EAINT-10444 2026-10-23]
- Template content was revised to remove promotional words after Meta paused it. [jira: EAINT-12168]
- Reminder pickup at 30 / 14 / 7 days; none after payment; opt-out skipped; no message when no quote. [miro: uXjVJ5lCjy4= (eAuto - Macrokiosk)] [jira: EAINT-12218 2026-10-05]
- Free-text opt-outs (To Do): INS PO team uploads the Boldpass report and ticks numbers; until then patched manually. [jira: EAINT-12443]
- Internal alert Cover note failed and JPJ rejected go to one internal recipient only. [teams: EAINT-11759 chat 2026-09-14] [jira: EAINT-12342 2026-10-05]

## Update 2026-10-27 from Charmain repo

Source: read-only clone `_reference/codebases/eauto-qa-charmain/`, folder
`intake/` (commit `0ab45d1`). Inventory: `script-inventory-team.md`.

1. **Charmain has Secarang flows** in `tools/macrokiosk-fixtures/flows/`:
   `secarang-home-e2e.js` (108 lines), `secarang-renewal-e2e.js` (123),
   `secarang-prod.js` (28), `secarang.js` (26), over `_lib/secarang-home.js` (516)
   and `_lib/secarang-renewal.js` (288). `[charmain-repo: intake/reports/charmain-macrokiosk.md:36-37, 51-54]`
   `[charmain-repo: intake/reports/charmain-macrokiosk.json]`
   The team registry leaves them out: "The secarang-* flows in the same folder are
   a different product and are out of scope." `[charmain-repo: intake/sources.yaml:151]`
   So they are not in the team repo; read them on her machine if a Secarang
   renewal or home-page flow is needed.
2. **"Renewal" flow exists.** Our `scripts/secarang-insurance` covers the new-quote
   purchase only; her `secarang-renewal-e2e.js` is the only known script for the
   renewal path. `[unconfirmed]` what renewal entry it uses.
3. **Macrokiosk (WhatsApp) reminder test prep:** `flows/macrokiosk-prepare.js`
   (185 lines), `flows/cron-forecast.js` (350 lines), `_lib/whatsapp.js` (85 lines,
   reaches `web.whatsapp.com`), `_lib/dates.js`, `_lib/patch-targets.js`.
   `[charmain-repo: intake/reports/charmain-macrokiosk.md:28, 34, 41-42, 50]`
   `[charmain-repo: intake/reports/charmain-macrokiosk.md:258-260]`
   The names suggest she prepares records whose dates fall on the reminder pick-up
   days (30 / 14 / 7, see § Additions) and forecasts the next cron run, then reads
   the WhatsApp message. `[unconfirmed]` — names only, code not read.
4. **CIBO host:** her `_lib/cibo.js` (365 lines) reaches `cibo.bintangprospek.com`
   (3 hits). `[charmain-repo: intake/reports/charmain-macrokiosk.md:258]`
   Conflict / gap: `cibo.md` records the CIBO capture from
   `https://staging.secarang.com/cibo` (2026-10-16). Which environment
   `cibo.bintangprospek.com` is (production or another staging) is `[unconfirmed]`;
   do not point automation at it until confirmed.
5. **EAINT-12175 Secarang side:** Charmain's `probe-secarang.mjs`,
   `probe-secarang2.mjs` hit `secarang.com` (7) and `www.secarang.com` (1) and
   `lonpac.com` (9, the SDPA policy wording link). `[charmain-repo: intake/reports/charmain-12175.md:43-44]`
   `[charmain-repo: intake/reports/charmain-12175.json]`

## Update 2026-10-27 from EAINT-12078 study (Takaful Malaysia on Secarang)

`[source: pipeline EAINT-12078, Scout study | Scribe related history, 2026-10-27]`
NDDP rules and document versions: `eauto-insurance.md` § Takaful Malaysia (STM).

1. **Takaful was often not quotable on Secarang staging.** Past Secarang TS remarks:
   "Tested with TMIM as Takaful not available" (EAINT-8331 remove-discount-line TS,
   R18, R21 Remarks); later "Takaful (Company) = OK (2:50PM 31/7/25)" (R15). Find a
   vehicle that gets a Takaful Malaysia quote before test day.
2. **Takaful Malaysia contacts (PDS EN pp.1-2):** CSU "1-300 88 252 385"; Tele Bantuan
   "1800 888 788"; email "csu@takaful-malaysia.com.my". The BM PDS is not consistent:
   p.1 "1-300 88252 385", p.2 "Talian Unit Khidmat Pelanggan (CSU): 1-300 802525".
   `[from ticket EAINT-12078, PDS EN/BM V2 02-2026]`
3. **Past Secarang PDS TS never marked** — the EAINT-8786 Secarang sheet has no Test
   Result values (R3–R10), so the Takaful Malaysia PDS change is not proven on
   Secarang. `[source: pipeline EAINT-12078, Scribe related history "Known traps" 9, 2026-10-27]`
4. **Takaful Malaysia documents cover Private Car only.** EAINT-12078 Supporting
   Documents: "PDS Takaful myMotor Private Car (English) V02" and "Sijil Takaful myMotor
   Kereta Persendirian (BM) V2.0"; no motorcycle or company-car document. Certificate
   Wording p.3 cover types: "Comprehensive", "Third Party, Fire and Theft", "Third Party
   Only". `[from ticket EAINT-12078, Jira Supporting Documents row 1 + attachments]`
   `[source: pipeline EAINT-12078, Scout chat to Scribe, 2026-10-27]`
5. **QA man-days on record for Secarang insurance CRs** (Jira "[QA] Est Man-day (cf
   10081)"): EAINT-12175 — Lonpac name + SDPA wording link "3"; EAINT-12107 — ShopeePay /
   GrabPay via Fiuu "2"; EAINT-8608 — Zurich Takaful onboarding "15"; EAINT-8786 —
   Takaful Malaysia PDS update "—"; EAINT-8334 — remove discount line "—". eAuto
   Takaful Malaysia CRs EAINT-9215 (NDDP) and EAINT-9214 (control sequence) "—".
   `[from ticket <KEY>, each <KEY>-jira.md line 11]`
   `[source: pipeline EAINT-12078, Scribe related history "Estimated testing effort", 2026-10-27]`

## Update 2026-10-27 from EAINT-12429 (social-media leads)

1. **Macrokiosk renewal reminder has 3 fixed customer sources.** EAINT-12218 SRD v1.1,
   REQ-003 — Customer Source and Eligibility (§2.2.4, p.16): "Customer records are drawn from 3
   sources: eSTM with insurance, eSTM without insurance, and Secarang."
   (`_reference/tickets/Studying/EAINT-12218/EAINT-12218_SRD_v1.1_20260903-text.md` lines 297-299)
   `[from ticket EAINT-12218, SRD v1.1 REQ-003]`
   `[source: pipeline EAINT-12429, Scribe related history, 2026-10-27]`
   The SRD has no rule for a 4th source, so social-media leads (EAINT-12429) would need a
   change to this rule to reach the reminder. `[unconfirmed]`
2. **Fixed template grid.** EAINT-12218 SRD v1.1, REQ-001 — 9 renewal reminder templates
   (§2.2.4, p.14): "9 Macrokiosk renewal reminder templates are used in total, grouped into 3
   sets of 3. Each template is used by 1 source at 1 reminder point." (text copy line 245)
   `[from ticket EAINT-12218, SRD v1.1 REQ-001]`
3. **Exact-day pickup.** REQ-003 (§2.2.4, p.16): "A customer is included in a run only where the
   policy expiry date falls exactly on the reminder point for that run." (text copy lines 300-303)
   `[from ticket EAINT-12218, SRD v1.1 REQ-003]`
4. **One source per customer.** Assumption 4 (§2.1.1, p.9): "A customer is held under 1 source
   only, so no customer is sent more than 1 message on the same date." (text copy line 160)
   `[from ticket EAINT-12218, SRD v1.1 §2.1.1]`
5. **Expiry date is required.** Assumption 6 (§2.1.1, p.9): "Customer records from all 3 sources
   carry a reliable policy expiry date." (text copy line 162) So a test record with no policy
   expiry date never gets a reminder. `[from ticket EAINT-12218, SRD v1.1 §2.1.1]`
   `[source: pipeline EAINT-12429, Scribe related history "Known traps" 9, 2026-10-27]` `[unconfirmed]` for the inference
6. **Registration logic out of scope.** Out-of-Scope 5 (§2.1.2, p.10): "Changes to customer
   registration logic in eSTM and Secarang" — reason "Customer registration remains unchanged."
   (text copy lines 179-181) `[from ticket EAINT-12218, SRD v1.1 §2.1.2]`
7. **Plan time for Meta approval.** Miro planning card, EAINT-12217 — opt-out button: "Dev side's
   ETA need additional 3 days buffer to send the template to Meta for approval before QA can test"
   (`_reference/miro/miro-eauto-qa-resource-planning-full-2026-10-26-part2.md` line 69)
   `[source: pipeline EAINT-12429, Scribe related history "Known traps" 1, 2026-10-27]`
8. **Macrokiosk staging access is time-boxed.** Same Miro file line 72: "BA need to let Macrokiosk
   side know how long we need the access for our testing purpose, so need to share the QA testing
   effort to MJ" `[source: pipeline EAINT-12429, Scribe related history "Known traps" 2, 2026-10-27]`
9. **Past Macrokiosk QA-Issues** (under EAINT-12218): EAINT-12390 — eSTM record shows an expiry
   date in the past; EAINT-12392 — date format and opt-out line differ from the SRD; EAINT-12410 —
   template rows in the wrong order in CIBO Macrokiosk Template Management; EAINT-12413 — template
   paused email misses SRD recipients. (`EAINT-12218-jira.md` line 13, Sub-tasks)
   `[source: pipeline EAINT-12429, Scribe related history "Past QA-Issues mentioned", 2026-10-27]`
10. **QA man-days on record:** EAINT-12218 — 9-template split: Jira "[QA] Est Man-day (cf 10081):** 6";
    Miro "Est. Testing Mandays: 5 days (1 QA)". EAINT-12217 — opt-out button: Jira 3; Miro "Est.
    Testing Mandays: 2 days (1 QA)". `[from ticket EAINT-12218, EAINT-12217, <KEY>-jira.md line 11]`
    `[source: pipeline EAINT-12429, Scribe related history "Estimated testing effort", 2026-10-27]`

## Update 2026-10-28 from the eAuto - Macrokiosk Miro board

Source: board capture `_reference/miro/uXjVJ5lCjy4=-2026-10-28.md` (187 text items; the board's
25 tables were not captured). Board covers the EAINT-8669 — Macrokiosk Pay Now / Pay Later renewal TS,
not the EAINT-12217 / 12218 TS. `[source: pipeline EAINT-12429, Scribe chat, 2026-10-28]`

1. **Trigger limit:** "MacroKiosk Trigger Limit: Max. 3 times" (frame **MacroKiosk High Level
   Test Plan**, capture line 17). What the limit counts is not stated. `[miro: uXjVJ5lCjy4=, 2026-10-28]` `[unconfirmed]` scope
2. **Renewal path (Pay Now):** WhatsApp "Renew Insurance" → [Pay Now] → "Redirect to Secarang Step 4"
   → payment → cover note. Example, SECPN_TS29 — Individual Pay Now with insurance API down (line 63).
   `[miro: uXjVJ5lCjy4=, 2026-10-28]`
3. **No WhatsApp when the cron cannot quote the record:** "CJ pickup the trx but vehicle details NOT
   match > Should NOT trigger MKWA API" (SECPN_TS18, line 88); "CJ pickup the trx but ALL insurance hit
   refer risk error > Should NOT trigger MKWA API" (SECPN_TS20, line 90); "CJ pickup the trx but ALL
   insurance API down > Should NOT trigger MKWA API" (SECPN_TS16, line 87). Same set exists for eAuto
   Insurance (eAIPN_) and eSTM (eSTMPN_) records. `[miro: uXjVJ5lCjy4=, 2026-10-28]`
4. **Payment result on the 30-day message stops later reminders:** "Transaction Payment = Failed / OK
   on 30 days, wont pickup on 14 / 7 days" (line 190). Adds the Failed case to "none after payment"
   above. `[miro: uXjVJ5lCjy4=, 2026-10-28]`
5. **eSIM levers for cron negatives:** "XG for vehicle details not found / - MD for TokioMarine refer
   risk / - XF for Lonpac refer risk / - XH for both refer risk" (line 40). `[miro: uXjVJ5lCjy4=, 2026-10-28]`
6. **Past cron bugs on this flow** (EAINT-8669 sub-tasks, `EAINT-8669-jira.md` line 13): "EAINT-11715
   [Secarang - Cronjob] Picks up transactions older than 1 year (2024 transaction picked up in 2026)";
   "EAINT-11504 [Secarang - Cronjob] WhatsApp Renewal Reminder Triggered for Non-Car Vehicle Types (e.g.
   Motorcycle), Should Only Trigger for Car Transactions". Check record age and car-only in any new
   pickup. `[source: pipeline EAINT-12429, Scribe related history "Known traps" 14, 2026-10-28]`

## Update 2026-10-27 from EAINT-12406 (Allianz back on Secarang)

`[source: pipeline EAINT-12406, Scout study "Knowledge candidates" 1-5, 2026-10-27]`
SRD text copy: `_reference/tickets/Studying/EAINT-12406/SRD_EAINT-12406_v1.1_20261026-text.md`.

1. **Allianz was off Secarang before 12406.** SRD v1.1 §2.2.2 #1 a: "Allianz quoting was
   switched off for Secarang in May 2025 and Allianz was removed from Secarang screens in
   Sept 2025." Matches the EAINT-8608 list "Allianz (Hidden from Secarang since 19.05.2025)"
   (`flow-zurich-takaful.md` §2 #3). `[from ticket EAINT-12406, SRD v1.1 §2.2.2]`
2. **Allianz quotes individual owners on renewal only.** REQ-002 — Enable Allianz (§2.2.5):
   "Allianz only returns a quotation for individual owners renewing their insurance."
   `[from ticket EAINT-12406, SRD v1.1 REQ-002]`
3. **No Allianz quote = unavailable card after Tokio Marine.** REQ-003 — No Allianz
   Quotation (§2.2.5): "Applies when Allianz has no quotation, e.g. company vehicle or
   non-renewal. Show "Allianz – Quotation unavailable" card, same as Lonpac and Tokio Marine
   today. Card appears after Tokio Marine." Adds a branch to §5 #6 (insurer card
   unavailable). `[from ticket EAINT-12406, SRD v1.1 REQ-003]`
4. **Insurer order after 12406.** REQ-004 — Insurer Sequence (§2.2.5): "Existing: Lonpac >
   Tokio Marine" → "New Expected: Lonpac > Allianz > Tokio Marine". "Insurer without
   available quotation is skipped; the rest keep the same order." The same order applies to
   Home logos (REQ-001), FAQs (REQ-008) and Support (REQ-009).
   `[from ticket EAINT-12406, SRD v1.1 REQ-001, REQ-004, REQ-008, REQ-009]`
   Order changes often; take it from the current ticket (`eauto-insurance.md` line 179).
5. **Insurer name + BRN on the receipt.** REQ-010 — Allianz Company Number (§2.2.9): Tokio
   Marine "198601000381 (149520-U)"; Allianz new "200601015674 (735426-V)" (old receipt showed
   only "(735426-V)"). "Receipt for Tokio Marine or Lonpac transaction ⏎ a. No change."
   CIBO side: `flow-cibo.md` §4.4a. `[from ticket EAINT-12406, SRD v1.1 REQ-010]`
6. **Static pages that list insurers:** "Home page insurer logos", "About Us > Our
   partnership", "FAQs > Which insurers can I get instant quotation from?", "Support > Need
   to contact insurance company?" (SRD v1.1 §2.2.2 #1 b). `[from ticket EAINT-12406, SRD v1.1 §2.2.2]`
7. **Support page contact numbers** (Secarang mock-up 20261015 text copy, lines 160-179):
   1. Lonpac: "Road Assistance Hotline (24 Hours) 1300 88 1138"; "Customer Service 03 2262
      8666"; "General Line 03 2262 8688 / 03 2723 7888".
   2. Allianz (new): "24-Hours Helpline 1800 22 5542", then "You can request 24/7 towing and
      roadside assistance from Allianz by calling the toll-free Allianz Road Rangers Helpline
      at 1800-22-5542".
   3. Tokio Marine: "Road Assist Hotline (24 Hours) 1800 88 1301 / 03 2053 5800"; "Customer
      Service Hotline 1800 88 0812".
   Each insurer is an expand / collapse section (REQ-009). `[from ticket EAINT-12406, mock-up 20261015]`
8. **No Allianz test data is known.** The made-up plates HXA0001A–HXA0020A + IC 030217141005
   are proven to quote Lonpac on /ia only (§7 #15 a); whether Allianz quotes them is
   `[unconfirmed]`. Check with `/eauto/secarang-plate-checker` (§16) before buying.
   `[source: pipeline EAINT-12406, Scout chat to Scribe, 2026-10-27]`
9. **Do not reuse the old single-insurer expected result.** EAINT-9024 (Secarang insurer
   order, Lonpac Q4 campaign) expected "Display ONLY the top insurance" when one insurer has no
   quote (Sheet1 R9-R10, both "Not Started"; only TS1 was run). EAINT-12406 REQ-003 shows an
   unavailable card instead. Whether the 9024 rule still applies anywhere is `[unconfirmed]`.
   `[source: pipeline EAINT-12406, Scribe related history "Known traps" 1-2, 2026-10-27]`
