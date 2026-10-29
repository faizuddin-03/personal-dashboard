# Flow — quotation reminder email to UCD (EAINT-11864)

EAINT-11864 — *[eAuto-Insurance] Send Email Reminder to UCD for Generated
Quotations Without Purchase*. A backend cron emails the UCD when an insurance
quotation was generated but never purchased. This file records what the reminder
is, what triggers it, the five ways a quotation can be started, how the
automation in `scripts/eauto-quotation-reminder` drives eSTM → quote → abandon →
reminder, the verbatim DOM handles it uses, its configuration, its traps, and
why it is paused.

Read first: [flow-insurance-purchase.md](flow-insurance-purchase.md) (the
insurance steps themselves), [flow-estm.md](flow-estm.md) (the eSTM leg and the
eSTM → insurance handoff), [mailtrap.md](mailtrap.md) (how the email is read),
[eauto-insurance.md](eauto-insurance.md) § Quotation reminder email (business
rules). Flow rules: [flows.md](flows.md).

Team test script: `_reference/tickets/EAINT-11864/EAINT-11864 - [eAuto-Insurance]
Send Email Reminder to UCD for Generated Quotations Without Purchase (2).xlsx`
(one sheet, 12 cases `11864_TS01`–`11864_TS12`, read 2026-10-15). No SRD, Figma
or dev guide is stored in `_reference/tickets/EAINT-11864/` — the SRD (v1.1,
2026-07-22) is cited only second-hand in [eauto-insurance.md](eauto-insurance.md).
No `lib/ticketStudies.ts` entry exists for this ticket. `[verified: directory
listing + grep, 2026-10-15]`

## 1. Why this flow matters, and what depends on it

This is the only flow in the repo whose verdict is an **email**, not a page. It
chains three systems (eSTM creation, the UCD insurance steps, Mailtrap) and a
clock (the hourly cron), so it is the worked example for timed scenarios
([automation-testing.md](automation-testing.md) § timing) and for reading mail
([mailtrap.md](mailtrap.md)). Anything that later touches the reminder email —
its copy, its link, its recipient rule — starts here.

## 2. The business rule — what the reminder is

| Fact | Value | Provenance |
|---|---|---|
| Trigger | A quotation was generated and no insurance purchase completed; the UCD has an approved eSTM for the vehicle | `[from QA team, 2026-08-13]`; team script TS01/TS04/TS07 precondition *"An approved eSTM transaction must be created"*; TS05 *"Must NOT have an approved eSTM transaction"* → *"No email is sent after cron job runs"* |
| Scheduler | Hourly cron, **07:00–23:00** daily; picks the quotation up on the **next** run (10:59 → 11:00) | `[from QA team, 2026-08-13]`; team script notes row 19: *"Will run every hour 7am-11pm"*, *"3:59 -> 4.00 pickup / 00:00 -> 07:00 pickup"* |
| Dead window | After 23:00 until 07:00 — nothing is sent; the 07:00 run delivers it | team script TS07: *"Email will not be sent outside of the cronjob running hours (7:00AM - 11:00PM)"*, *"Email will be received on the earliest 7:00AM Cronjob"* |
| Once only | One email per quotation; a second cron run sends nothing | team script TS03: *"After second cronjob runs, no email should be sent again"* |
| Sender | `imonitor@eauto.my` (`SENDER`, `data/config.ts:87`). The team script writes `imonitor@auto.my` — a typo | `[from QA team, 2026-08-13]`; `[verified: scripts/eauto-quotation-reminder/data/config.ts · SENDER]` |
| Recipient | The UCD who generated the quotation; Main vs Sub UCD must be distinguishable | team script TS01–TS03: *"If Main & Sub UCD have different email, ensure the correct user received the email"*; TS10 reads *"click 'Complete Purchase Now' button that is received by Main UCD"* while the Sub UCD generated nothing — recipient rule for Sub-UCD-generated quotations is therefore `[unconfirmed]` |
| Body | Vehicle Number and **Discount** Amount, both *"must follow insurance quotation"*; format *"must be based on Figma"* (Figma not stored in the repo) | team script TS01 expected results; Discount-not-Commission correction in [eauto-insurance.md](eauto-insurance.md) `[from QA team, 2026-08-13]` |
| Link | A **"Complete Purchase Now"** button opening insurance step 1 in a new page; login page first when no session; a UCD from another company is sent to the homepage and does not see the quotation in its listing | team script TS08–TS12 (verbatim expectations in § 11) |
| Persistence | Nothing is written before insurance **step 3**; a step-1/2 stop leaves no listing row but the email is still sent by a backend drop-off detector with no UI | `[from QA team, 2026-08-17]`, see [eauto-insurance.md](eauto-insurance.md) § generated at STEP 3 |
| Deployment | *"Dev will need to add new column during deployment - Dev estimate 30 minutes to deploy this ticket"* | team script notes row 27 `[from ticket EAINT-11864 test script]` |
| Testing cadence | For testing the team runs the cron every **10 minutes** (13:00, 13:10, …) instead of hourly | `[from Faizuddin, 2026-08-18]` `[verified: data/config.ts · CRON comment]` |

Cases where **no** email is expected, per the team script: TS04 (purchased before
the pickup run), TS05 (no approved eSTM), TS06 (69E entry, *"No email is sent
after cronjob runs"*). Why the 69E entry suppresses the reminder is not
explained in any stored source — `[unconfirmed]`, and the TS06 email leg is
currently checked by hand because of a dev-side bug (`[from Faizuddin,
2026-08-18]`, `tests/quotation-reminder.spec.ts:417-421`).

## 3. Entry points — the five ways into a quotation

| # | Entry (team script "Trigger Point") | Cases | How the automation reaches it | Status |
|---|---|---|---|---|
| 1 | **Get Free Quote** — Insurance main → `#freeQuote` → form → `#to-show-result` | TS01, TS04, TS05, TS07 | `generateQuotation()` in `tests/quotation-reminder.spec.ts:61-107`; `QuoteFormPage.open()/fill()/showMyResult()` | **Verified** by runs (TS04 reached step 4 and "Insurance Created", `[from Faizuddin, 2026-08-19]`) |
| 2 | **eSTM** — create an eSTM, untick eLKM on its Payment step, submit, let the auto-redirect land on insurance step 1 | TS02 | `EstmHandoffPage.enterInsurance()` (`pages/EstmHandoffPage.ts:291-295`) | **Verified** live 2026-08-19 — the eSTM is `Approved` afterwards (`_reference/html/eauto/estm-listing-with-approved-row.html`) |
| 3 | **Banner** — eSTM details page `GET FREE QUOTE FOR <plate>` (`#to-buy-insurance`) → `#buy-insurance-dialog` → `#toProceed` | TS03 | `EstmBannerPage.openTransaction()/buyInsurance()` (`pages/EstmBannerPage.ts`) after abandoning entry 2 | **Verified** `[verified: _reference/html/eauto/estm-details-with-buy-insurance-banner.html, 2026-08-19]` |
| 4 | **69E** — e-simulator eSTM Enquiry Response Code `VEL000069E` makes the eSTM auto-redirect into insurance after it completes | TS06 | `EstmHandoffPage.completeEstmWithForcedInsurance()` (`pages/EstmHandoffPage.ts:314-350`) + `utils/esim.ts` | **Verified** `[verified: _reference/html/eauto/insurance-step1-after-69e-redirect.html, 2026-08-18]` |
| 5 | **"Complete Purchase Now" button in the email** | TS08–TS12 | Not automated — the dashboard lists them as `manual` (`app/eauto/quotation-reminder/page.tsx:121-155`) | `[unconfirmed]` — no capture of the email or its target URL exists |

The campaign banner on UCD home is **not** an entry point; it is a marketing
overlay that intercepts clicks (`pages/EstmBannerPage.ts:9-11`).

**Important distinction between entries 2 and 4.** Both start from an eSTM and
both end on `body#insurancePlan`, but entry 2 is triggered by *completing* the
eSTM with eLKM unticked, while entry 4 is triggered by the eSTM enquiry response
code — the eSTM flow itself is identical in both (`pages/EstmHandoffPage.ts:298-307`).
The redirect fires **after** the eSTM genuinely finishes (untick → submit →
Done), never on the eLKM toggle alone (`pages/EstmHandoffPage.ts:202-204`,
`332-334`; [flow-estm.md](flow-estm.md) § TS06). The 69E landing page carries an
explicit escape — `button#estmBackBtn` "Skip, Return to eSerahan" inside
`div.action-row` with `img#estm-info-icon` and the text *"The vehicle is
eligible for road tax renewal, but no valid motor insurance found. The system
has redirected you to purchase insurance. You may skip and return back to
eSerahan."* — so 69E is a redirect, not a hard force.
`[verified: _reference/html/eauto/insurance-step1-after-69e-redirect.html:462-471]`

## 4. URL map

Base is `https://staging.eauto.my/<env>`; `<env>` is a path segment
(`CONFIG.baseUrl`, `data/config.ts:13`; `utils/paths.ts:4-5`). Every URL the
suite touches is in `utils/paths.ts`:

| Step | URL | Arrival check | Source |
|---|---|---|---|
| Login | `/public/login/` | URL leaves `/public/login` | `utils/paths.ts:7`, `pages/LoginPage.ts:26-32` |
| UCD home | `/view/ucd/home.do` | — | `utils/paths.ts:8` |
| Insurance main | `/view/ucd/insurance` | `#freeQuote` tile present | `utils/paths.ts:10`, `pages/QuoteFormPage.ts:23-26` |
| Get Free Quote form | `/view/ucd/insurance/quote/quote.do` | `form#tx-form` visible | `utils/paths.ts:11`, `pages/QuoteFormPage.ts:29-31` |
| Insurance step 1 | (`plan/view.do`) | `body#insurancePlan` or `div[id="1"].md-step.active` | `pages/InsuranceStepsPage.ts:27-33` |
| Insurance step 2 | (`/ajax/ucd/insurance/plan/select.do?transactionId=`) | `body#coverage` / `div[id="2"].md-step.active` | same |
| Insurance step 3 | (`payment.do`) | `body#payment` / `div[id="3"].md-step.active` | same |
| Insurance step 4 | `complete.do` | `expect(page).toHaveURL(/complete\.do/)` | `tests/quotation-reminder.spec.ts:342-343` |
| Insurance listing | `/view/ucd/insurance/enquiry` | `#search-form` | `utils/paths.ts:12`; capture `insurance-listing-pending-payment-row.html` |
| eSTM listing | `/view/ucd/estm/enquiry/main.do` | `#search-form input[name=vehicleNo]` | `utils/paths.ts:14` |
| eSTM details | `/view/ucd/estm/enquiry/view.do?id=<uuid>` — `?id=`, not `?transactionId=` | `#to-buy-insurance` | `utils/paths.ts:15-16` |
| Mailtrap inbox | `https://mailtrap.io/sandboxes/2581833/messages` | not bounced to a sign-in URL | `data/config.ts:83`, `utils/mailtrap.ts:81` |
| eSIM | `172.30.202.114` (VPN only) | — | `utils/esim.ts:109`, `page.tsx:559-561` |

The eSTM leg's own URLs (bypass slot `/<env>/<slot>/<env>/view/...`, JPJ check,
Payment step) are in [flow-estm.md](flow-estm.md); the quotation-reminder suite
carries a verbatim port of those page objects under `pages/estmPort/`.

## 5. The real DOM handles — verbatim

### 5a. Shell: popups and banners (`pages/BasePage.ts`)

| Target | Handle | Line |
|---|---|---|
| Suppress the home dialog chain before first navigation | `addInitScript` setting localStorage `dialog-websocket`, `dialog-eastcoast`, `homemerdekacampaign`, `homerayacampaign`, `homecnycampaign`, `homeEInvoiceReminder`, `homeAnnouncement`, `homeStmsCancellationReminder` to `"false"` | 20-34 |
| Close a visible banner | `'#dialog-campaign-close-btn, [class*="campaign-close"], [aria-label="Close"], [data-dismiss="modal"], button.close'` each suffixed `:visible`, `.first()`, up to 3 rounds, 5 s click timeout | 57-71 |

The campaign flags `homemerdekacampaign` / `homerayacampaign` do **not** work —
the portal sets them to `"true"` on every load — so `dismissBanners()` runs after
login **and** on the Insurance page (`pages/BasePage.ts:9-18`;
`_reference/html/eauto/home-with-merdeka-and-raya-banners.html`). The `:visible`
suffix is load-bearing: `#dialog-campaign-close-btn` is a duplicate id and a bare
`.first()` always resolves to the hidden Raya copy (`pages/BasePage.ts:44-56`).

### 5b. Login (`pages/LoginPage.ts`)

| Target | Handle | Line |
|---|---|---|
| Username | `input[name="username"], input[placeholder*="Username" i]` `.first()` | 7 |
| Password | `input[name="password"], input[placeholder*="Password" i]` | 8 |
| Submit | `button:has-text("Login"), button[type="submit"], input[type="submit"]` | 9 |
| Settled | `waitForURL(u => !/\/public\/login/.test(u))` attached **before** the click | 25-28 |

### 5c. Get Free Quote (`pages/QuoteFormPage.ts`)

| Target | Handle | Line |
|---|---|---|
| Tile | `#freeQuote` — clicked, not deep-linked, because it runs `validateTransactionRestriction()` first; falls back to `goto(quoteForm())` if the tile is absent | 21-30 |
| Form | `form#tx-form` | 31 |
| Vehicle number | `#vehicleRegNo` | 15 |
| IC / ROC | `#buyerRefIdCompanyROC` | 16 |
| Decisive click | `#to-show-result` — the cron keys on this click's minute, so `showMyResult()` is kept separate from `fill()` | 17, 40-48 |

### 5d. Insurance steps 1–3 (`pages/InsuranceStepsPage.ts`)

| Target | Handle | Line |
|---|---|---|
| Arrival at step n | `body#<insurancePlan|coverage|payment>, div[id="n"].md-step.active` `.first()` visible, 60 s | 27-33 |
| Settle after step 3 | `waitForLoadState('networkidle', 8 s)` then `waitForTimeout(2000)` — the step-3 row commits after paint | 48-51 |
| Transaction id | `#adjustSumInsuredForm input[name=transactionId]` | 56 |
| Insurer cards | `.plan-container`; count after `.first().waitFor(visible, 45 s)` | 24, 61-62 |
| Select buttons | `button.select-plan-btn`, quote JSON in `plandetails` (`planCode`, `annualPremium`, `isError`, `isReferRisk`) | 25, 70-84 |
| Pick an insurer | `.plan-container.<planCode> button.select-plan-btn` `.first()`; if absent, warn and take `button.select-plan-btn` `.first()` | 96-106 |
| Step 2 → 3 | `#confirm-plan` ("Make Payment" — opens the payment form, does not pay) | 109-111 |

⚠️ The stepper divs are `id="1"`/`"2"`/`"3"`. `div#1` is a **CSS parse error**
(an id selector cannot start with a digit) and it fails the whole selector list,
including the valid `body#insurancePlan` beside it, with `SyntaxError:
'div#1.md-step.active' is not a valid selector` after burning the full timeout.
Use the attribute form `div[id="1"]`. `[verified: pages/InsuranceStepsPage.ts:16-21]`
This corrects the `div#1.md-step.active` wording in
[flow-insurance-purchase.md](flow-insurance-purchase.md).

### 5e. Payment (`pages/PaymentPage.ts`)

| Target | Handle | Line |
|---|---|---|
| Here | `body#payment` | 31 |
| Pay | `a#to-pay button.payBtn, a#to-pay, button.payBtn` `.first()` | 22 |
| Reference no | `#refNo`, regex `/[A-Z]\d{5,}/` | 36-37 |
| Total | `#totalAmount, #amount` | 41 |
| Dialog confirm | `#proceed-payment-dialog:visible button, #pricing-changed-dialog:visible button, .ui-dialog:visible button:has-text("OK"|"Yes"|"Proceed"|"Confirm")` | 24-28 |
| Referral detection | dialog text `/refer|NCD Response|Motor UW/i` → specific error "stuck in the known NCD referral loop" | 70-73, 79-84 |
| Done | URL matches `/complete\.do/` inside a 150 s poll, 1.5 s tick | 54-66 |

### 5f. Insurance listing (`pages/InsuranceListingPage.ts`, `utils/paths.ts`)

| Target | Handle | Line |
|---|---|---|
| Vehicle filter | `#search-form input[name=vehicleNo]` | 47 |
| Search | `#to-search` (rows render only after it) | 48 |
| Status cells | `table.custom-table tr.odd .status, table.custom-table tr.even .status` | 52 |
| Rows | `table.custom-table tr.odd, table.custom-table tr.even` | 100 |
| View link / id | `a.to-view[data]` — `data` attribute holds the uuid | 104-105 |
| Resume control | `a.to-payment[data="<uuid>"]` labelled **Resubmit**, then fallbacks `a:has-text("Resubmit")`, `a[href*="payment.do"]`, `a.to-pay`, `a[title*="pay" i]`, `a:has-text("Continue"|"Complete"|"Pay")` scoped to `table.custom-table tr`, then the same set scoped to `body` on the details page | 154-158, 160-186 |
| Status codes → labels | `DRAFT` Quotation · `PENDING` Pending Payment · `SUCCESS` Insurance Created · `FAILED` Failed · `APPROVAL` Pending Approval · `EXPIRED` Quotation Expired | `utils/paths.ts:21-45` |
| "Unpaid row exists" | status cell text in `RESUMABLE_LABELS` = `['Quotation','Pending Payment']`, 4 attempts 2 s apart | 32-33, 71-82 |

The status dropdown (`select[name=status]`, duplicate `id="to-filter"`) is
**never driven**: combining it with the vehicle filter hid a row that existed
(`[from Faizuddin, 2026-08-18]`, `pages/InsuranceListingPage.ts:10-16`). The
live row markup an unpaid step-3 stop leaves:

```html
<td class="center status" style="color:blue"><b>Pending Payment</b></td>
...
<a href="#" class="to-view" data="37bba22a-50c4-443d-ae79-bea012c587e2" title="to view B68004346">View</a>
<div style="margin: 0 8px;">|</div> <a href="#" class="to-payment" data="37bba22a-50c4-443d-ae79-bea012c587e2" title="to payment B68004346">Resubmit</a>
```
`[verified: _reference/html/eauto/insurance-listing-pending-payment-row.html:284-299]`

### 5g. Banner entry (`pages/EstmBannerPage.ts`)

| Target | Handle | Line |
|---|---|---|
| eSTM listing filter | `#search-form input[name=vehicleNo]` then `#to-search` | 25-26 |
| Row action | `a[href*="enquiry/view.do?id="]` `.first()`, expected count 1 within 20 s | 30-32 |
| Banner button | `#to-buy-insurance, [id*="buy-insurance"]:not(#buy-insurance-dialog), a:has-text("Buy Insurance"), button:has-text("Buy Insurance")` | 45-48 |
| Confirm | `#toProceed` ("YES" → `redirectInsuranceQuote()`); cancel is `#doNotProceed` | 52-56; capture `estm-details-with-buy-insurance-banner.html:416-437` |

Live markup: `<button class="btn-get-quote" id="to-buy-insurance">GET FREE QUOTE
FOR HX056</button>` inside `div.get-free-quote`; the dialog is
`div#buy-insurance-dialog` with `button#doNotProceed.cancel-dialog-btn` and
`button#toProceed.confirm-dialog-btn`.
`[verified: _reference/html/eauto/estm-details-with-buy-insurance-banner.html:116, 416-437]`

### 5h. eSTM entry and 69E (`pages/EstmHandoffPage.ts`, `pages/estmPort/*`)

| Target | Handle | Line |
|---|---|---|
| eSTM login fields | `getByRole('textbox', { name: 'Username ' })` / `'Password '` (note trailing space), `getByRole('button', { name: 'Login' })` | `EstmLoginPage.ts:14-16` |
| Create | buttons `eSERAHAN`, `CREATE eSERAHAN TRANSACTION`, `Close`; link `MALAYSIAN ( 马来西亚公民) ` or `MyPR - PEMASTAUTIN TETAP`; `button.confirm-dialog-btn` "Yes" | `EstmCreateTransactionPage.ts:12-17` |
| Buyer/vehicle step | `#vehicleRegNo`, textbox `Email`, `#buyer-consent`, textbox `Reconfirm eVOC Email`, `Email Address`, `Mobile No`, `#to-same-address`, `Engine No` = `*/ -1231Aa`, `input[name="chassisNo"], #chassisNo` = `913821AA/* --`, `Next`, `#ucd-consent`, `#to-agree` | `EstmBuyerDetailsPage.ts:16-24, 106, 117, 133-142, 167` |
| JPJ submit dialog | `.ui-dialog:visible` → `button.confirm-dialog-btn, button.confirm-wfw-dialog-btn` (`EstmSession.confirmDialog()`), polled until `#to-payment` is visible, up to 180 s | `EstmHandoffPage.ts:137-162`, `EstmSession.ts:180-209` |
| JPJ passed → Payment step | click `#to-payment`, confirm `#sure-to-continue-payment` the same way, until `#lkm-addson-checkbox` is visible (60 s) | `EstmHandoffPage.ts:177-199` |
| Buyer IC | `#refId` input value, read before the redirect carries it away | `EstmHandoffPage.ts:237, 326` |
| Untick eLKM | set `#lkm-addson-checkbox.checked = false` + dispatch `change` while awaiting a response whose URL includes `addon-fee.get` (12 s) | `EstmHandoffPage.ts:245-253` |
| Submit | click `#to-payment` (same id, now the Payment step), then loop: `body#insurancePlan` visible → done; else `confirmDialog(2 s)`; else click `getByText('Done', { exact: true })`; 60 s | `EstmHandoffPage.ts:259-287` |
| Amount-changed dialog | `#fis-amount-different-dialog` "Sure to make this payment now?", confirm button **OK** — handled by the generic `.confirm-dialog-btn` match | `EstmHandoffPage.ts:206-227`; capture `estm-step5-payment-fis-amount-different-dialog.html` |
| 69E full completion | `EstmPaymentPage.completePayment()` (verbatim port: `#refId`, `#estm-adds-on`, `#lkm-addson-checkbox`, `#evoc-addson-checkbox`, `#grandTotalAmount`, `#lkm-error-msg`, `#evoc-error-msg`, `#dialog:visible` processing, `.header-element-active .txn-header-div` ≠ "5") then wait for `body#insurancePlan` (60 s) | `EstmPaymentPage.ts`, `EstmHandoffPage.ts:329-349` |
| eSIM write | `scripts/eauto-esim` spawned with `ESIM_ENTITY=estm-enquiry`, `ESIM_PREFIX=<first 2 chars>`, `ESIM_MODE=write`, `ESIM_CHANGES={"Response Code":"VEL000069E"}`; success = a `RESULT:{…}` line | `utils/esim.ts:65-73, 101` |

`#to-payment` exists on **both** the JPJ-result render and the real Payment step,
meaning two different things; matching the id alone does not prove which page you
are on (`EstmHandoffPage.ts:122-129`).

### 5i. Mailtrap (`utils/mailtrap.ts`)

| Target | Handle | Line |
|---|---|---|
| Signed-out detection | `/sign_?in|login|users\/sign/i` on `page.url()` → `blocked` | 81-86 |
| Rows | `[data-testid="message-list-item"], li[class*="message"], tr[class*="message"]`, first 40 | 88-92 |
| Fields | subject `[data-testid="message-subject"]` or `[class*="subject"]` or row text; from `[data-testid="message-from"]`/`[class*="from"]`; to `[data-testid="message-to"]`/`[class*="to"]`; date `[data-testid="message-date"]`/`time`/`[class*="date"]` | 95-98 |

⚠️ **These Mailtrap selectors are guesses.** No Mailtrap page capture exists in
`_reference/html/`, and no run log in the repo records a successful inbox read.
Treat every handle in 5i as `[unconfirmed]` until a capture is saved. Details in
[mailtrap.md](mailtrap.md).

## 6. Decision points and what they branch on

1. **Entry point** — set per case in the spec (§ 3). Not configurable per run.
2. **Stop step** (`stopAt: 1 | 2 | 3`) — `generateQuotation()` selects an
   insurer only when `stopAt >= 2` and clicks `#confirm-plan` only when
   `stopAt >= 3` (`tests/quotation-reminder.spec.ts:97-103`). Only a step-3 stop
   is checked on the listing (`expectQuotationPersisted()`, lines 126-140);
   absence is deliberately not asserted for steps 1–2 because the vehicle number
   is reused across runs.
3. **Does the case create an eSTM?** `needsEstm: true` for TS01/TS07 (and
   TS04 inline); `false` only for TS05 (`tests/quotation-reminder.spec.ts:22-33,
   372-378`). `QR_CREATE_ESTM=0` skips creation and assumes `QR_VEHICLE_NO`
   already has an approved eSTM whose buyer IC is `QR_IC` (`data/config.ts:31-33`).
4. **Which IC is quoted?** The IC the eSTM reports (`BUYER_IC:` line from the
   spawned `scripts/eauto-estm`, `utils/estm.ts:126`; or `#refId` in-process)
   overrides `QR_IC` — the eSTM's identity comes from the bypass slot, and the
   approved-eSTM precondition only holds for that person (`tests/quotation-reminder.spec.ts:67-78`).
5. **Which login?** TS02/TS03/TS06 always log in as the eSTM bypass user
   (`ESTM_USERNAME`, default `faizuddinsub2` — `scripts/eauto-estm/data/config.ts:18`),
   not the Main/Sub UCD fields; TS04/TS05 use the Sub UCD fields falling back to
   Main (`tests/quotation-reminder.spec.ts:300, 375-376`); TS01/TS07 use Main.
6. **Which insurer?** TS01/TS02/TS05/TS06/TS07 ask for `Chubb`, TS03 `Takaful`,
   TS04 `TokioMarine`; any miss falls back to the first card with a `[warn]`
   (`pages/InsuranceStepsPage.ts:96-100`). Which cards exist is decided by the
   e-simulator per vehicle (`[from Faizuddin, 2026-08-18]`); Tokio Marine was
   noted as "currently disabled" (`tests/quotation-reminder.spec.ts:45-48`).
7. **When is the decisive click?** `QR_SCHEDULE_MODE`: `now`, `before-hour`
   (one minute before the next grid mark), `on-hour` (next grid mark), `at`
   (`QR_SCHEDULE_AT`, datetime-local = local time). The hold happens at the
   filled form, immediately before `#to-show-result` (or before `expectStep(1)`
   on the eSTM entry, and before `buyInsurance()` on the banner entry)
   (`utils/schedule.ts:17-54`; spec lines 86-91, 194-198, 234-236).
8. **Cron grid** — `nextCronRun(from)` rolls to the next multiple of
   `CRON.intervalMinutes` anchored at `firstHour:00`, or to tomorrow's
   `firstHour:00` when past `lastHour:00`; seconds count, so a stamp a second
   past a grid mark rolls to the next one (`utils/schedule.ts:62-90`).
9. **Dead window** — `inDeadWindow(t)` is true before `firstHour:00` or after
   `lastHour:00`; exactly `lastHour:00:00` races the last run and is **not**
   dead (`utils/schedule.ts:104-112`). TS07 fails fast if the stamp is inside
   cron hours (spec lines 392-395).
10. **Grace** — every inbox check waits until the cron run **+3 minutes**
    (`holdUntil(run + 3*60_000)`, spec lines 177, 207, 250, 363, 381, 400).
11. **TS04 honesty gate** — if `paidAt > nextCronRun(stampedAt)` the case is
    annotated `blocked` and returns instead of asserting "no email"
    (spec lines 356-361).
12. **Inbox unreadable** — `blocked` annotation and a hand-check instruction,
    never a pass (spec lines 150-158). `expected: 'one'` asserts **exactly one**
    match; `'none'` asserts zero (lines 163-167).
13. **eLKM already unticked** — skipped with a log line (`EstmHandoffPage.ts:242-243`).
14. **Resume route** — row `a.to-payment` first, then details page; the route
    taken is recorded as a `resumed via` annotation (spec line 330).
15. **eSIM restore** — TS06 always writes `GLB000000I` back in a `finally`
    (spec lines 447-452); a failed restore is a loud warning, not a pass.
16. **Nightly vs interactive** — the nightly spec (`tests-nightly/`) has no
    schedule hold and no inbox check; the dashboard route greps against the
    default config so it can never select it (`playwright.nightly.config.ts:7-12`).

## 7. How each case is driven

| Case | Team script (verbatim trigger / insurer / user / stop) | Automation shape (`tests/quotation-reminder.spec.ts`) | Deviations from the script |
|---|---|---|---|
| TS01 | Get Free Quote · Lonpac · Main UCD · step 1 · "1 Minute before the hour" · email at next hour | spawn eSTM → login Main → quote → hold → `#to-show-result` → step 1 → wait cron+3m → exactly one email (lines 173-180) | insurer Chubb (default), not Lonpac |
| TS02 | eSTM · Tokio Marine · Sub UCD · step 2 · "Exactly on the hour" | in-process eSTM, untick eLKM, redirect → hold → step 1 → Chubb → step 2 → wait → one email (188-210) | login = bypass user, not the Sub UCD field; insurer Chubb |
| TS03 | Banner · Chubb · Main UCD · step 3 · two cron runs, one email | TS02 first half → `goto(home)` → eSTM listing → View → `#to-buy-insurance` → `#toProceed` → Takaful → step 3 → listing row → 1st run: one → 2nd run: still one (225-257) | login = bypass user; insurer Takaful; "Click Back and continue finishing until eSTM = Approved" is a tester reminder, not a step (`[from QA team, 2026-08-17]`) |
| TS04 | Get Free Quote · Takaful · Sub UCD · "Stop at Insurance Page Step 1 … Wait for a couple minutes and complete the insurance purchase" · no email | spawn eSTM → login Sub → quote → TokioMarine → **step 3** → listing row → idle `QR_DROP_OFF_SECONDS` → `resumeToPayment()` → `payNow()` → `complete.do` → listing "Insurance Created" → blocked if paid after pickup → wait → none (278-366) | stops at step 3 (a resumable row needs step 3); insurer TokioMarine; the script's "couple minutes" is 300 s in the case as written, 10 s default |
| TS05 | Get Free Quote · Chubb · Sub UCD · step 2 · eSTM Failed / none · no email | no eSTM → login Sub → quote → Chubb → step 2 → wait → none (373-384) | script also expects "User can proceed up to step 2 only" — not asserted |
| TS06 | 69E · Tokio Marine · Main UCD · step 3 · no email | eSIM prefix → `VEL000069E` → in-process eSTM to JPJ result → set code → Make Payment → full completion → redirect → Chubb → step 3 → stop; restore `GLB000000I` (428-454) | email check removed (dev-side bug); insurer Chubb; login = bypass user |
| TS07 | Get Free Quote · Lonpac · Main UCD · step 3 · "Testing must be made outside of cronjob running hours (eg: 11:01PM - 6:59AM)" · email at 07:00 | spawn eSTM → quote → step 3 → listing row → assert dead window → none now → hold to 07:00+3m → one (387-403) | insurer Chubb; the nightly split (below) runs the quotation half only |
| TS08–TS12 | "Complete Purchase Now Button" | manual | — |

Test titles must match `SCENARIOS[].title` in
`app/eauto/quotation-reminder/page.tsx:71-156` exactly — the route greps by
title (`app/api/eauto-quotation-reminder/run/route.ts:243-255`), and on Windows
the joined pattern is quoted so the `|` is not read as a pipe.

### The nightly split (TS07's overnight half)

The laptop is off from 18:00, so the 23:30 quotation runs on GitHub Actions
(`.github/workflows/nightly-quotation.yml`, cron `30 15 * * *` UTC = 23:30 MYT,
**schedule commented out** until a supervised run passes; `workflow_dispatch`
inputs `vehicleNo`, `insurer` default `Lonpac`; `concurrency.group:
nightly-quotation`; `timeout-minutes: 30`; secrets `QR_BASE_URL`, `QR_UCD_USER`,
`QR_UCD_PASS`, `QR_VEHICLE_NO`, `QR_IC`). The spec
`tests-nightly/nightly-quotation.spec.ts` logs in, quotes, selects `NQ_INSURER`
(default `Lonpac`), stops at step 3, asserts the listing row, and prints a
`RESULT:` JSON with `stampedAtUtc`/`stampedAtLocal` and `expectEmailAt`. The
email is checked **by hand the next morning** because Mailtrap is read through
a signed-in Chrome profile that a cloud runner does not have
(`tests-nightly/nightly-quotation.spec.ts:8-25, 40-41`; `.env.nightly.example:18-20`).
`playwright.nightly.config.ts`: `timeout: 15 min`, `retries: CI ? 1 : 0`,
headless unless `NQ_HEADED=1`, `video`/`trace: retain-on-failure`.

### Dashboard and run route

`POST /api/eauto-quotation-reminder/run` (`app/api/eauto-quotation-reminder/run/route.ts`):

| Request field | Env var injected | Notes |
|---|---|---|
| `scenarios[]` (titles) | `--grep` | required |
| `baseUrl` | `QR_BASE_URL` | required; dashboard preset list UAT1–4, SIT1–3 (`page.tsx:25-33`) |
| `ucdUser` / `ucdPass` | `QR_UCD_USER` / `QR_UCD_PASS` | required |
| `subUcdUser` / `subUcdPass` | `QR_SUB_UCD_USER` / `QR_SUB_UCD_PASS` | prefilled `faizuddinsub2` / `password` (`page.tsx:184-191`) |
| `vehicleNo` / `ic` | `QR_VEHICLE_NO` / `QR_IC` | required |
| `scheduleMode` / `scheduleAt` | `QR_SCHEDULE_MODE` / `QR_SCHEDULE_AT` | `at` requires `scheduleAt` |
| `headless` | `QR_HEADLESS=1` | |
| `estmBuyerEmail` / `estmMobile` | `QR_ESTM_BUYER_EMAIL` / `QR_ESTM_MOBILE` | prefilled `faizbidi03@gmail.com` / `0123456789` |
| (server-resolved) | `QR_CHROME_USER_DATA_DIR` / `QR_CHROME_PROFILE_DIR` | from `resolveWorkProfile()` — the single Chrome profile whose `hosted_domain` is `modefair.com` or whose `user_name` ends `@modefair.com`, read from `%LOCALAPPDATA%\Google\Chrome\User Data\Local State` → `profile.info_cache`; zero or several matches → the run proceeds and the email check reports `blocked` (route lines 58-98, 232-236) |

Route limits: `maxDuration = 14400`, `TIMEOUT_MS = 4 h` (TS03 spans two cron
hours), reporter `json` to `test-results/report.json`, `DELETE` stops the run
(taskkill tree on Windows). Videos from this suite **and** from the spawned
`scripts/eauto-estm` run are concatenated with `ffmpeg` (stream copy, then
re-encode fallback) into `public/qa-artifacts/eauto-quotation-reminder/run.webm`,
scoped by `runStartedAt` because `test-results/` is never cleared (route lines
156-208). The dashboard page keeps the run in `useBackgroundRuns` under key
`eauto/quotation-reminder` so navigating away does not lose a 2 h run
(`page.tsx:10-14, 234-241`), and gates TS06 behind a "Is your VPN connected?"
dialog (`page.tsx:247-249, 550-575`).

### Configuration knobs (`data/config.ts`, `.env.example`)

| Env var | Default | Meaning |
|---|---|---|
| `QR_BASE_URL` | `https://staging.eauto.my/uat1` in `config.ts:13`; `.env.example:3` says `uat4` — the two disagree | base; the segment is a per-ticket choice, not a rule |
| `QR_UCD_USER` / `QR_UCD_PASS` / `QR_SUB_UCD_USER` / `QR_SUB_UCD_PASS` | — | logins |
| `QR_VEHICLE_NO` (uppercased) / `QR_IC` | — | the vehicle threads listing, details header and email body |
| `QR_CREATE_ESTM` | `1` | `0` = eSTM already exists |
| `QR_ESTM_SCRIPT_DIR` | `../eauto-estm` | sibling suite spawned as a child |
| `QR_ESTM_USERNAME` / `QR_ESTM_PASSWORD` / `QR_ESTM_BYPASS_SLOT` | eSTM suite defaults (`faizuddinsub2` / `password` / `zzz/22`) | the bypass user, per environment |
| `QR_ESTM_BUYER_EMAIL` (alias `QR_ESTM_EMAIL`) | — | must differ from the fixed eVOC address `faizuddin@modefair.com`, else the portal rejects with "Please enter Buyer's Email Address." (`utils/estm.ts:25-27, 63-72`) |
| `QR_ESTM_MOBILE` | `0123456789` | |
| `QR_ESTM_ELKM` / `QR_ESTM_EVOC` | `0` / `0` | add-ons cost real money (eLKM ~RM200, eVOC RM10) and eLKM needs active insurance — off |
| `QR_DROP_OFF_SECONDS` | `10` (case as written: 300) | TS04 idle at step 3 |
| `QR_SCHEDULE_MODE` / `QR_SCHEDULE_AT` | `now` / — | |
| `QR_CRON_FIRST_HOUR` / `QR_CRON_LAST_HOUR` / `QR_CRON_INTERVAL_MINUTES` | `7` / `23` / `60` | set interval `10` to match the team's testing cadence |
| `QR_CHROME_USER_DATA_DIR` / `QR_CHROME_PROFILE_DIR` | — / `Default` | resolved by the route; absent → `blocked` |
| `QR_MAILTRAP_INBOX` | `https://mailtrap.io/sandboxes/2581833/messages` | |
| `QR_HEADLESS` | unset (headed) | |
| `QR_ESIM_SCRIPT_DIR` / `QR_ESIM_USER` / `QR_ESIM_PASS` | `../eauto-esim` / eSIM defaults (`admin`/`admin`) | TS06 only, VPN |
| `NQ_INSURER` / `NQ_HEADED` | `Lonpac` / unset | nightly only |

Playwright: `timeout: 0` (the route owns the ceiling), `workers: 1` (cases share
one vehicle and one staging quotation), `video: 'on'`, viewport 1920×1080
(`playwright.config.ts`).

### Safety switches

1. `QR_ESTM_ELKM=0` / `QR_ESTM_EVOC=0` — no paid add-ons on throwaway eSTMs.
2. Only TS04 buys; staging purchase is sandbox payment and allowed (`[from Faizuddin, 2026-08-18]`).
3. `ESTM_SKIP_PAUSE=1` is always sent to the child so it never parks on an interactive pause (`utils/estm.ts:88-90`).
4. eSIM Response Code restored to `GLB000000I` in `finally` (eSIM is shared, keyed by prefix — [esim.md](esim.md)).
5. Email check `blocked` ≠ pass; profile copied, never used in place (Chrome locks it).
6. Nightly cron disabled until proven; repository must be confirmed private before secrets go in (workflow header).

## 8. Preconditions and test data

1. A **fresh vehicle number per run** for every eSTM-creating case: a vehicle
   already carrying a transaction hits `#duplicate-transaction-msg`
   (*"Transaksi yang sama untuk kenderaan dan pemilik ini telah direkod sebelum
   ini. Sila rujuk kepada eSTM transaction listing."*) or `#insDoneBuy` (*"This
   transaction cannot be processed. Insurance must be purchased through our
   platform for this vehicle."*). `[verified: _reference/html/eauto/estm-step2-buyer-vehicle.html:381-384; estm-step4-jpj-check-submit-dialog.html:338-341]`
2. TS04 consumes the vehicle number (purchase).
3. The eSTM bypass user must be patched to the bypass slot's IC on the
   environment in use — the patch is per environment ([flow-estm.md](flow-estm.md)).
4. Main and Sub UCD need **different** email addresses for the "correct user
   received the email" checks (`page.tsx:376-384`) — Faizuddin's own slot/sub
   UCD was still an open ask (§ 12).
5. VPN for TS06 (eSIM at `172.30.202.114`).
6. Chrome signed in to Mailtrap under the `modefair.com` account.
7. `scripts/eauto-estm` and `scripts/eauto-esim` installed (`node_modules`
   present) — checked before spawning (`utils/estm.ts:55-58`, `utils/esim.ts:58-61`).
8. Reusing `@playwright/test` across suites fails with "Requiring
   @playwright/test second time" — hence the verbatim port in `pages/estmPort/`
   and the nightly spec sharing this suite's install (`EstmHandoffPage.ts:9-19`,
   `tests-nightly/nightly-quotation.spec.ts:21-24`).

## 9. Traps

| Symptom | Cause / fix | Source |
|---|---|---|
| `SyntaxError: 'div#1.md-step.active' is not a valid selector` after a full timeout | id starting with a digit; use `div[id="1"]` | `InsuranceStepsPage.ts:16-21` |
| Listing empty right after step 3 | row commits after paint; `expectStep(3)` settles, `hasQuotation()` and `resumeToPayment()` retry 4× | `InsuranceStepsPage.ts:35-51`, `InsuranceListingPage.ts:58-82, 133-148`; `[from Faizuddin, 2026-08-18/19]` |
| Listing empty for a step-1/2 run | nothing persists before step 3 — correct, not a bug | `[from QA team, 2026-08-17]` |
| Row exists but search finds nothing | the status dropdown was driven; filter by vehicle only | `InsuranceListingPage.ts:10-16` |
| Expected `DRAFT`/"Quotation", got "Pending Payment" | an unpaid step-3 stop renders `PENDING`; accept both | capture 2026-08-18 |
| `dismissBanners()` clicks nothing while a banner is on screen | duplicate `#dialog-campaign-close-btn`; `:visible` suffix | `BasePage.ts:44-56` |
| Stuck on `estm-enq.do` with "Submit to JPJ for checking?" | `#to-retry-dialog` must be confirmed, possibly more than once; poll for `#to-payment` | `EstmHandoffPage.ts:114-136` |
| Polling for `#lkm-addson-checkbox` forever | it only exists on the real Payment step, reached by clicking `#to-payment` on the JPJ-result render | `EstmHandoffPage.ts:122-129` |
| Run stalls after unticking eLKM | `#fis-amount-different-dialog` ("OK", not "Yes"); confirm generically | `EstmHandoffPage.ts:206-227` |
| Redirect never arrives on the untick | the untick only recalculates the fee (`addon-fee.get`); the eSTM must be submitted to Done | `EstmHandoffPage.ts:202-204` |
| `setAddons()` re-ticks eLKM in-process | `eauto-estm/data/config.ts` is frozen at import; env set later is ignored — only the spawned child honours `ESTM_ELKM` | `EstmPaymentPage.ts:62-72` |
| eSTM rejects the buyer email | buyer email equals the eVOC address | `utils/estm.ts:63-72` |
| "Please use login user's mykad" at eSTM step 3 | wrong login for the bypass slot | `data/config.ts:35-37` |
| Payment never reaches `complete.do` | NCD/underwriting referral loop for that vehicle — change vehicle | `PaymentPage.ts:79-84` |
| TS06 times out at the eSIM step | VPN not connected (`net::ERR*`/`ECONNREFUSED` in the child log) | `utils/esim.ts:102-110` |
| Email check says `blocked` | profile unresolved, or Mailtrap bounced to sign-in — sign in to Chrome, re-run | `utils/mailtrap.ts:57-86` |
| `--grep` matches nothing | title drift between `page.tsx` and the spec | route lines 243-255 |
| Several scenarios selected on Windows run only the first | the `|` in the grep must be quoted — already handled | route lines 247-255 |
| TS04 reports `blocked` not pass | purchase landed after the pickup run; schedule earlier in the hour | spec lines 356-361 |
| 23:00 stamp fails TS07's dead-window assert | 23:00:00 races the last run; use 23:30 | `utils/schedule.ts:104-112` |
| Two videos, one missing | the eSTM child records its own; the route stitches both by mtime ≥ run start | route lines 156-208 |
| Second `@playwright/test` install | cannot import `scripts/eauto-estm` page objects; use the port | `EstmHandoffPage.ts:9-19` |

## 10. What is NOT covered

1. The email itself has never been asserted field-by-field: `matching()` only
   looks for the vehicle number in subject/to/from of the inbox list, so
   subject wording, sender, recipient, Discount amount and the "Complete
   Purchase Now" link are all unverified by automation (`utils/mailtrap.ts:113-117`).
2. The Mailtrap DOM handles (§ 5i) and whether the vehicle number even appears
   in the subject line — `[unconfirmed]`.
3. TS08–TS12 (email-link entry, cross-company access, fresh-browser login).
4. The TS06 reminder assertion (removed, dev-side bug).
5. Cross-checking the purchase on BO Insurance Transaction Listing and CIBO
   (team script TS08–TS10 step 3) — see [flow-eauto-insurance-enquiry.md](flow-eauto-insurance-enquiry.md)
   and [cibo.md](cibo.md).
6. The Get Free Quote form, step 2 and step 3 page HTML for this ticket's
   environment were never saved; only the 69E step-1 page and the listing row
   are captured.
7. The nightly workflow has never run on Actions; the second (07:00) half has no
   automation at all.
8. Which user receives the email when a Sub UCD generates the quotation.

## 11. The team script's email-link cases, verbatim (for when they are automated)

| Case | Precondition | Expected |
|---|---|---|
| TS08 | *"The browser must have the eauto account logged in"* | *"New page opens up the insurance transaction step 1"*, purchase completes, cross-check UCD / BO / CIBO |
| TS09 | *"Use another browser / incognito browser where UCD has not logged in yet"* | *"New page opens up the login page"*, then purchase completes |
| TS10 | Sub UCD in same company clicks the button *"that is received by Main UCD"* | step 1 opens, purchase completes |
| TS11 | *"Ensure browser is logged in with UCD account from different company"* | *"The system redirects to the homepage"*, *"The UCD from different company will not have the quotation in their insurance transaction listing"* |
| TS12 | *"Browser must not have any logged in UCD account"*, log in as Main UCD of a different company | login page → homepage; quotation absent from their listing |

Notes row 29 of the sheet adds *"Backoffice SHOULD NOT go to the main page"*
and row 24 *"Test Backoffice access"* — a BO user following the link is a case
the sheet names but never wrote up. `[from ticket EAINT-11864 test script]`

## 12. Status — paused, and why

1. **Paused 2026-08-13** pending team decisions; last code change in this suite
   is commit `c9aab16` (2026-09-21, "Latest update on all automation script").
   `[verified: git log, 2026-10-15]`
2. Open with the team (`[from Faizuddin, 2026-08-13]`): whether QA can trigger
   the cron on demand; whether Faizuddin gets his own bypass slot and a Sub UCD
   with a different email under a company he controls. Answered since:
   purchasing on staging is allowed (2026-08-18).
3. The TS06 email leg is manual until a dev-side bug is resolved
   (`[from Faizuddin, 2026-08-18]`).
4. The Mailtrap read runs only on a laptop with the signed-in `modefair.com`
   Chrome profile; the dead-window case therefore cannot be completed on GitHub
   Actions, and the nightly schedule is switched off until a supervised run
   passes. Faizuddin asked to be reminded about this once the automation
   scripts progress.
5. Stale wording still in the code that should be fixed when the suite is next
   touched: `.env.example:8` *"The eSTM is created by hand today"* and
   `pages/EstmBannerPage.ts:31` *"the automation does not create it yet"* (every
   eSTM case now creates its own); `utils/paths.ts:19-20` and
   `tests-nightly/nightly-quotation.spec.ts:33` still say the step-3 row is
   `DRAFT` ("Quotation") — the live capture shows `PENDING`; the dashboard's
   insurer labels for TS03 (`Takaful`) and TS04 (`Tokio Marine`) do not match
   the team sheet (Chubb, Takaful).
