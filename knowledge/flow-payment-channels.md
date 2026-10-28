# Flow — UCD onboarding payment channels (Pre-application fee · Registration fee)

Covers the **payment step** of dealer onboarding: the channel tiles (Credit or
Debit Card, Online Banking (Business) = FPX B2B, Online Banking (Personal) = FPX
B2C, and the planned DuitNow QR), the Fiuu popup and bank simulator, the
success/failure pages, the B2B **Pending Approval** workflow, and how the two
automation projects drive it. Tickets: **EAINT-12153** (channels + B2B pending
approval), **EAINT-12257** (DuitNow QR), **EAINT-12414** (two live defects on
this step).

The surrounding onboarding journey (reCAPTCHA gate, forms, BackOffice approvals,
registration documents) is in [flow-ucd-onboarding.md](flow-ucd-onboarding.md).
Gateway status codes and the Secarang chain this ports from are in
[eauto-payments.md](eauto-payments.md).

Sources, in order of weight:

1. `scripts/eauto-duitnow-qr/src/payment.ts` and `src/dealer.ts` — selectors
   ported from Charmain's reference rig and **matched live on 2026-08-31**
   (`[verified: scripts/eauto-duitnow-qr/src/payment.ts · header comment]`).
2. The reference pack `_reference/automation code/Pre-Application & Application/
   eAuto-PreApplication-to-Registered-E2E-Flow-Pack/` — `03-automation/src/preapp.js`,
   `03-automation/reference-data/locators-learned.json`, `02-screens/13-*`, `14-*`,
   `34-*`, `35-*` (aria + text captures from live runs), `01-flow/FLOW-video-verified.md`
   (23-08-2026 walkthrough recording).
3. SRD v1.1 `_reference/tickets/EAINT-12153/EAINT-12153_SRD_..._v1.1_20260824.pdf`
   (text extract made this session with `pdftotext`). **Latest is v1.2**
   (`..._Add B2B Payment Channel ..._v1.2_20260904.pdf`, same folder, added
   2026-10-21). EAINT-12257 SRD v1.0 text:
   `_reference/tickets/EAINT-12257/EAINT-12257-SRD-v1.0-20260910-text.md`.
4. Mockup `_reference/tickets/EAINT-12153/EAINT-12153_B2B_Pending_Approval_Mockups.html`.
5. Test sheet `_reference/tickets/EAINT-12153/EAINT-12153 - ...(Sheet1) 11.24 1.9.2026.csv`.
6. `scripts/eauto-payment-channels/**` — a **skeleton**; every page-object method
   throws `PendingHtmlCapture`. It records the sheet's steps, not the DOM.

**No raw HTML of the payment step exists in the repo.** The reference pack ships
aria trees and text, not markup (`02-screens/INDEX.md`: "the pack deliberately
ships the aria tree and the text rather than the raw HTML dumps"). Every DOM
handle below therefore carries the file:line it was read from, and the first
live session on this step must save `<body>` outerHTML to
`_reference/html/eauto/obs-preapp-review-payment.html` and
`obs-application-step5-payment.html` per `AGENTS.md`.

## 0. Official test scripts — follow these (2026-10-21)

The SharePoint workbooks below are **the TS the team follows** for both tickets,
agreed by Faizuddin after consulting the team on 2026-10-21. The "Suggestion by
Claude - …" workbooks (repo `_reference/tickets/<KEY>/` and OneDrive
`eAuto Documents/<KEY>/`) are suggestions only — do not test or automate from
them. `[from Faizuddin, 2026-10-21]`

| Ticket | SharePoint file (QATeam › 1. eAuto Project › eAuto - CR Test Scenarios) | Version | Cases | Text copy |
|---|---|---|---|---|
| EAINT-12153 | `EAINT-12153 - 🔴[eAuto-Application] Add Payment Channels for Pre-application and Application.xlsx` | v38, 2026-10-21 | TS1–TS8 | `_reference/tickets/EAINT-12153/EAINT-12153-official-TS-sharepoint-v38-20261021.md` |
| EAINT-12257 | `EAINT-12257 -🔴[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application.xlsx` | v19, 2026-10-21 | TS1–TS9, TS11 (no TS10) | `_reference/tickets/EAINT-12257/EAINT-12257-official-TS-sharepoint-v19-20261021.md` |

1. **12153:** TS1–TS2 B2B Success / Failed; TS3 B2B Pending Approval (revisit via
   email link) > Approved; TS4 B2B Failed > Success then authorizer approves;
   TS5–TS8 FPX (B2C) and card regression.
2. **12257:** TS1 happy flow; TS2 reject & retry; TS3 Cancel; TS4 close QR window;
   TS5 timer expiry; REGRESSION TS6–TS9 (B2C, card) and TS11 (B2B).
3. **Written as the team agreed — follow the cells as they are**, including:
   Pre-Application listing "Status = Approved" in most rows and "Status = New" in
   12153 TS3/TS4; "Application Submitted for Review" on the 12257 application leg of
   TS2–TS5. Raise a finding only if the system disagrees during execution.
4. **12153 note B15 answer:** the new B2B requirements are tested on "the popup page
   from Fiuu side only". `[from SharePoint TS EAINT-12153 v38, Sheet1!B15]`
5. **Re-read the SharePoint file before quoting a cell** — the text copies are
   snapshots of 2026-10-21.

## 0b. Live run 2026-10-21 (staging) — fee change and confirmed page states

1. **Registration fee is now RM 1,500.00, not RM 990.00.** Step 5 Payment Summary:
   Dermalog Biometric Device Purchase RM 850.00 + Registration fee (excl. SST)
   RM 601.85 + Service Tax 8.0% RM 48.15 = **RM 1,500.00**; declaration: "eAuto
   Registration Fee: RM 650.00 (inclusive SST)" + "One (1) Dermalog Biometric
   Device: RM 850.00 (non SST)". Every RM 990 in this file and in
   `scripts/eauto-duitnow-qr` (`QR_FEE_REGISTRATION`) is out of date.
   `[verified: _reference/html/eauto/obs-application-step5-payment-initial.html]`
2. **Payment tiles on staging (both fees): only `#payment-credit` and
   `#payment-fpx-personal`.** No Online Banking (Business), no DuitNow QR —
   12153/12257 not deployed. FPX (Personal) grid = 10 banks `bank-b2c-1..10`.
3. Full chain driven by hand: P261021/00889 → NA60001190 (UDIN ONBOARD TESTING
   SDN0001). Captures for every page in `_reference/html/eauto/obs-*.html`,
   `_reference/html/fiuu/`, `_reference/html/esim/`.

## 1. Why this flow matters, and what depends on it

Every dealer onboarding pays **twice**: RM 108.00 at the pre-application review
and RM 990.00 at Application step 5. Nothing past phase 2 of the onboarding flow
exists until the first payment lands, and the record is not complete until the
second does. `[verified: 01-flow/01-phase-quickref.md · "The money"]`

Three tickets sit on this one step. EAINT-12153 added the Card and B2B tiles and
the B2B pending-approval pages; EAINT-12257 adds a DuitNow QR tile; EAINT-12414
fixes a failed-card return path. Any automation for one of them has to drive the
same tiles, the same popup, and the same two success pages described here.

## 2. Entry points

| # | Entry | How | Status |
|---|---|---|---|
| 1 | **Pre-application review, "2 Business Info Review"** | `/obs/preOnb/recaptcha` → form → `#nextSubmitBtn` → review step on `/obs/preOnb/form/<uuid>` | **verified** (`02-screens/13-business-info-review.txt`, URL on line 1) |
| 2 | **Application step "5 Payment"** | the dealer link `/obs/form/<sec>?id=<brn>&s=<token>&v=1` once the BO assignee has pressed Verified on the registration documents | **verified** (`02-screens/34-registration-fee.txt`, URL on line 1) |
| 3 | "Open eAuto Login page and click **Apply eAuto**" | the test sheet's Initial Step 1 for every TS | **unverified** — the reference rig never used it; it goes straight to `/obs/preOnb/recaptcha`. `scripts/eauto-payment-channels/pages/ucd/PreApplicationFormPage.ts:22` is a `pending()` stub. `[unconfirmed]` |
| 4 | **Return after a failed payment** | the gateway sends the applicant back to the same review step (pre-app) or step 5 (application) with the Unsuccessful Payment banner | partly verified — FPX popup path observed; the card **same-tab** path is EAINT-12414's defect, see §7 |
| 5 | **Re-entry while B2B approval is pending** | the system redirects the applicant to the Pending Approval summary page until the authorizer acts (REQ-006) | **not built / not observed** — SRD + mockup only |

The review step and step 5 are **eAuto-hosted pages** (`/obs/...`). The tiles
and the bank grid live on eAuto's page; only `Submit and Pay` hands over to Fiuu.
`[verified: 02-screens/13-business-info-review.aria.yaml (tiles absent only
because that capture predates the method choice); 34-registration-fee.aria.yaml
lines 20-25 show the three tiles as `img` + text on the /obs/form page]`.
This corrects the EAINT-12153 study's belief that the step is "gateway-framed
(Fiuu-hosted)" — see the addenda.

## 3. URL map, step by step

Base host only, no instance segment (`/obs` sits outside `/uat4`-style paths).
`[verified: scripts/eauto-duitnow-qr/src/env.ts:8-19]`

| Step | URL pattern | Arrival signal |
|---|---|---|
| reCAPTCHA gate | `/obs/preOnb/recaptcha` | human tick; passing lands on `/obs/preOnb/form` `[verified: src/humanGate.ts:69]` |
| Pre-application form, step 1 | `/obs/preOnb/form`, then `/obs/preOnb/form/<uuid>` once the draft exists | `#businessName` present `[verified: preapp.js:84]` |
| Review + payment (step 2, same page) | `/obs/preOnb/form/<uuid>` | `#nextSubmitBtn` text reads `Submit and Pay` **or** `#agreeTerms` visible `[verified: preapp.js:387-389]` |
| FPX hand-off | `/obs/preOnb/landing/<uuid>/<bank>` → **popup** to `sandbox-payment.fiuu.com` ("Connecting to FPX... Please don't close, refresh or press back button on browser") | new page in the context `[verified: 01-flow/03-actors-urls-accounts.md · Dealer table; 05-known-traps.md §5]` |
| Fiuu bank simulator | `bank-simulator.fiuu.com/<CHANNEL>/login` — `MB2U0227` = Maybank, `AMB80209` = AmBank | `input[type=password]:visible` `[verified: 03-actors-urls-accounts.md; src/payment.ts:195]` |
| Pre-application paid | `/obs/preOnb/summary/<uuid>` — "Pre-Application Submitted for Review." | URL regex `/\/preOnb\/summary\/([\w-]+)/` is both the completion signal and the uuid `[verified: src/dealer.ts:77; 02-screens/14-preapplication-submitted.txt]` |
| Application step 5 Payment | `/obs/form/<sec>?id=<brn>&s=<token>&v=1` (same link as steps 1-4; `s=` is a server-minted signature) | text `Payment Summary` `[verified: src/dealer.ts:440]` |
| Registration fee paid | same URL, body replaced by "Application Payment Success" | text `/application payment success\|payment status:?\s*paid/i` `[verified: src/dealer.ts:434-435; 02-screens/35-registration-fee-paid.txt]` |
| B2B Pending Approval page (pre-app) | **unknown** — mockup only; header reads `Dealer Application - P250910/00006` | `h1` "Payment is Pending Approval" `[from SRD EAINT-12153 §2.2.3 row 3 + mockup]` |
| B2B Pending Approval page (application) | **unknown** — mockup only; rendered inside the "eAuto Application Form" shell | `h2` "Payment is Pending Approval" `[from mockup]` |
| BO pre-application detail (Payment Details block) | `/obs/admin/preOnb/summary/<uuid>` | Reject / Approve buttons `[verified: src/env.ts:16; FLOW-video-verified.md Phase 3]` |

The gateway popup's own URL chain was never captured as HTML — the rig dumps it
to `discovery/fpx-gateway-*` which is **not** in the pack. `[unconfirmed]`

## 4. The real DOM handles — verbatim

### 4a. Pre-application review (step 2 of `/obs/preOnb/form/<uuid>`)

| Target | Handle | Source |
|---|---|---|
| Declaration checkbox | `#agreeTerms` — **mandatory**; `Submit and Pay` stays disabled until ticked | `src/dealer.ts:64`; `locators-learned.json` key `review.agreeTerms`; `05-known-traps.md §6` |
| Next / Submit and Pay | `#nextSubmitBtn` — the **same button** relabels itself to "Submit and Pay" on the review step | `src/dealer.ts:60,73`; `preapp.js:18-19`; `locators-learned.json` keys `preapp.next.1`, `preapp.next.2`, `review.submitAndPay` |
| Payment method radios | `input[name="paymentMethod"]` — hidden behind image cards, **never visible**; read with `document.querySelector('input[name="paymentMethod"]:checked').value` | `src/payment.ts:23-37` |
| Card tile | accessible name `Credit or Debit Card`; radio value `credit`; css `#payment-credit` | `preapp.js:439-443` (css values are the rig's forceRadio targets; the `b2c` one matched live, `credit`/`b2b` are the same pattern and **not confirmed live**) |
| B2B tile | accessible name `Online Banking (Business)`; value `fpx_business`; css `#payment-fpx-business` | same |
| B2C tile | accessible name `Online Banking (Personal)`; value `fpx_personal`; css `#payment-fpx-personal` — **matched live** via text `/online banking \(personal\)/i` | `locators-learned.json` key `review.paymentMethod` (2026-08-31T09:48:16Z); `src/payment.ts:26` |
| DuitNow QR tile | text `/duitnow\s*qr/i`; value `duitnow_qr`; css `#payment-duitnow-qr` — **[UNVERIFIED]**, invented by analogy; the channel is not built | `src/payment.ts:27` |
| Tile click strategy | click `page.getByText(tile.text).first()`; if the checked value is not the expected one, `forceRadio()` sets `checked=true` and dispatches `change` + `click`; then wait 600 ms because **the bank grid renders off the choice** | `src/payment.ts:39-68` |
| Bank radios | `input[name="bankSelection"]` with `data-category="FPX_B2C"` or `"FPX_B2B"`. **Both categories share the one `name`**, so a bare first-match is a *business* bank (`FPX_M2E`) even when Personal was chosen | `src/payment.ts:70-106`; `preapp.js:485-532` |
| Bank card click | `page.getByRole("img", { name: /maybank/i })` (alt text), fallback to text; then assert `data-category` matches the method or throw `"the gateway would be handed a mismatched pair"` | `locators-learned.json` key `review.bank`; `src/payment.ts:83,101-104` |
| Bank grid contents (Personal) | Maybank, CIMB, AmBank, Public, RHB, HLB, HSBC, Affin, Bank Rakyat, BSN | `FLOW-video-verified.md` Phase 2 (video) |
| Payment Summary | table rows `Pre-Application Fee: RM 100.00`, `Service Tax 8% : RM 8.00`, `Total Amount (Inclusive of 8% Service Tax) : RM 108.00` | `02-screens/13-business-info-review.aria.yaml` |
| Busy overlay | text `/working\s*(\.\.\.\|…)?/i` ("Working…" with a real ellipsis) | `src/dealer.ts:319`; `preapp.js:289` |
| Failure banner | `.unsuccessful-payment-container:visible` | `src/payment.ts:157`; `preapp.js:813-814` |

### 4b. Application step 5 Payment (`/obs/form/...`)

| Target | Handle | Source |
|---|---|---|
| Arrival | text `Payment Summary`; step bar `1 Business Information 2 Upload Files 3 Acknowledgement 4 Registration Documents 5 Payment` | `src/dealer.ts:440`; `02-screens/34-registration-fee.txt` |
| Summary rows | `Dermalog Biometric Device Purchase: RM 772.00`, `Registration fee (excluding Service Tax): RM 201.85`, `Service Tax 8.0% : RM 16.15`, `Total Amount (inclusive of 8.0% Service Tax) : RM 990.00` | `34-registration-fee.txt` |
| Declaration | **static text** ("Declaration and Acknowledgement:" heading, list items), **no checkbox** — unlike the pre-app step | `src/dealer.ts:432`; `34-registration-fee.aria.yaml` (no `checkbox` node) |
| Tiles | `img "Credit or Debit Card"`, `img "Online Banking (Business)"`, `img "Online Banking (Personal)"` each followed by its text — same `paymentMethod` / `bankSelection` radios as 4a (the rig reuses `pickPaymentMethod`/`pickBank` unchanged) | `34-registration-fee.aria.yaml:20-25`; `src/dealer.ts:441-442` |
| Submit | `button "Submit & Pay"` — **ampersand**. Locator `getByRole("button", { name: /submit\s*(&\|and)\s*pay/i })` covers both steps | `src/dealer.ts:444`; `locators-learned.json` key `regfee.submitAndPay` |
| Back | `button "Back"` | `34-registration-fee.aria.yaml` |
| Footer | `Application Form / Version 1.0` (steps 1-4 say `Version 1.5`) | `34-registration-fee.txt`; `FLOW-video-verified.md` Phase 4/9 |

### 4c. Success pages

**Pre-application** (`/obs/preOnb/summary/<uuid>`) — `02-screens/14-preapplication-submitted.txt`:

1. Header `Dealer Application - P260831/00838`; h-text `Pre-Application Submitted for Review.`; copy "Thank you! Your payment is completed and your application has been submitted for review. An invoice and/or e-Invoice will be emailed to <admin email>."
2. `Pre-Application Summary` table: `Pre-Application No:`, `Business Registered Name:`, `Business Trading License No:` (or BRN rows on SSM types), `Tax Identification No (TIN):`, `Showroom Address:`, `Showroom Postcode:`, `State:`, `City:`, `Business Type:`, `Trading License:` (filename), `Pre-Application Fee: RM 108.00 (Inclusive of 8% Service Tax • Non-refundable)`.
3. `Payment Details` table: `Payment ID: P260831000879`, `Payment Method: FPX Online Banking (Maybank)`, `Payment Date Time: 31-08-2026 05:45pm`, `Payment Status: Paid`, `Payment Document: Invoice` (download control).
4. `Admin In Charge` table: `Name:`, `Mobile No:`, `Email Address:`.
5. The pre-application reference regex used by the spec: `/\bP\d{6}\/\d{4,6}\b/` `[verified: tests/happy-flow.spec.ts:163]`. Status on the BO listing after payment is **New**, not Approved `[verified: FLOW-video-verified.md Phase 2-3]`.

**Registration fee** (same `/obs/form/...` URL) — `02-screens/35-registration-fee-paid.aria.yaml`:

1. `img "Success"`; text `Application Payment Success` + "Thank you! Your payment is completed and our team will reach out you soon to finalise the application. Meanwhile, an invoice and/or e-Invoice will be emailed to <email>."
2. `Payment Details` table: `Payment ID: A260831000188`, `Payment Method: FPX Online Banking (Maybank)`, `Payment Date Time: 31-08-2026 05:48pm`, `Payment Status: PAID` (upper case here, `Paid` on the pre-app page), `Payment Document:` cell holding `button "Download Invoice"` (`img "Download"` + text `Invoice`).
3. Payment ID prefixes: `P` for the pre-application fee, `A` for the registration fee. `[verified: both captures]`
4. The pack's own reader of these pages: `PAID_RE = /payment\s*success|payment\s*status\s*:?\s*paid|\bPAID\b/i`, plus `Payment\s*ID\s*:?\s*(\S+)` and `Payment\s*Method\s*:?\s*(.+)` greps `[verified: 03-automation/src/creation.js:242-295]`.

Neither success capture shows an **e-Invoice** control — only `Invoice`. The sheet
expects "download invoice and e-invoice" on both legs. `[unconfirmed — e-Invoice
download control never observed]`

### 4d. Fiuu popup and bank simulator

Observed on the 23-08-2026 recording and driven live on 2026-08-31; **no HTML
captured** `[verified: preapp.js:573-660; src/payment.ts:160-213]`:

1. The popup opens on a "Processing payment... do not close this window" landing page with **no controls** — treat as "not arrived yet", not a failure (`src/payment.ts:262-264`).
2. Login page: first visible `input[type=text]` / `input:not([type])` = username, `input[type=password]:visible` = password, submit via `getByRole("button", { name: /^log ?in$/i })` or `button[type=submit], input[type=submit]` (`preapp.js:609-620`). Credentials are typed **only** when `new URL(p.url()).hostname === "bank-simulator.fiuu.com"` (`src/payment.ts:195-199`).
3. Simulator page (Maybank `MB2U0227`): Channel, Pay To `FIUU`, Order ID, Description "Testing for Bank Simulator", `Amount (RM): MYR 108.00`, a `Transaction Authentication Code` shown **in another input's value** beside a copy control, an empty `Enter TAC` input, a "Please set payment status below" `<select>` whose option text contains `Approved`, and `Pay Now` (`FLOW-video-verified.md` Phase 2; `preapp.js:638-659`).
4. AmBank `AMB80209` wants `Request TAC` clicked first; the generic click regex `PAY_LABEL = /^(pay|pay now|confirm|approve|submit|proceed|continue|agree|accept|ok|next|done|request tac)$/i` covers it (`src/payment.ts:30`).
5. Driver order per loop: set every `<select>` to its `Approved` option → fill the TAC box (matched by `/tac/i` over `name+id+placeholder`, value taken from body text `Transaction Authentication Code\s*:?\s*(\d{4,8})` or any other filled 4-8-digit input not matching `/amount|order|postcode|mobile|phone/i`) → click the first `PAY_LABEL` button → cap of **8 clicks per window**, then hand over (`src/payment.ts:161-192, 262-277`).
6. eAuto side on success: "Payment successful. This window will close automatically", then the parent page replaces itself with the success URL/page (`preapp.js:30-33, 665`).

**Confirmed 2026-10-21 from live captures** (onboarding pre-app, Maybank, staging;
`_reference/html/fiuu/bank-simulator-mb2u-login.html`, `-tac-before-request.html`,
`-tac-after-request.html`): login page `#username` / `#password` / `#login-btn`
(AJAX POST `/MB2U0227/verify-login`, then form posts to `/MB2U0227/simulator`);
TAC page `form[name=fpx_form]` → `/MB2U0227/result`, summary table (Channel, Pay To
FIUU, Order ID, Description, Amount), `#tac-btn` "Request TAC" puts a random 6-digit
TAC into readonly `#otp` **in the page** and reveals `#pay-btn` "Pay Now" and
`#copybtn`; `#tac_no` "Enter TAC" (required); **`select#status_code`** with `00`
Approved selected, `51` Insufficient Funds, `80`/`BC` cancel, **`99` Pending for
Authorization (Applicable for B2B Model)**, `OE` not in FPX hours, `OF` timeout, etc.
Changing it copies the code into `fpx_debitAuthCode`/`fpx_creditAuthCode` and sets
`statusChanged=true`. Hidden `fpx_txnAmount` = `108.00`. The popup opens as a
separate window — the Chrome tool cannot reach it; capture by pasting page source.

The Secarang chain's `select#status_code` / `div.otp` selectors
(`eauto-payments.md` § gateway chain) are **not confirmed on this module** — the
rig deliberately matches by option text and input heuristics instead.
`scripts/eauto-payment-channels/pages/ucd/FpxBankTacPage.ts` is still a stub
for the same reason. `[unconfirmed]`

### 4e. B2B Pending Approval pages (mockup DOM, EAINT-12153 v1.1)

`_reference/tickets/EAINT-12153/EAINT-12153_B2B_Pending_Approval_Mockups.html`
is a picker (`select#screen`) that `srcdoc`s two full pages into `iframe#stage`.
Mockup markup, not the build — treat every selector as **[unconfirmed]**:

**Screen `pa` — "Pre-Application - Payment Pending Approval (B2B)"**, `<title>eAuto — Pending Approval from Authorizer</title>`:

1. `header.app` → `.app-title` "Dealer Application - P250910/00006".
2. `main > .card > .hero`: `.status-icon` (amber clock svg), `h1` "Payment is Pending Approval", `p` "Thank you. Your payment has been submitted and is pending authorizer approval. Your authorizer has 7 days to approve the transaction through online banking. If it is not approved within 7 days, the payment will expire and the Pre-Application will not be submitted.", `p` "An invoice and/or e-Invoice will be emailed to **<email>** once the payment is approved."
3. `.section-title` "Pre-Application Summary" + `table.kv` with `td.k` labels: Business Registered Name, Business Registration No (`20231230501923 (87654321-M)` — new BRN then old BRN in brackets), Tax Identification No (TIN), Showroom Address, Showroom Postcode, State, City, Type of Business, Pre-Application Fee (`RM 108.00` + `.subnote`). **No `Pre-Application No:` row, no SSM document row** — matching REQ-004(d).
4. `.section-title` "Payment Details" + `table.kv`: Payment ID `2510020017000009`, Payment Method `FPX Online Banking (Maybank)`, Payment Date Time `23-12-2024 12:20pm`, Payment Status `<span class="status-pill">Pending Approval</span>`, Payment Document `<span class="doc-wait">Invoice and e-Invoice will be available once payment is successful.</span>`.
5. `.section-title` "Admin in Charge" + `table.kv`: Name, Mobile No, Email Address (+ `.subnote` "We will email an invoice and/or e-Invoice once payment is successful.").

**Screen `app` — "Application Form - Payment Pending Approval (B2B)"**, `<title>eAuto Application Form — Pending Approval</title>`:

1. `.supportbar` "Support Team: 03-2779 8899 · Application email: apply@eauto.my · WA : 012 200 1324", `h1.form-title` "eAuto Application Form".
2. `.panel > .card > .hero`: `h2` "Payment is Pending Approval", same 7-day copy but ending "...the Application will not be submitted.", then "An invoice and/or e-Invoice will be emailed to **<email>** once payment is successful."
3. One `table.kv` "Payment Details" — same five rows as above. **No Invoice / e-Invoice** — matching REQ-004(d).

**SRD v1.2 (04.09.2026) adds** `[from SRD EAINT-12153 v1.2 REQ-008, REQ-009, §2.3]`:

1. **Payment Submitted Date Time** on the Pending Approval page, format
   `DD-MM-YYYY hh:mm AM/PM` (e.g. `23-12-2024 12:20 PM`). Teams adds it is shown
   **for B2B only** `[from Teams EAINT-12153, 2026-09-07 18:36, Yi Link Lim]`.
2. **Payment Date Time** shows `-` while pending; the actual time once Fiuu returns
   an approved response. The mockup predates v1.2 — it shows a filled Payment Date
   Time and no Submitted row.
3. **Email** from `imonitor@eauto.my` to the applicant, CC `apply@eauto.my`, subject
   "[Pre-Application/Application No] [Company Name]: Payment Pending Approval -
   Awaiting Authorizer Approval"; deadline = submitted date + 7 days at 12:00 PM
   `[from Teams EAINT-12153, 2026-09-07 18:36, Yi Link Lim]`.
4. No B2B / C2B label on Payment Method `[same Teams message]`.

The mockup's 16-digit Payment ID (`2510020017000009`) does not match the
observed `P260831000879` / `A260831000188` shapes. `[unconfirmed — mockup data]`

### 4f. DuitNow QR popup (SRD v1.0 + dev-described, EAINT-12257)

**Written spec, SRD v1.0 (10.09.2026):** `[from SRD EAINT-12257 v1.0 REQ-002–006]`

1. Only one method selectable; choosing DuitNow QR enables "Submit and Pay".
2. Popup shows the "DuitNow (Malaysia National QR)" code from Fiuu, the text
   "Kindly scan the QR code below to proceed with payment. Do Not Refresh!", and a
   timer "Scan QR in mm:ss" starting at **03:00**, tied to Fiuu QR validity.
3. Success → Pre-Application Summary page (pre-app) / Application Payment Success page
   (application) — the same two pages as §4c.
4. Failure = timer 00:00, Cancel, or bank decline / insufficient funds → popup closes,
   back to method selection, banner "Unsuccessful Payment — Something went wrong and
   your payment didn't go through. Please choose a payment method and retry."
5. Retry any method, including QR, on the same Pre-application / Application.
6. "Pending (Fiuu)": amount shown in the popup? refresh/Back during the popup, and a
   duplicate-payment safeguard?
7. Trap: `QR_SCAN_BUDGET_MS` defaults to 10 min, longer than the 3-min QR validity.
8. **Outcome is set on the phone**, via the Fiuu simulator page
   `https://bank-simulator.fiuu.com/duitnow/viewqr` (choose Success / Rejected, then
   scan). Timer end, Cancel and **closing the QR window** all leave the payment
   **Failed**; the failure message is the existing one ("popup will disappear").
   `[from SharePoint TS EAINT-12257, Sheet1 rows 4 and 19-24, "Faiz's Note", read 2026-10-21; source of the answers not named]`
9. "Close the QR Code window" in the TS suggests a **browser window**, while the
   script waits for an in-page `role=dialog`. Which one it is stays unknown until
   the first live capture. `[unconfirmed]`

**SRD drift on the B2B Pending page:** v1.1 REQ-004 listed fields the Pending page
must NOT show (Pre-Application No., SSM Document, Invoice, e-Invoice); **v1.2 no
longer contains that list**. The mockup still omits them. `[from SRD EAINT-12153
v1.1 lines 162-168 vs v1.2, pdftotext, 2026-10-21]`

**Still nothing captured.** The script's guess: `page.getByRole("dialog").filter({ hasText: /duitnow|scan/i }).first()`, waited up to 60 s; dev described it as **QR image + countdown timer + Cancel Transaction button**; the phone side offers only Approve / Reject. `[verified: src/payment.ts:118-123 (the guess); from dev discussion via ticket EAINT-12257, 2026-09-02 (the shape)]`

## 5. Decision points and what they branch on

1. **Which fee.** Pre-application (RM 108.00, review step, has `#agreeTerms`, success = `/obs/preOnb/summary/<uuid>`) vs registration (RM 990.00, step 5, no checkbox, button "Submit & Pay", success = "Application Payment Success" on the same URL). The script's `pay(page, method, amount, what)` takes the fee from `QR_FEE_PREAPP` / `QR_FEE_REGISTRATION` (defaults `108.00` / `990.00`). `[verified: src/env.ts:43-44; src/dealer.ts:23-80, 437-447]`
2. **Which channel.** Four values of `paymentMethod`: `credit`, `fpx_business`, `fpx_personal`, `duitnow_qr` (last unverified). Only `fpx_personal` has been driven end to end. Card never driven; B2B never driven. `[verified: locators-learned.json has only `review.paymentMethod` = Personal]`
3. **FPX bank.** Only after an FPX tile; must be in the matching `data-category`. Default Maybank "because it is the one with a dependable sandbox" (`preapp.js:494-496`). Simulator UI differs per bank (Maybank TAC on screen; AmBank Request TAC first).
4. **Gateway outcome.** Chosen on the simulator's status dropdown — `Approved` for success, any failure reason for a decline. The sheet's "Failed" rows always mean *decline once, observe the banner, then redo until Success* (`scripts/eauto-payment-channels/utils/runPaymentLeg.ts:10-14`). Status codes: [eauto-payments.md](eauto-payments.md) § FPX status codes (`99` = Pending for Authorization, B2B).
5. **Failure redirect target.** Pre-application leg → back to **page 2 (Business Info Review)**; application leg → back to **Application Page 5**; both show "Unsuccessfull Payment / Something went wrong and your payment didn't go through. Please choose a payment method and retry." (sheet wording, double-l typo in the sheet; EAINT-12414 quotes it as "Unsuccessful Payment - Something went wrong and your payment didn't go through. Please choose a payment method and retry."). `[from test sheet TS2/TS4/TS6 expected results; from Jira EAINT-12414]`
6. **Card return path.** The card gateway sometimes returns to the **same tab** instead of the popup; on that path the form reloaded with no banner, declaration unticked, methods hidden (the defect). Fixed behaviour: land on step 2 with the banner, declaration still ticked, methods visible; refreshing after the error must **not** re-show the banner. `[from Jira EAINT-12414 + Teams, Mong Guo Hao 2026-09-29 16:06]`
7. **B2B pending approval (SRD v1.1 REQ-004..007).** After an Online Banking (Business) payment the applicant is redirected to the Pending Approval page (REQ-004); the authorizer has **7 days**; approved → the existing success redirect (REQ-005); still pending → the Pending Approval summary page on every revisit (REQ-006); not approved within 7 days → back to the payment page "following the existing unsuccessful-payment behaviour" (REQ-007). The Pending page must **not** show Pre-Application No, SSM Document, Invoice, e-Invoice (pre-app) or Invoice, e-Invoice (application). `[from SRD EAINT-12153 §2.2.5]` Where the authorizer approves (a BO screen? the bank?) is not in the SRD — the mockup says "through online banking". `[unconfirmed]`
8. **DuitNow QR outcomes (EAINT-12257).** Approve (phone) → eAuto success page; Reject (phone) → failure path; Cancel Transaction (popup button) and timer expiry → popup closes without success. The script treats "popup closed without a success signal" as an abort reason rather than waiting out the budget. `[verified: src/payment.ts:138-142; shape from dev discussion 2026-09-02]`
9. **Human gates per scenario.** reCAPTCHA always; plus the QR scan for a QR leg; plus the simulator login when `QR_FIUU_USER`/`QR_FIUU_PASS` are blank or the host is not the simulator. `12257_TS02` pays the pre-app fee by FPX **on purpose** so the operator scans once. `[verified: tests/happy-flow.spec.ts:178-180; app/api/eauto-duitnow-qr/run/route.ts:84-89]`

## 6. Preconditions and test data

### Accounts and secrets

| Item | Value / rule | Source |
|---|---|---|
| Fiuu simulator login | `Gaara` / `letmepaywithsand` (sheet "Notes: Sandbox Creds"; dashboard default `fiuuUser`/`fiuuPass`) | test sheet row "Notes"; `app/eauto/duitnow-qr/TestScriptTab.tsx:63` |
| Positive cards | Mastercard `5105105105105100` CVV `444`; VISA `4111111111111111` CVV `111`; expiry must be a valid future date | sheet Notes; `scripts/eauto-payment-channels/.env.example:27-30` |
| Negative cards | Mastercard `5200000000001096` CVV `444` (Faizuddin, 2026-10-26: "it is not the 555555 thing" — the TS Notes `5555555555554440` is not used); VISA `4111111111111110` CVV `111` | sheet Notes; `utils/runPaymentLeg.ts:104,108` |
| Card gateway identity | sheet: "Cannot remember either Razorpay or Fiuu. Need to confirm first" | sheet Notes `[unconfirmed]` |
| BO approver | `jasons` (dashboard default password `Pw12345`); the reference rig's store key `ops_jasons` is the same login | `TestScriptTab.tsx:61`; `01-flow/03-actors-urls-accounts.md` |
| BO assignee | `mfared` (dashboard default `eauTo>!2026@`) — sets UCD Group, Submit For Approval, Verified; the rig used `hubadmin_bochar` for this part | `TestScriptTab.tsx:62`; sheet Continuation Steps 4, 7; `scripts/eauto-payment-channels/data/users.ts:8-12` |
| Assignee dropdown | holds **display names**, not login ids → `QR_ASSIGNEE_NAME` / dashboard "Assignee display name" (blank = first option) | `src/onboarding.ts:141-150`; `src/env.ts:36` |
| UCD Group | sheet says "Authorized Dealer"; page options `Corporate / Association / Authorised Dealer / UCD / Motor / Recon`; `QR_UCD_GROUP` blank = first option | sheet; `FLOW-video-verified.md` Phase 5; `src/onboarding.ts:175-183` |
| Admin / invoice email | sheet default `azli123@gmail.com`; 12257 generates `<prefix>+<stamp>-<seq>@modefair.com` (prefix `qa.eaint12257`) | `company-details-checker/TestScriptTab.tsx:61`; `src/identity.ts:106-107,154` |

### Business type and company data

Trading (Sabah/Sarawak) runs on generated data. The three SSM types need a real
company cleared by the Company Details Checker — see
[flow-ucd-onboarding.md](flow-ucd-onboarding.md) § SSM and
[flow-ucd-company-listing.md](flow-ucd-company-listing.md). The sheet's TS1/TS3/TS6
use Sdn Bhd / LLP / Sdn Bhd and are therefore **blocked without checker data**;
TS2 (Sole Prop) likewise. `[verified: scripts/eauto-payment-channels/data/scenarios.ts:16-44]`

### Environment variables — `scripts/eauto-duitnow-qr` (the only runnable project)

| Var | Default | Meaning | Source |
|---|---|---|---|
| `EAUTO_BASE` | `https://staging.eauto.my` | host for `/obs` | `src/env.ts:8` |
| `EAUTO_INSTANCE` | `uat4` | instance for BO login `/<inst>/public/login/` and the `/obs` handoff `/<inst>/api/admin/onboarding/auth-redirect.do?type=OBS_APPLICATION_LISTING\|PRE_OBS_APPLICATION_LISTING` | `src/env.ts:9,21`; `src/obs.ts:20-28` |
| `QR_APPROVER_USER/PASS`, `QR_ASSIGNEE_USER/PASS`, `QR_ASSIGNEE_NAME`, `QR_UCD_GROUP` | blank | BO actors | `src/env.ts:26-37` |
| `QR_FIUU_USER/PASS` | blank | simulator login, host-locked | `src/payment.ts:202-203` |
| `QR_GATE_BUDGET_MS` | 300 000 | reCAPTCHA wait (dashboard: minutes, default 5) | `src/env.ts:39`; route line 127 |
| `QR_SCAN_BUDGET_MS` | 600 000 | QR scan wait (dashboard default 10 min) | `src/env.ts:40`; route line 128 |
| `QR_PAY_WAIT_MS` | 1 800 000 | FPX gateway wait, 30 min — the rig's `EV_PAY_WAIT_MS` was 10 min and "timing out there costs the whole pre-application" | `src/env.ts:41`; `01-flow/04-costs-and-human-gates.md` |
| `QR_FEE_PREAPP`, `QR_FEE_REGISTRATION` | `108.00`, `990.00` | amount asserted on the success page body | `src/env.ts:43-44`; spec `assertAmountCharged` |
| `QR_HEADLESS` | `0` | `1` = headless, **pre-payment smoke only** | `playwright.config.ts:24` |
| `QR_VIDEO` | route sends `1` unless `video:false` | | route line 126 |
| `QR_OUTPUT_DIR` | `./test-results` | | `playwright.config.ts:33` |
| `QR_BUSINESS_TYPE`, `QR_OWNER_TAG`, `QR_EMAIL_PREFIX`, `QR_EMAIL_DOMAIN`, `QR_TIN_PREFIX`, `QR_COMPANY_NAME`, `QR_LICENCE_NO`, `QR_OLD_BRN`, `QR_NEW_BRN`, `QR_TIN`, `QR_SST`, `QR_ADMIN_EMAIL` | blank = generate | identity overrides | route lines 131-142; `tests/happy-flow.spec.ts:36-50` |
| `QR_EXPECTED_FEE` | `108.00` | sent by the route, **not read by the script** | route line 129 `[verified: no reader in src/]` |
| `EAUTO_DUITNOW_QR_SCRIPT_DIR` | `scripts/eauto-duitnow-qr` | route override | route line 18 |

Dashboard: `/eauto/duitnow-qr` (Tickets → 12257), route `POST /api/eauto-duitnow-qr/run`
(`maxDuration 3600`, kills the child after 60 min), `GET /api/eauto-duitnow-qr/live-log?runId=`,
`DELETE .../run?runId=` to stop. Scenarios are `--grep`ped by exact test title
(`12257_TS01: Pre-application fee paid with DuitNow QR`, `12257_TS02: Registration fee paid with DuitNow QR`);
`12257_TS99` is a UI-only dummy. `[verified: app/api/eauto-duitnow-qr/run/route.ts; app/eauto/duitnow-qr/scenarios.ts:43-70]`

### Environment variables — `scripts/eauto-payment-channels` (skeleton)

`EAUTO_BASE_URL` (default `https://staging.eauto.my/sit3` — a guess that
contradicts the `/obs`-is-instance-less rule), `EAUTO_BO_MFARED_USERNAME/PASSWORD`,
`EAUTO_BO_JASONS_USERNAME/PASSWORD`, `EAUTO_FPX_BANK_USERNAME/PASSWORD`,
`EAUTO_CARD_VISA_NUMBER/CVV`, `EAUTO_CARD_MASTERCARD_NUMBER/CVV`,
`EAUTO_ONBOARDING_EMAIL`. Projects `ts3`..`ts8`; `ts7`/`ts8` are `test.skip`.
The dashboard tab `/eauto/company-details-checker` → "Test Script" posts to
`/api/eauto/payment-channels-test-script/run`, which answers **501** "Automation
not built yet". `[verified: scripts/eauto-payment-channels/.env.example;
playwright.config.ts:32-39; app/api/eauto/payment-channels-test-script/run/route.ts:11-16]`

### Safety switches

1. `workers: 1`, `retries: 0` — "every run mints a NEW dealer and spends a real RM 108.00 of sandbox payment. A retry would create a second application and ask the human for a second scan." `[verified: scripts/eauto-duitnow-qr/playwright.config.ts:11-21]`
2. The run route **rejects `headless: true`** with HTTP 400. `[verified: route lines 84-89]`
3. Simulator credentials are typed only on `bank-simulator.fiuu.com`; any other password wall pauses for a human. `[verified: src/payment.ts:194-213]`
4. TS02 is refused before spawning if any of the four BO credentials is missing. `[verified: route lines 100-111]`
5. An SSM type without `oldBrn`+`newBrn`+`companyName` throws in `buildIdentity()` before the browser opens; a BRN rejected by `checkSSM.do` throws in `submitPreApplication()` before any payment. `[verified: src/identity.ts:117-125; src/dealer.ts:38-45]`
6. The company usage ledger marks a checker row spent when a run mints a reference. `[verified: app/eauto/duitnow-qr/TestScriptTab.tsx:227-242; lib/companyUsageLedger.ts]`
7. There is **no** "stop before payment" switch in either project (unlike `E2E_STOP_BEFORE_PAYMENT` in `scripts/eauto-e2e`). `QR_HEADLESS=1` is the closest thing: the QR popup can never be scanned, so the run fails at the payment step. `[verified: absence in src/]`

### Cost

One full chain = one reCAPTCHA tick (~55 s, two or three image challenges), ~4 min
machine time, RM 1,098.00 of simulated payment. `[verified: 01-flow/04-costs-and-human-gates.md]`

## 7. Traps

1. **FPX opens a popup, not a same-tab redirect.** Watch `context.on("page")`; drive every page the context opens. `[verified: src/payment.ts:228-230; 05-known-traps.md §5]`
2. **"Submit and Pay" vs "Submit & Pay".** Pre-app = `and`, registration fee = `&`. Has already broken a locator. `[verified: src/dealer.ts:69-72]`
3. **`bankSelection` is shared by B2B and B2C.** Scope by `data-category` or the gateway gets a mismatched pair; the log once said "Maybank2u" while submitting a B2B id. `[verified: src/payment.ts:70-77]`
4. **The TAC is in another input's value**, not in innerText — a text-only reader burned the whole click budget. `[verified: src/payment.ts:173-176]`
5. **A password wall is a pause, not an exit.** Breaking out of the loop on it meant the TAC screen after the login was never driven. `[verified: src/payment.ts:219-224]`
6. **A gateway window with no controls is the "Processing payment..." landing page**, not a failure. `[verified: src/payment.ts:262-264]`
7. **Payment wait timeout costs the whole pre-application** — the form must be refilled from scratch, and the reCAPTCHA re-ticked. `[verified: 04-costs-and-human-gates.md]`
8. **Reload resets the pre-application form to step 1** (EAINT-12414 defect 1; fix MR !331 under review 2026-09-30). Until fixed, never `page.reload()` on `/obs/preOnb/form/<uuid>` past step 1. `[from Jira EAINT-12414]`
9. **Failed card payment in the same tab shows no banner** (EAINT-12414 defect 2). The popup path shows it. `[from Jira EAINT-12414]`
10. **Declaration checkbox exists only on the pre-app step.** The registration fee page has static text; a `#agreeTerms` wait there hangs. `[verified: src/dealer.ts:62-64, 432]`
11. **`page.once("dialog")` leaks.** A handler armed for a confirm that never fires stays armed; the next confirm then has two handlers and throws "Cannot accept dialog which is already handled" after its own action succeeded — a run reported failure on a change that went through. Use `on`/`off` scoped to the action. `[verified: src/obs.ts:100-117]`
12. **`confirm()` is not a wait.** Read the result back after every state-changing BO click; a run once closed the browser on an in-flight POST. `[verified: src/onboarding.ts:3-9]`
13. **The pre-app status after payment is New, not Approved.** The sheet's expected result "Ensure in Pre-Application listing, it is Status = Approved" on the *payment* leg only holds after the BO approver acts (phase 3). `[verified: FLOW-video-verified.md Phase 2-3 vs sheet TS1-TS6 col E item 4] [unconfirmed which the sheet intends]`
14. **Label drift between sources.** SRD: "FPX (Personal)" / "Online Banking (Business)"; page: "Online Banking (Personal)" / "(Business)"; video 23-08-2026: "FPX Online Banking (Personal)"; sheet: "FPX (B2C)" / "FPX (B2B)"; payment-details rows: "FPX Online Banking (Maybank)". Match tiles by `/online banking \(personal\)/i`, not by the SRD wording.
15. **Payment Status casing differs per page** — `Paid` on the pre-app summary, `PAID` on the application success page. Match case-insensitively. `[verified: 14-*.txt vs 35-*.txt]`
16. **The QR tile and popup selectors are guesses.** `pickPaymentMethod("qr")` throws "The DuitNow QR tile selector is unverified — capture the payment-step HTML and correct src/payment.ts." if neither the text click nor `#payment-duitnow-qr` takes. `[verified: src/payment.ts:57-63]`
17. **The two-tab Fiuu popup path vs same-tab card path need different waits.** `payByFpx` watches opened pages; a same-tab return would be missed by it and caught only by `isPaid()`/`hasFailed()` on the main page. `[verified: src/payment.ts:237-240]`
18. **`QR_EXPECTED_FEE` is dead config** — the route sends it, nothing reads it; the amount actually asserted comes from `QR_FEE_PREAPP`/`QR_FEE_REGISTRATION`. `[verified: grep of src/]`

## 8. What is NOT covered

1. **Credit/Debit Card gateway** — never driven, no screens captured, 3DS/OTP readability unknown, provider (Fiuu vs Razorpay) unconfirmed. `CardPaymentPage.ts` is all stubs.
2. **FPX B2B** — tile selector assumed (`#payment-fpx-business`), never clicked live; pending-approval pages exist only as mockups; no URL, no authorizer-approval surface, no 7-day expiry mechanism observed. As of 2026-09-30 the team recorded B2B as "not deployed yet" (`eauto-payments.md` § EAINT-12414 scope), although the 23-08-2026 recording already showed a Business tile. `[unconfirmed which is current]`
3. **DuitNow QR** — tile, popup, timer, cancel, phone outcomes: all unobserved live; SRD v1.0 exists (§4f).
4. **e-Invoice download** on either success page, and the invoice content check.
5. **BO-side payment view** — the pre-application summary's `Payment Details` block and the registration-documents sidebar `Payment Document: Invoice` row are mentioned in the pack but their DOM was not captured.
6. **The "Apply eAuto" entry** from the login page (sheet step 1).
7. **Gateway popup HTML** (Fiuu landing, simulator login, simulator form) — driven by heuristics only.
8. **Mobile / responsive layout** of the tiles; browser matrix beyond Chromium.
9. **Duplicate or late gateway callbacks** — out of scope by agreement (`eauto-payments.md`).

### 4g. DuitNow "phone" without a phone (verified 2026-10-21)

`https://bank-simulator.fiuu.com/duitnow/viewqr` is a public html5-qrcode page
(capture `_reference/html/fiuu/duitnow-viewqr.html`). Its scanner offers **"Scan an
Image File"** (`#html5-qrcode-anchor-scan-type-change`) → **"Choose Image"**
(`#html5-qrcode-button-file-selection`), so a picture of the QR works instead of a
camera. A read QR opens `#paymentModal` "Approval", "Amount: MYR 108.00" (`#amountDisplay`,
EMVCo tag 54), **Reject** (`.reject-button`, userChoice 2) / **Approve**
(`.approve-button`, userChoice 1) → POST `/duitnow/process-qr-data`.
`[verified: headless probe 2026-10-21 with a made-up EMVCo QR — scanned, modal showed
MYR 108.00; Approve/Reject NOT clicked]` The 12153 suite uses this in
`scripts/eauto-12153/pages/FiuuDuitNowPage.ts`; what the page shows after Approve /
Reject is not captured yet.

**12257 TS2–TS5 H4 (Faizuddin, 2026-10-21):** the TS says "Application Submitted for
Review" after the retry; staging shows **"Application Payment Success"** — follow
staging. The suite checks `#payment-success`.

## 9. Retry and BO payment status (code analysis, 2026-10-22)

Source for every point: a code analysis Faizuddin pasted into the session on 2026-10-22. None of it has been seen live yet. `[unconfirmed: pasted code analysis, 2026-10-22]`

1. **Retry:** any non-success result from Fiuu shows the "Unsuccessful Payment" panel. The retry reuses the same payment record and payment reference number, with a new transaction id. The status goes back to NEW, and the earlier payment date and card brand are cleared.
2. **A PAID record cannot be retried:** the system answers "payment is already PAID". Repeat success callbacks are ignored.
3. **Pre-application retry route:** only the open form or its link `/preOnb/form/{uuid}` leads back. That link redirects to the summary once the record is paid. It is session-locked: another session gets "not allowed to edit". No email sends an unpaid applicant back.
4. **Application listing:**
   1. The "Registration Fee" column is the payment status: OK = paid, Failed = the last attempt failed, Pending UCD = the gateway returned pending.
   2. The column has a filter dropdown.
   3. The column is driven by the payment callback.
5. **Pre-application listing:**
   1. It has no payment column.
   2. A record gets a status (NEW), a pre-onboarding number and a paid-at time only when payment succeeds. The listing shows only records with a status.
   3. So failed, abandoned and pending pre-applications are not listed.
   4. The detail view has a Payment Details block: payment ID, method, date/time, status and payment document.
6. **Pre-application detail badge:** it always uses the "paid" styling, whatever the value. The badge colour is not evidence.
7. **Callback errors:** these are logged and swallowed, never shown in the UI. A pending pre-application whose callback never arrives stays invisible.

Automation (2026-10-22): `scripts/eauto-12153` and `scripts/eauto-12257` `utils/chain.ts` now check Registration Fee = Failed between a failed application payment and the retry (12257_TS2–TS5, via `onFailed`), and = Pending UCD while pending (12153_TS3, via `onPending`). The pre-application leg has no BO payment column, so its check stays skipped.

### 9a. Where the Payment Reference No. shows (code analysis, 2026-10-22)

Source: a second code analysis Faizuddin pasted on 2026-10-22. `[unconfirmed: pasted code analysis, 2026-10-22]`

1. **After a failed payment:** the Payment Reference No. (shown as "Payment ID", P… for the pre-application fee, A… for the registration fee) appears **nowhere**, for the applicant or in BO. The gateway window shows its own message for about 1.5 s, then closes.
2. **"refNo" is not the reference:** the `refNo` in the gateway messages and the callback URL is the internal payment transaction UUID, not the P…/A… number.
3. **Where it shows (success only):**
   1. The pre-application summary page.
   2. The application "payment success" panel, shown only when Registration Fee = OK.
   3. The BO pre-application Payment Details block.
   4. The invoice and e-Invoice.
4. **Application in BO:** no BO screen shows the Payment Reference No. for an application, paid or failed.
5. **Not testable on screen:** a retry keeps the same Payment Reference No. This cannot be seen in the UI, because the number never shows for the failed attempt. The failed attempt is stored as status FAILED plus a payment-history entry, with no screen for either.

### 9b. Payment-retry checks in the automation (2026-10-22)

Suggested TS 12153_TS9–TS12 and 12257_TS11–TS13 (workbooks "Suggestion by Claude - … Payment Retry … (official format).xlsx"; not yet in the official sheets) run in `scripts/eauto-12153` / `scripts/eauto-12257` through `Scenario.checks`:

1. `bo-payment-details`: BO Pre-Application Summary `.section-title` "Payment Details" + `table.detail-table` (capture `_reference/html/eauto/obs-admin-preonb-summary-new.html`), compared with the UCD payment details page.
2. `reopen-after-fail`: after the failed attempt, a new browser context (no cookies) opens the page link / Application Link and the retry continues there. Never run live: whether the link asks for the reCAPTCHA again is unknown.
3. `second-session`: the Business Info Review link opened in a second context. The "not allowed to edit" wording is unknown; the page HTML is saved as evidence on the first run.
4. `bo-listing-status`: Pre-Application row count by company name before the payment = after the failure; Application listing Registration Fee = Failed, then OK, each also through the `select#stage4Status` filter (capture `obs-admin-application-enquiry-default.html`).

### 4h. DuitNow QR on staging — first live run (2026-10-22)

Source: the 12257_TS1 run, Pre-Application leg (`_reference/tickets/EAINT-12153/First_QR_TestRun/`). Captures: `_reference/html/fiuu/duitnow-qr-window.html` and `_reference/html/fiuu/duitnow-viewqr-payment-successful.html`. `[verified: live run 2026-10-22]`

1. **Tile:** DuitNow QR is its own payment tile (`label.payment-method-card` with "DuitNow").
2. **QR window:** "Submit and Pay" opens a new window. It starts at `https://staging.eauto.my/obs/preOnb/landing/<uuid>/RPP_DuitNowQR` and lands on the Fiuu sandbox QR page.
3. **QR page DOM:**
   1. `img#qrcode_img`: a base64 PNG inside the pink DuitNow card (`.duitnow-card`, merchant "eAuto Sdn Bhd").
   2. "Don't refresh this page. Expires in" `span#time`: Fiuu `checkTransaction(…, 180, …)`, so 180 s.
   3. `button#cancelBtn` "Cancel the transaction": opens a SweetAlert "Are you sure? / Cancel this payment."; `.swal2-confirm` goes to Fiuu `return_RPP_DuitNowQR.php?…&cancel=1`.
4. **viewqr scan:** viewqr read the QR from an image file, showing amount MYR 108.00. Approve led to `/duitnow/process-qr-data` with "Payment was successful!".
5. **Result in eAuto:** "Pre-Application Submitted for Review". Payment Details showed Payment Method "DuitNow QR", and the invoice was downloaded.
6. **SSM document:** the "SSM document" download on the success page returned a JPJ FAQ PDF ("FAQs_on_JPJeID_and_MyJPJ_App.pdf"), not an SSM profile. That is staging's placeholder file `[unconfirmed: placeholder or defect]`.
7. **Scanner tab after Approve / Reject:** it stays open on "Payment was successful!". "Go to Home" (`button.btn-home`) returns to `/duitnow/viewqr` and does not close the tab (Faizuddin, 2026-10-22). The automation keeps one scanner tab per browser and clicks "Go to Home" before the next scan; nothing waits for that tab to close.
8. **One recording per TS (2026-10-22):** a QR payment involves the eAuto tab, the Fiuu QR window and the scanner tab, plus BackOffice and eSIM. The suites log which page they act on (`utils/focusTimeline.ts`, marked in `BasePage.demoHighlight`). The run route joins the page recordings along that timeline into `<TS>.mp4` (`lib/server/focusVideo.ts`, ffmpeg) and drops the separate `.webm` files. If ffmpeg fails, the separate files are kept and the TS gets a "Video" note.

### 9c. FPX B2B checker page (Fiuu sandbox) — 2026-10-22

Capture: `_reference/html/fiuu/bank-simulator-fpx-b2b-pending-empty.html` (empty lookup state).
`[verified: live HTML pasted by Faizuddin, 2026-10-22]`

1. URL `https://bank-simulator.fiuu.com/fpx-b2b/pending`. `h1` "Pending Checker Decisions - FPX B2B".
2. Page text, verbatim: "FPX B2B transactions the maker has already authorized (status 22) and that are now waiting on a checker's Approve/Reject decision, mirroring production's real maker/checker flow. Look up a specific transaction by its own transaction number (tranID) - the one you received right after authorizing it."
3. Lookup form: GET to the same URL, `input#tranId` (name `tranId`), button "Look up my order". Empty state `.empty`: "Enter your transaction number (tranID) above to look up its checker decision." `button.refresh-btn` "Refresh" reloads.
4. No login on this page.
5. Flow implied: maker authorizes on the bank simulator → status **22** (pending) and a tranID is shown → checker opens this page, looks up the tranID, Approve / Reject. `[from page text; lookup result, Approve/Reject controls, and where the tranID is shown are not captured]`
6. Matches the eAuto code note (chatbot, `origin/prod/master @ 2287cfdf`): "22" = pending, "00" = paid; eAuto only learns of the decision from a later Fiuu callback, pages do not auto-refresh. `[from code answer, pre-12153 branch]`
7. The status-99 "Pending for Authorization (Applicable for B2B Model)" option on the simulator dropdown (§ above) may not be the B2B maker path. Which status the maker picks to get 22 is `[unconfirmed]`.
8. **Confirmed from the simulator FAQ** (`_reference/html/fiuu/bank-simulator-faq-fpx-b2b.html`, read 2026-10-22) `[verified: live page]`:
   1. B2B banks on the sandbox: **ABB (Affin Bank), ABBM (Affin Bank Multi-Bank), HLB (Hong Leong Bank) only**. The TS banks Maybank, CIMB, AmBank, Public Bank and HSBC are not simulated for B2B.
   2. No login. The maker page has two buttons: **Authorize** or **Reject**. There is no status dropdown; the 99 option belongs to the B2C TAC page.
   3. Authorize → back to the merchant return page with `status=22` (pending). Not final.
   4. Reject at the maker step → flow ends, no checker step (a failed payment).
   5. Checker: `/fpx-b2b/pending`, look up the tranID, **Approve** or **Reject**. "Only the checker's decision produces a final captured/failed status and triggers the merchant's webhook/IPN."
   6. If the page returns 401, it needs `?sim_token=<token>` once (sets a cookie). Not seen on 2026-10-22 (page returned 200).
   7. Lookup of an unknown tranID: `.empty` "No FPX B2B transaction pending a checker decision was found for tranID 1 (may have already been decided, or expired)." (`bank-simulator-fpx-b2b-pending-not-found.html`).
9. Still not captured: the maker page (Authorize / Reject markup), where the tranID is shown, the checker result row with Approve / Reject. These need a real B2B payment started from eAuto (reCAPTCHA by a person).
10. **Guided capture run** (2026-10-22, Faizuddin: "i will manually guide it and the automation will capture the needed info"): `12153_GUIDE_B2B` on /eauto/12153 section E. Headless off. The run fills the Pre-Application up to the payment step, then a person does the B2B payment (maker Authorize, checker Approve). The run clicks nothing; it saves HTML + screenshot of every tab change to `_reference/tickets/EAINT-12153/guided-capture/<date_time>/` with `index.json`. Ends on "Pre-Application Submitted for Review" or after `E12153_GUIDE_MINUTES` (30). Code: `scripts/eauto-12153/utils/guidedCapture.ts`.

### e-Invoice download not offered on staging — not a failure (2026-10-22)

12257_TS1 passed every step except "no e-Invoice control on the payment details page" (both legs). Faizuddin, 2026-10-22: "the e-invoice memang kenot download. cus issue with TIN. so ignore that. consider it PASS". The check is now a log line only, in 12153, 12257 and Create Pre-Application `utils/paymentLeg.ts`. The page says the e-Invoice is emailed.

### Unsuccessful Payment box differs per page — check both (2026-10-22)

Pre-Application review: `div.unsuccessful-payment-container` (no id). Application step 5: `#payment-error-message`. The 12153 / 12257 / Create Pre-Application suites checked only the id, so a failed Pre-Application payment was never seen and the wait ran to its limit (12257_TS2: message on screen ~2 s after Reject, run still waiting 60 s later). `PaymentPage.errorBox()` now matches whichever is visible; used for the outcome wait and the highlight. The QR leg also brings the eAuto tab to the front when the QR window closes. `[verified: 12257_TS2 eAuto video + capture obs-preonb-review-terms-ticked.html:1579; fix unrun]`

### Retry reads the old "Unsuccessful Payment" box — ignore it until it clears (2026-10-22)

On a retry, the box from the failed attempt is still on the page when Submit is clicked. 12257_TS2: retry Approved, eAuto showed "Pre-Application Submitted for Review", but the run read the old box at once and reported FAILED (company SDN0015 / P261022/00896 spent). `PaymentPage` now notes, just before each Submit, whether a box is already shown; `waitForOutcome()` checks success / pending first, and counts a box as this attempt's failure only after the old one has gone (hidden, or the page navigated). If the old box never clears, it reports failed and says so. Applies to every same-page retry, both legs: QR 12257 TS2–TS5, TS11, TS13; FPX / card failed-then-success 12153 TS2, TS4, TS6, TS8, TS9, TS12 and 12257 TS7, TS9. Not affected (retry in a new browser): 12153 TS10, 12257 TS12. `[verified: 12257_TS2 log + screenshot; fix unrun]`
11. **Affin for B2B = AffinMax** (2026-10-22). Faizuddin changed the TS bank from Affin Bank to AffinMax: "the affin bank option dont work anymore only can do thru affin max" (Teams, to the developer). The developer replied "okay noted ya, but using the same logo for Affin right?" — so the eAuto Business tile may keep the Affin logo; its alt text / value is not yet seen. `chooseBusinessBank()` picks a tile named or valued AffinMax first, then falls back to the Affin match. `[source: Teams, 2026-10-22 ~16:31; tile markup unconfirmed]`
12. **B2B flow as run by hand** (Faizuddin, 2026-10-22, verbatim summary): "when you select the payment, it will open the fiuu payment page. there will be order ID. need to copy the order ID. after click authorize, the page from UCD side will go to a pending payment page. you open the link for the authorization (https://bank-simulator.fiuu.com/fpx-b2b/pending) and enter the order ID. click search and authorize. after that from UCD side, will need to manually refresh the page. after that, the flow is as others". Built into 12153 / 12257: `FiuuPage.b2bMaker()` (reads Order ID, Authorize or Reject), `utils/b2bChecker.ts` (new tab, `#tranId` = Order ID, "Look up my order", Approve/Authorize), then reload eAuto. Every successful B2B leg goes through Pending Approval; the close-and-reopen revisit runs only for `pending-then-authorise` (TS3). Failed B2B = maker Reject. Maker and checker HTML are saved to evidence each run (`fiuu-b2b-maker.html`, `*-b2b-checker-lookup.html`, `*-b2b-checker-after.html`). `[from user steps; selectors for the maker page and the checker result row unconfirmed]`
13. **Pre-Application "Payment is Pending Approval" page — captured** (`_reference/html/eauto/obs-preonb-payment-pending-approval.html`, manual run, HLB B2B, 2026-10-22) `[verified: live HTML pasted by Faizuddin]`:
   1. Header `.header-title` "Dealer Application - P261022000952" (the Payment ID, not a Pre-Application No).
   2. `.success-title` "Payment is Pending Approval"; message: "Your authorizer has 7 days to approve the transaction through online banking. If it is not approved within 7 days, the payment will expire and the Pre-Application will not be submitted."
   3. Pre-Application Summary has **no Pre-Application No and no SSM Document row** (matches SRD §2.2.5).
   4. Payment Details: Payment ID; Payment Method "FPX Online Banking (Hong Leong Bank)" (no "Business" in the name); **Payment Submitted Date Time** (new row); Payment Date Time "-"; Payment Status `span.payment-pending` "Pending Approval"; Payment Document `span.doc-wait` "Invoice and e-Invoice will be available once payment is successful."
   5. The automation's checks match this page: `waitForOutcome()` finds "Payment is Pending Approval"; the soft check `/Payment Status:?\s*Pending Approval/i` matches.
14. **First full B2B run passed — 12153_TS1, 2026-10-22** (Pre-App P261022/00902, Application NA60001193) `[verified: run log]`:
   1. Business bank tiles on eAuto (alt text, value, data-category): "Online Banking - Maybank B2B" `FPX_M2E` · "CIMB Bank B2B" `FPX_B2B_CIMB` · "Ambank B2B" `FPX_B2B_AMB` · "Public Bank B2B" `FPX_B2B_PBB` · "RHB Bank B2B" `FPX_B2B_RHB` · "Hong Leong Bank B2B" `FPX_B2B_HLB` · "HSBC Bank B2B" `FPX_B2B_HSBC` · "Affin Bank B2B" `FPX_B2B_ABBM`; all `FPX_B2B`.
   2. **Affin on eAuto is named "Affin Bank B2B", value `FPX_B2B_ABBM`** (ABBM = Affin Bank Multi-Bank in the simulator FAQ). No tile says "AffinMax"; `chooseBusinessBank()` falls back to the Affin name match and picks it.
   3. Fiuu maker page: `https://bank-simulator.fiuu.com/fpx-b2b/payment`; Order ID read from the page (e.g. 200684); Authorize → eAuto "Payment is Pending Approval"; checker Approve by Order ID on `/fpx-b2b/pending`; refresh → success. Same for the Application leg (Order ID 200688).
   4. While pending, BO Application listing: **Registration Fee "Pending UCD"** (matches the code answer). After approval: OK.
   5. Paid page: Payment Method "FPX Online Banking (Maybank)" / "(CIMB Bank)" — no "Business"/"B2B" in the name; "Payment Submitted Date Time" and "Payment Date Time" both shown.

15. **New Fiuu "Order Authorized" page after the maker's Authorize** (first seen 2026-10-23, Faizuddin: "now i encounter this page in the payment popup"; `_reference/html/fiuu/bank-simulator-fpx-b2b-order-authorized.html`) `[verified: live HTML pasted]`:
   1. Shows Transaction No. (tranID) `#tranIdValue` (= the Order ID) and a one-time **Decide code** `#decideCodeValue`. Page text: "you'll need both to approve/reject this order on the checker page" and "If you're on the same browser you're on right now, the decide code is filled in automatically".
   2. Countdown "Redirecting back to merchant in …" (120 s) then posts `authorize_form` to `sandbox-payment.fiuu.com/fpxindirect.php`; "Continue now" sends it at once; "Go to checker page for order …" opens `/fpx-b2b/pending?tranId=<id>` in a new tab and sends it too.
   3. Built 2026-10-23 into 12153 / 12257: `FiuuPage.b2bAuthorized()` reads both values, saves `fiuu-b2b-order-authorized.html` + screenshot, clicks "Continue now"; `b2bChecker()` types the decide code only if a decide-code box is visible and empty. `[unverified: the checker page with a decide-code box has not been captured]`
## FPX B2C popup lands on an in-between page first (2026-10-23)

1. **What:** after "Submit and Pay" with Online Banking (Personal), the Fiuu popup first shows `https://sandbox-payment.fiuu.com/RMS/rms_fpx.php`, then moves to the bank's simulator login `https://bank-simulator.fiuu.com/<CHANNEL>/…` (RHB = `RHB0218`). [verified: 12153_TS05 run log, 2026-10-23 — "Fiuu window opened at https://sandbox-payment.fiuu.com/RMS/rms_fpx.php", "Sandbox portal opened: RMS"]
2. **Trap:** a login step that runs on the in-between page sees no login form and skips. In TS05 the RHB login then sat untouched until a person clicked Login, and the bank-portal check recorded "RMS" / "FPXMain" instead of the channel.
3. **RHB login page:** same form as Maybank — `#username`, `#password`, `#login-btn` (AJAX `POST /RHB0218/verify-login`; success submits to `/RHB0218/simulator`; failure = SweetAlert "Wrong username or password" and both boxes cleared). Capture: `_reference/html/fiuu/bank-simulator-rhb-login.html`.
4. **Automation:** `FiuuPage.loginToSimulator()` (12153, 12257, preapp) now waits up to 90 s for host `bank-simulator.fiuu.com` and either `#username` or `select#status_code`, signs in only when the form shows, and stops on "Wrong username or password". The channel is read after that.

### DuitNow QR Cancel returns PENDING, not FAILED (2026-10-23)

1. 12257_TS03 (Pre-App, Sdn Bhd, P-App uuid 2baba467-…, payment 0aa98a83-…, Fiuu tranID 201692): Cancel → SweetAlert OK → Fiuu `return_RPP_DuitNowQR.php?…&cancel=1` → `result.php` → `return_merchant.php` → eAuto `POST /obs/preOnb/payment/check/<paymentUuid>`.
2. The eAuto callback page then showed "Payment is pending" with `paymentStatus = "PENDING"` and posted it to the main tab.
3. The main tab took the PENDING branch (`/obs/preOnb/pending-approval/<appUuid>`). The server sent it back to `/obs/preOnb/form/<appUuid>`. It landed on the review page, with the payment methods showing and **no "Unsuccessful Payment" box**.
4. Expected per the TS (Faiz's Note rows 19–23): Cancel leaves the payment **Failed** with the existing message. Observed: PENDING, no message. This points at eAuto's status mapping for a DuitNow cancel (or Fiuu sandbox's cancel status), not the script.
5. `[verified: 12257_TS03 trace 2026-10-23 17:27 MYT — network log + callback page HTML]`
6. **Timer expiry does the same (12257_TS05, 2026-10-23 18:34–18:37 MYT).** QR shown 10:34:04Z; after 3 min Fiuu returned `return_RPP_DuitNowQR.php?…&timeout=1` → eAuto `payment/check/2c5286cf-…` → callback "Payment is pending", `paymentStatus = "PENDING"` (Fiuu tranID 201835) → same pending-approval bounce, no message. Raised with Cancel/B2C as EAINT-12625. `[verified: 12257_TS05 trace]`
7. **Automation change (Faizuddin, 2026-10-23: "if its not there, it will consider fail and proceed with whatever steps that is next"):** the "Unsuccessful Payment" check after a failed attempt is now `expect.soft` in qrLeg / paymentLeg (12153, 12257, preapp) and preapp.spec. The BO "Registration Fee = Failed / Pending UCD" check is soft too. A missing message logs `FAIL — "Unsuccessful Payment" message not shown` and the run goes on to the BO check and the retry.

### Closing the payment gateway page: no message by design (2026-10-26)

1. **Decision:** closing the payment gateway page does not show the "Unsuccessful Payment" message. This is accepted as existing behaviour. EAINT-12625 was moved to **Closed** with the comment "Follow existing behaviour where it will not show error message if close the payment gateway page". `[from Faizuddin, 2026-10-26; Jira EAINT-12625 comment 57993]`
2. **Source gap:** the 12257 SRD v1.0 REQ-005 lists only the timer ending, Cancel and a bank decline as failures. It does not mention closing the window. Only the official TS (12257_TS4, E2) expects the message on close. `[verified: SRD text + SharePoint TS v19 snapshot]`
3. **Open:** EAINT-12625 itself covered **Cancel Transaction** (DuitNow QR and FPX B2C), not closing the window. Whether Cancel should show the message is not settled by this decision. EAINT-12627 (timer expiry) is still open.
4. **DuitNow QR Cancel (not closing the window), Pre-Application:** eAuto returns to page 2 (Business Info Review) with the declaration `#agreeTerms` **unticked**, `#payment-method-section` hidden and no "Unsuccessful Payment" box. Capture: `_reference/html/eauto/obs-preonb-review-after-duitnow-cancel.html`. `[verified: live HTML pasted by Faizuddin, 2026-10-26]` The Application (page 5) state after Cancel has not been captured.
5. **Official TS updated to match (SharePoint v27, 2026-10-26, was v25):** 12257_TS3 (Cancel), TS4 (close QR window) and TS12 (Cancel + reopen) now expect "No error message is displayed (follow existing behaviour)"; the BO payment status step was removed from TS3/TS4; TS3/TS12 add "Declaration statement box unticked" on the Pre-Application leg; Faiz's Note E25/E26 record the decision. Edited copy: OneDrive `eAuto Documents/EAINT-12257/EAINT-12257 - official TS v25 + no-error-message update 2026-10-26.xlsx`.
6. **Automation (2026-10-26):** `qrLeg.ts` in eauto-12257, eauto-12153 and eauto-preapp — Cancel / close wait for the return to the payment page (`waitForReturn`), assert **no** message, Cancel on pre-app also asserts the declaration is unticked and methods hidden, then retry. `chain.ts` skips the BO "Registration Fee = Failed" check for these rows (`NO_MESSAGE_OUTCOMES`). Typecheck clean; not run yet.
7. **Rule confirmed again (Faizuddin, 2026-10-27): "cancel should not show".** DuitNow QR Cancel Transaction and closing the QR window both show **no** "Unsuccessful Payment" message. Timer expiry and Reject show it.
8. **Staging on 2026-10-27 breaks the rule:** 12257_TS12 (LLP0010) Cancel returned to Business Info Review **with** "Unsuccessful Payment", the declaration still ticked and the payment methods shown. The script's check "no Unsuccessful Payment message after Cancel" failed correctly. Same day, 12257_TS05 timer expiry showed the message (EAINT-12627 looks fixed). `[from Faizuddin screenshot + run log, 2026-10-27]`
9. **Raised to the dev, 2026-10-27.** Superseded by item 13 the same day.
13. **Rule changed again (Faizuddin, 2026-10-27, latest): "update rule for the qr close popup and cancel payment, both will show error message. so considered as pass".** DuitNow QR Cancel and closing the QR window now **show** "Unsuccessful Payment", and that is a pass. Scripts (12153, 12257, preapp `qrLeg.ts`) now expect the message on Cancel / close; the 2026-10-26 checks "declaration unticked" and "payment methods hidden" are dropped. No BO payment status check is added for these rows. `[from Faizuddin, 2026-10-27]`
14. **FPX B2B is different (Faizuddin, 2026-10-27): "for b2b, the result remain the same, closing/cancelling it wont show".** Closing or cancelling the FPX B2B window shows **no** message. No script scenario covers B2B cancel/close.
15. **Evidence check for the new rule (2026-10-27):** 12257_TS12 run 1793073533573 (10-27 11:58) shows the message on both legs — usable. 12257_TS03 (run 1792985476492) and TS04 (run 1792986089001), both 10-26, show **no** message on Business Info Review — staging behaved differently then, so they need a rerun under the new rule.
16. **DuitNow QR timer expiry on the Application leg leaves BO Registration Fee = Pending UCD, not Failed (Faizuddin, confirmed with BA, 2026-10-27).** 12257_TS13 run 2026-10-27 (SABAH0006, NA60001220) saw "Pending UCD" after the timer and 0 rows under the "Failed" filter. Scenario field `feeAfterFail: 'Pending UCD'` on 12257_TS13 (12153 + 12257 suites) makes the BO check and the filter use Pending UCD.
10. **Script trap, error-box read (fixed 2026-10-27):** `paymentError()` checked the box was visible, then read its text with the default 30 s wait. In 12257_TS05 the retry succeeded and cleared the box between the two reads, so the run crashed after a paid retry. The text read now waits 2 s and treats a gone box as no message (12153, 12257, preapp `PaymentPage.ts`).
11. **Payment window size:** eAuto opens Fiuu with `window.open(…, 'FiuuPayment', 'width=800,height=600,…')`. The scripts now make that window as tall as the screen (`growWindow()` in `PaymentPage.ts`, CDP `Browser.setWindowBounds`, after clearing the 1920x1080 emulation), best effort, logged as `Payment window made <N>px tall`. First try used `screen.availHeight`, which returned the window's own 600 (12257_TS05, 2026-10-27); it now maximises once to read the real screen height, then sets 800 wide × that height. Not yet seen on a run.
12. **Invoice PDF read (2026-10-27):** 12257_TS05 stopped with `UnknownErrorException: bad XRef entry` from pdf-parse on `12257_TS05-preapp-invoice.pdf`, yet the saved file reads fine afterwards. `paymentLeg.ts` (12153, 12257, preapp) now retries the read 3 times, 2 s apart, and a failed read is a soft fail, not a stop.

## Failed card attempt on the Fiuu sandbox (2026-10-26)

1. **5555 5555 5555 4440 does not fail.** 12257_TS09 run, 2026-10-26: after Pay, Fiuu did not return to eAuto within 45 s. The window then reached the 3D Secure page and the payment completed (eAuto P261026/00919, "CREDIT - MASTERCARD"). [verified: run log + `public/qa-artifacts/eauto-12257/1792995009236/`]
2. **Card to use:** Mastercard 5200 0000 0000 1096 (Faizuddin, 2026-10-26: "it is not the 555555 thing").
3. **How to make it fail: a wrong OTP on the 3D Secure page.** Confirmed by Faizuddin, 2026-10-26: "for card, we can use invalid OTP to simulate the failed payment. so no need for the other options". Wrong CVV / wrong expiry are not used. The 3D Secure page says "Click CANCEL to leave transaction in Pending status for requery testing", so CANCEL gives Pending, not Failed. [verified: Faizuddin, 2026-10-26]
4. **Automation (12153, 12257, Pre-App suites):** the failed attempt types the card, then OTP `000000` on 3D Secure; the retry uses the OTP the page shows. No dashboard option (the earlier OTP / CVV / expiry picker was removed the same day).

## Update 2026-10-27 from Charmain repo

Source: read-only clone `_reference/codebases/eauto-qa-charmain/`, folder
`intake/` (commit `0ab45d1`). Inventory: `script-inventory-team.md`.

1. **No team script drives the onboarding payment step.** None of the 20 inventoried
   sources names the RM 108 / RM 990 payment, the Card / FPX tiles or DuitNow QR.
   Our `scripts/eauto-payment-channels`, `eauto-12153`, `eauto-12257`,
   `eauto-duitnow-qr` stay the only automation here.
2. **Onboarding application pool pattern (Charmain, EAINT-12155,
   `tests/tools/obs-applications.spec.js`).** Her recorder borrows existing `/obs`
   applications from an env-var list instead of creating one per case. Contract,
   verbatim: "2. a REJECT take borrows without consuming — several in a row share
   one"; "3. an ACCEPT take claims, and the claim is held before creation is
   confirmed"; "4. spend() is permanent, and release() only returns an unconfirmed
   claim"; "5. running dry fails LOUDLY, with the steps in the message".
   `[charmain-repo: intake/reports/charmain-12155.json:1298-1304]`
   Same idea as our rule "test-data setups fill a pool" (memory); useful if the
   payment-channel suites ever share pre-application records.
3. **EAINT-11982 Extend acts on the same applications.** "TS55 — the dealer link
   survives the ORIGINAL expiry, and its step still submits" and "TS46 — a
   reactivated application can never be extended". `[charmain-repo: intake/reports/charmain-11982.json:1336, 1538]`
   A payment-channel run on an extended or reactivated application is therefore a
   valid path; see `cr-ledger.md` § EAINT-11982.
