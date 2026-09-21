# Flow — UCD insurance quotation → purchase, and the post-purchase records

The UCD insurance flow: get a quote, pick an insurer, add optional coverage, pay,
then verify the created transaction on the listing and details pages. Six surfaces
in one journey, which makes it the repo's best worked example of cross-page data
verification.

Anything touching insurance quotations, e-certificates, the reminder email
(EAINT-11864) or transaction listing columns (EAINT-12058) starts here.

Two provenance levels below, and the difference matters:

- `[verified: live HTML from uat4, 2026-08-14]` — real page source. **Trust these
  selectors.**
- `[verified: scripts/eauto-e2e]` — from the working automation that completes real
  purchases. Trustworthy for *behaviour*, but several of its selectors are
  workarounds written before the HTML was available; where the live HTML gives a
  better handle, that is flagged.

Read [flow-ucd-shell.md](flow-ucd-shell.md) first for the popup chain, the
listing/search pattern, and the duplicate-id traps that apply here.

## The precondition that splits this flow in two

**Quoting needs no eSTM. Purchasing needs an approved eSTM.**

| Leg | Precondition |
|---|---|
| Get Free Quote → insurer cards → **quotation generated** | vehicle no + IC only |
| Optional coverage → payment → insurance created | **an approved eSTM** |

`[from QA team, 2026-08-14]`

So a scenario that only needs a *quotation* — EAINT-11864's reminder cases, quote
comparison, expiry behaviour — skips eSTM creation entirely. Only the purchase leg
requires one. See [eauto-insurance.md](eauto-insurance.md) and
[flow-estm.md](flow-estm.md).

## Entry points

| Entry | Status |
|---|---|
| Home tile `#insurance` → Insurance main → **Get a Free Quote** | **Verified live** |
| **From an eSTM** — details page "buy insurance" dialog, or the 69E auto-redirect | See [flow-estm.md](flow-estm.md) § eSTM → insurance handoff |
| **Banner on the eSTM details page** | The EAINT-11864 script's "Banner". **Lands on step 1**, skipping the quote form — see § Banner entry below |
| Campaign banner on UCD home | `[unconfirmed]` — a rotating **marketing** overlay, not an entry point. It *intercepts* clicks rather than offering insurance; suppress it via the `home*` localStorage flags |
| **69E auto-redirect** | **Confirmed working end to end, 2026-08-18** — lands on step 1 (`body#insurancePlan`) with an explicit "Skip, Return to eSerahan" escape, i.e. NOT a hard force. See [flow-estm.md](flow-estm.md) § CONFIRMED WORKING END TO END |
| Link inside the reminder email | `[unconfirmed]` — EAINT-11864 TS08–TS12; cannot be automated as written |

## URL map

Base is `https://staging.eauto.my/<env>`, `<env>` a **path segment** (`uat4`,
`sit3`, …) not a subdomain. `scripts/eauto-e2e` defaults to `sit3`; the captured
HTML is `uat4`.

| Step | URL | How to confirm you're there |
|---|---|---|
| Insurance main | `/view/ucd/insurance` | breadcrumb `.page-name` = "Motor Insurance or Takaful" |
| Transaction listing | `/view/ucd/insurance/enquiry` | `#search-form` present |
| **Get Free Quote form** | `/view/ucd/insurance/quote/quote.do` | `form#tx-form`, `#vehicleRegNo` |
| 1 · Quotes (insurer cards) | `/view/ucd/insurance/plan/view.do` | `body#insurancePlan`, `.plan-container` |
| 2 · Optional coverage | `/ajax/ucd/insurance/plan/select.do?transactionId=<uuid>` | `body#coverage` |
| 3 · Payment | `payment.do` | `body#payment`, `#refNo` |
| 4 · Confirm | `complete.do` | URL match is the completion test |
| 5 · Listing row | `/view/ucd/insurance/enquiry/main.jsp` | — |
| 6 · Details | `/view/ucd/insurance/enquiry/view.do?transactionId=<uuid>` | body contains `Insurance Created` |

**Step 2 is served from `/ajax/...do` as a full page navigation**, not an XHR.

### Three quote URLs exist — these are different entry points, not a conflict

**Rule: the live HTML wins.** `[from QA team, 2026-08-14]`

| URL | What it is |
|---|---|
| `quote/quote.do` | **The Get Free Quote form.** Where `#freeQuote` sends you. Use this |
| `quote/processQuoteFromEstm.do?transactionId=<uuid>` | The **eSTM** entry. Reached from the eSTM Payment step's `#to-buy-insurance`. See [flow-estm.md](flow-estm.md) |
| `quote/view.do?transactionId=` | Referenced by a leftover home-page handler with an empty id, and by the wait in `scripts/eauto-e2e`. **Not the form page** |

⚠️ **Wait for the destination, not for a URL along the way.** Clicking the eSTM
details-page banner ends on **step 1** (the insurer cards). Whether the browser
goes straight there or bounces through another URL first is unrecorded — and it
does not matter, because the end point is the same. A spec that waits for a
particular in-between URL will hang if that page is skipped. So wait for
`body#insurancePlan` / `div#1.md-step.active` — "am I on the cards page yet?" —
which is true either way. `[unconfirmed which route it takes, 2026-08-17]`

⚠️ `scripts/eauto-e2e/pages/InsuranceQuotePage.ts:24` waits for
`waitForURL(/quote\/view\.do/)` and swallows the failure with `.catch(() => {})`,
so **that arrival check never passes and never complains**. The run continues
because the next step finds the form fields anyway. Harmless today; it means a
genuine load failure surfaces later as a confusing error, and anyone copying the
pattern inherits a check that does nothing. Fix to `quote/quote.do` when that file
is next touched.

### Which step am I on — read the stepper

Steps 1–3 all render the same horizontal stepper. The active step carries
`.active`, completed ones `.done`:

```
div.md-stepper-horizontal
  div#1.md-step  .md-step-title "Quotes"
  div#2.md-step  "Optional Coverage"
  div#3.md-step  "Payment"
  div#4.md-step  "Confirm"
```

`div#2.md-step.active` is a cleaner arrival check than a URL regex. Bodies also
carry ids: `#insurancePlan`, `#coverage`, `#payment`.
`[verified: live HTML, 2026-08-14]`

## Insurance main page

| Target | Selector | Destination |
|---|---|---|
| Transaction listing | `#insuranceListing` | `/view/ucd/insurance/enquiry` |
| **Get a Free Quote** | `#freeQuote` | `validateTransactionRestriction()` → `/view/ucd/insurance/quote/quote.do` |
| Report | `#report` | `/view/ucd/insurance/insurance-report/report.do` |
| Update Permission | `#insurancePermission` | `POST /ajax/ucd/services/check-insurance-contract.do` → user list, or the Insurance Commercial Agreement dialog |
| Endorsement | `#endorsement` | `endorsement/list-endorsement.do` — pilot, tile not always rendered |

Use `#freeQuote`, not `text=GET A FREE QUOTE`: the DOM text is title-case
("Get a Free Quote") and the uppercase is CSS. Insurer contact popups are
`img.dialog-btn[value="takaful-dialog"]` etc.

The permission dialog `#allow-insurance-dialog` hides its button pane until
`input.terms` is ticked; `I Accept` → `/view/ucd/services/allow-insurance-director.do`.
Non-directors get `openCustomDialog("You are not allowed to use the module.")`.

## Banner entry — buying insurance from an eSTM details page

The EAINT-11864 script's "Banner" trigger (TS03). **Not** the campaign overlay on
UCD home — that is marketing furniture that intercepts clicks and offers nothing.
This is a button on the **eSTM details page**.

The whole route, end to end:

| # | Where | How |
|---|---|---|
| 1 | Create a **new** eSTM transaction | `scripts/eauto-estm` already does this — see below |
| 2 | eSTM listing `/view/ucd/estm/enquiry/main.do` | `input#vehicleNo[name=vehicleNo]`, then **`#to-search`** |
| 3 | Pick the row | match on **vehicle number**; open via `a[href*="enquiry/view.do?id=<uuid>"]` |
| 4 | eSTM details `/view/ucd/estm/enquiry/view.do?id=<uuid>` | click the buy-insurance banner → `#buy-insurance-dialog`, confirm with **`#toProceed`** ("YES" → `redirectInsuranceQuote()`) |
| 5 | **Insurance step 1** — insurer cards | `body#insurancePlan`, `.plan-container`. Proceed exactly as the normal flow from here |

`[from QA team, 2026-08-17; selectors verified: live HTML 2026-08-14 —
see flow-estm.md § eSTM listing / eSTM details / buy-insurance handoff]`

**The vehicle number is the key for the whole journey.** It is what you searched
the listing by, what `.title-id` shows on the details header, and what the reminder
email must quote back. One value threads the entire scenario, so pass it in rather
than discovering it.

### What this entry skips, and why that matters

**It lands on step 1 (insurer cards), not on the Get Free Quote form.** The eSTM
already holds the vehicle and owner, so there is nothing to key in — the quote is
processed server-side and you arrive at the cards.

Two consequences for a spec:

- **Do not reuse the Get Free Quote page object here.** `#vehicleRegNo` /
  `#buyerRefIdCompanyROC` / `#to-show-result` never render on this path. Arrival is
  `div#1.md-step.active` or `body#insurancePlan`, never `form#tx-form`.
- **TPFT may be absent by design.** A quote reached through the eSTM flow carries a
  non-blank `estmTransactionId`, and TPFT is hidden when `isHakMilik == true` — see
  [eauto-insurance.md](eauto-insurance.md). A missing TPFT card here is the Hak
  Milik gate, not a defect. TS03 uses Chubb comprehensive, so it is unaffected.

### Two traps carried over from eSTM

- **The details URL takes `?id=`, not `?transactionId=`** — the opposite of the
  insurance details page. Reusing a helper across the two modules gets this wrong.
- **Nothing renders on the listing until `#to-search` is clicked.** `#empty-state`
  reads "Please apply search to show the record", so scraping straight after
  navigation finds zero rows and looks like missing data.

### Step 1 creates a NEW eSTM transaction every run

Not "reuse whatever eSTM is lying around" — each run **creates a fresh eSTM
transaction**, and the banner journey then works against that one.
`[from QA team, 2026-08-17]`

That has a cost worth planning for: a **fresh vehicle number is needed per run**,
because a vehicle already carrying a transaction hits `#duplicate-transaction-msg`
("same vehicle + owner already recorded") or `#insDoneBuy` on the listing. Feed the
vehicle number in as test data; never hardcode one.

The creation itself is already automated — `scripts/eauto-estm` does it end to end,
and its eLKM default is **off**, with a comment naming TS02/TS03 as the reason.
Drive that rather than writing a second implementation. See
[flow-estm.md](flow-estm.md) for the create flow, the bypass slot and the
`getActivePage()` rule (never hold a `page` handle across a navigation in that
module).

### "Until eSTM = Approved" is a reminder to the tester, not a UI gate

TS03 step 5 reads "Click 'Back' and continue finishing until eSTM = Approved". That
line exists to remind a **human tester that the eSTM has to be created** before the
rest of the case makes sense — it is not describing a condition the banner checks.
Read it as the case's precondition, not as behaviour to assert.
`[from QA team, 2026-08-17]`

## Get Free Quote form

`form#tx-form` → `POST /ajax/ucd/insurance/quote/save-form.do` (multipart).

| Field | Selector | Notes |
|---|---|---|
| transactionId | `input[name=transactionId]` | **empty** on a fresh quote |
| Vehicle Category | `input[name=vehicleCategory][value=individual\|company]` | `individual` checked; **inputs are `display:none`** — click `span.label.custom-radio`. Both share `id=vehicleCategory` |
| Vehicle Number | `#vehicleRegNo` | `.is-required.form-control` |
| IC / Company Reg No | `#buyerRefIdCompanyROC` | `maxlength=12`; label swaps between `#individualUser` and `#companyUser` |
| Start Over | `#to-start-over` | |
| **Show My Result** | `#to-show-result` | `input[type=submit]`, `value="Show My Result"` |

Validation errors render into `div.text-error` (and `#icNoError`), hidden by default.

**This supersedes the positional locators** in
`scripts/eauto-e2e/pages/InsuranceQuotePage.ts:12,43-44`, which addressed these two
fields as `form input[type="text"]:visible >> nth=0` / `nth=1` because the ids
weren't known. Use the ids — the positional version breaks the moment a field is
added.

## Step 1 — insurer quote cards

### Vehicle summary bar

Real ids: `#ownerNric`, `#vehicleRegNo`, `#vehicle`, `#vehicleYear`,
`#ncdPercentage`. Capacity / Transmission / Variant (Series) sit in `.info-box`
blocks without ids. Editable: `#ncdVehicleRegNo` (Transfer NCD, optional),
`#postcode`, then `button#update` ("Apply Changes").

### The cards — `.plan-container`, and the JSON that beats regex

```
div.plan-container.Lonpac-border.Lonpac
  div.plan-logo img
  div.Lonpac-type            ← cover type text: COMPREHENSIVE / 1号保险
  div.plan-sum-insured
    div.price-range          ← "RM40,000 - RM65,000"
    select[name=sumInsuredValue][plancode="Lonpac"][coveragecode="CO"]
  div.plan-premium-breakdowns  ← Premium after NCD / Service Tax / Stamp Duty
  div.plan-premiums            ← "RM 1,531.80 / year"
  div.plan-button  button.select-plan-btn[plandetails="{…}"]
  div.plan-more-info p.dialog-btn[value="Lonpac"]
```

**Cards have a real container class, `.plan-container`.** This retires the
"walk up to 7 parent levels looking for cover-type text" strategy in
`InsuranceQuotePage.ts:88-113`.

**`button.select-plan-btn[plandetails]` carries the whole quote as JSON** — the
single most valuable handle on this page:

```json
{"planCode":"TokioMarine","sumInsured":123900.0,"minAdjustSumInsured":123900.0,
 "maxAdjustSumInsured":136290.0,"originalSumInsured":123900.0,"basicPremium":2977.96,
 "allRiderAmount":0.0,"totalBasic":2977.96,"grossPremium":1355.08,"annualPremium":1355.08,
 "ncdPercentage":55.0,"ncdAmount":1637.88,"sstAmount":108.41,"stampDuty":10.0,
 "isError":false,"isReferRisk":false,"vehicleCoverageCode":"CO",
 "vehicleMarketValue":123900.0,"vehicleUseCode":"P1"}
```

Parse that attribute instead of scraping displayed money strings: it gives the
exact expected numbers, the insurer code, the sum-insured bounds, and the
`isReferRisk` / `isError` flags. Insurer identity comes from `planCode`, not from
button text. `[verified: live HTML, 2026-08-14]`

Insurer classes seen live: `.Lonpac`, `.TokioMarine`, `.Takaful` (+ `.Takaful-TF`
for TPFT), `.Chubb`, `.Rhb`. Corner ribbons: `.plan-label.cheapest`,
`.cashback`, `.cheapestandcashback`.

### Changing sum insured destroys your element handles

`select[name=sumInsuredValue]` on **change** fires
`POST /ajax/ucd/insurance/plan/saveAdjustedSumInsured.do` (serialising
`#adjustSumInsuredForm`: `#adjustedSumInsured`, `#planCode`, `#coverageCode`) and
then **replaces the entire `#planList` innerHTML with the response**. Every card
locator captured before that call is stale. Re-query after the AJAX settles.

Each card has its own dropdown and they all share `id="sumInsuredValue"` — select
by `[name=sumInsuredValue][plancode="…"]`.

### Selecting a plan

`.select-plan-btn` click →
1. If `capacity` / `transmission` / `variantSeries` selects are present and unset
   (or changed), it **blocks** with *"Please select transmission and variant
   (series) and click Apply Changes"*.
2. If `vehicleCoverageCode == "TF"` → TPFT consent dialog
   `#Takaful-TF-Consent-dialog`, `#proceedTPFT` (Next) / `#cancel`.
3. Otherwise `POST /ajax/ucd/insurance/quote/savePlanDetails.do`
   `{transactionId, planDetails}` → `window.location =
   /ajax/ucd/insurance/plan/select.do?transactionId=<uuid>`.

All buttons are disabled during the call; on error `openCustomDialog(...)` shows
and they re-enable. `#retryAction` / `.retry-plan` appear when the quote errored.
`#backBtn` goes back.

**Get the transactionId from the DOM, not the URL:**
`#adjustSumInsuredForm input[name=transactionId]` holds it (it is also inlined in
the page script). Cleaner than the URL regex in
`tests/insurance-e2e.spec.ts:22-25`.

## Step 2 — optional coverage

### The hidden form is the source of truth

`form#tx-form` → `POST /ajax/ucd/insurance/plan/confirm.do` carries every value
that will be submitted, each with an id:

`transactionId`, `planCode`, `#sumInsuredAmt`, `#basicPremiumAmt`,
`#allRiderAmount`, `#grossPremium`, `#annualPremium`, `#ncdPercentage`,
`#ncdAmount`, `#sstAmount`, `#stampDuty`, `#extraCoverageCode`,
`#extraCoverageSumins`, `#extraCoveragePremium`, `#vehicleRegNo`,
`#buyerRefIdCompanyROC`, `#mpaHiddenValue`, `insuranceType` (=`I`), `buyerRefId`,
`buyerCompanyROC`, `#mpaPlanType`.

Assert against these rather than the rendered panel when you care about what the
server receives.

### Optional coverage items — real ids, and the price is an attribute

Two tabs: `input#optionalCov[data-tab-name="#optional-coverage"]` and
`input#mpaCov[data-tab-name="#mpa-coverage"]` (classes `click` / `unclick`),
switching panels `#optional-coverage` / `#mpa-coverage`.

| Item | Checkbox | Price attribute | Amount label |
|---|---|---|---|
| Windscreen, Windows and Sunroof | `#windscreen` | `ratepercent="15.0"` | `#amtWindscreen` |
| Enhanced Inclusion of Special Perils | `#perils` | `amount="122.5"` | `#amtPerils` (`data-amount`) |
| Legal Liability to Passengers | `#liability` | `amount="33.75"` | `#amtLiability` |
| Betterment Buyback | `#betterment` | `amount="281.81"` | `#amtbetterment` |
| Legal Liability of Passengers for Negligent Acts | `#liabilityNegligentActs` | `amount="7.5"` | `#amtliabilityNegligentActs` |
| Strike Riot and Civil Commotion (SRCC) | `#srcc` | `amount="147.0"` | `#amtsrcc` |

The `amount` / `ratepercent` attribute is the expected price — read it instead of
regexing `RM…` out of the row. **The item list varies by insurer and plan**, so
discover which of these exist rather than assuming all six.

Each sits in `li.list-group-item`, wrapped as
`label.custom-checkbox > input + span.checkmark` — click the label, or set
`.checked` and dispatch `change`. `.moreInfo` buttons call `toggleText('windscreen')`
and reveal `#windscreenDesc` / `#perilsDesc` / etc.

**Windscreen has its own sum input:** `input#windscreenSumInsured[type=number]`,
default `1500.0`, `min="300.0"`, range text "(Min RM300.00 - Max RM9,800.00)", and
it starts **`disabled`** — it enables when the checkbox is ticked. Errors go to
`#windscreen-error-msg`.

**MPA tab:** `#sdpaCov` (onclick `sdpaLonpac()`), plan select `#dropMpaPlus`
(`R1`=PLAN 1, `R2`=PLAN 2, starts disabled), price `#dropMpaValue`, benefit tables
`#plan1Benefit` / `#plan2Benefit`, label `#planDesc`.

### Quotation panel — every money line has an id

`#coverType`, `#summarySumInsured`, `#premium` (Basic Premium), `#ncdAmt`,
`#driverDes` / `#allLicensedDriverAmt` (All Drivers), `#grossPremiumAmt` (Premium
After NCD), then per-item `#windscreenChecked` (+ `#windscreenSummary`),
`#perilsChecked`, `#liabilityChecked`, `#bettermentChecked`,
`#liabilityNegligentActsChecked`, `#srccChecked`, `#mpaPlusChecked` (+ `#mpaValue`,
`#mpaPlanTypeDesc`), `.deluxePlanQuotation`, then `#annualPremiumDis` (Gross
Premium), `#premiumAfterDiscount`, `#sstAmountDis`, `#stampDutyDis`, and
`#totalPrice` (Total Premium).

Per-item lines are `display:none` until their box is ticked — presence of the
element is not selection; check visibility.

Plan details block: Company, Insurance Plan (e.g. "Private Car Secure -
Comprehensive"), Total Sum Insured, Period of Insurance, Policy Excess, Compulsory
Excess. `#view-plan` (a `.dialog-btn`) opens the insurer's plan dialog.

Actions: `#backBtn`, **`#confirm-plan`** ("Make Payment"). The
"untick All Drivers" advisory content lives in `#alldriver-tick`.

## Step 3 — payment

`body#payment`, with `onload="noBack();"` and `onpageshow` re-arming it — **the
page actively defeats browser Back**. Use `#backBtn`, not `page.goBack()`.

| Field | Selector | Notes |
|---|---|---|
| Reference No | `#refNo` | text "Reference No: B68004339" |
| Mobile No | `#mobileNo` | required |
| **Email** | `#email` | required; format error `.is-invalid-email-format` |
| Address 1–3 | `#address1` / `#address2` / `#address3` | `maxlength=30` each |
| **Hire Purchase Loan** | `select#hirePurchase` | first option `value=""` "Select Bank" |
| Pay | `a#to-pay > button.payBtn` | "Pay Now" |
| Amount beside Pay | `#amount` | labelled "Price include Service Tax" |

`#email` and `#hirePurchase` retire two workarounds in
`scripts/eauto-e2e/pages/PaymentPage.ts:49-74`: finding the email field by
"whichever input's value contains `@`", and finding the bank select by "whichever
select has an option matching /select bank/i".

### Hire Purchase Loan is optional, and which bank you pick doesn't matter

- **Not required on the happy path.** The `*` marker is present but hidden
  (`<span class="required" style="display:none">`), so a purchase completes without
  choosing a bank. Individual tickets may require one — `scripts/eauto-e2e` always
  sets it because its scenario does — but don't carry that into the general flow.
- **The chosen bank has no downstream effect.** Any option behaves the same, so
  there is nothing to gain from enumerating the list or from picking a particular
  one. `[from QA team, 2026-08-14]`
- **Match the option loosely.** The list is long (hundreds of entries — banks,
  car dealers, finance companies, plus `OTHERS`) and the naming is inconsistent, so
  match on the distinctive word rather than a full label: *anything containing
  "ambank"* is AmBank. `[from QA team, 2026-08-14]`
- **Values are URL-encoded** — `value="MAYBANK+BERHAD"`,
  `value="AEON+CREDIT+SERVICE+%28M%29+BERHAD"`. Match on the **label**, never the
  value.

⚠️ **`CANDIDATE_BANKS` contains a name that cannot be matched.**
`scripts/eauto-e2e/data/config.ts:38` lists `'AmBank Berhad'`, but the live options
are `AMBANK (M) BERHAD` and `AMBANK ISLAMIC BERHAD` — there is no plain
"AMBANK BERHAD". `PaymentPage.ts:70-71` tries exact-lowercase equality then
`option.includes(bank)`, and `"ambank (m) berhad".includes("ambank berhad")` is
`false`. So with `E2E_BANK=random` this fails roughly one run in six: the dropdown
is left unset, only a warning is logged, and the later
"Details Hire Purchase == selected bank" check compares against a bank that was
never selected. **Loosen the match to the distinctive word** when that file is next
touched. `[verified: live HTML vs config.ts + PaymentPage.ts, 2026-08-14]`

Read-only on this page: Full Name, IC No, Postcode, City, State, and all vehicle
fields (Vehicle No, Engine No, Chassis No, Make, Model, Seating Capacity Including
Driver, Period of Insurance, Policy/Compulsory Excess, Vehicle Use, Capacity,
Year of Manufacturer). Plus Dealer and Dealer's Authorised Representative blocks.

Pricing ids: `#coverType`, `#summarySumInsured`, `#premium`, `#ncd`,
`#allLicensedDriver`, `#mpaChecked`, `#grossPremium`, the `*Checked` item lines
(here also `#accidentChecked`, `#unTowChecked`, `#ncdReliefChecked`,
`#liabilityPillionChecked`, `#accessoriesChecked`, `#extraMpaChecked`),
`#annualPremium`, `#premiumAfterDiscount`, `#sst`, `#stampDuty`,
`#roundingLabel`/`#rounding`, **`#platformDiscountLabel`/`#platformDiscount`**
("10% Gross Premium Discount"), `#totalNettPremium` (label) and **`#totalAmount`**.

Two dialogs to expect: `#proceed-payment-dialog` (`#paymentDialogMessage`) and
**`#pricing-changed-dialog`** (`#pricingChangedMessage`) — the price can change
between steps and the page says so. Any assertion comparing step 2 to step 3 must
handle that case rather than failing blind.

`[verified: live HTML from uat4, 2026-08-14]`

## Step 4 — confirm

Not captured yet — no actions on it in the sample. To be documented when that part
is automated.

## Steps 5–6 — the record pages

### Listing filters and the status vocabulary

`/view/ucd/insurance/enquiry`. Standard `#search-form` (see
[flow-ucd-shell.md](flow-ucd-shell.md)) — **rows appear only after `#to-search`**.
Status select is `select[name=status]`:

| Value | Label |
|---|---|
| *(empty)* | All |
| `DRAFT` | **Quotation** |
| `PENDING` | Pending Payment |
| `SUCCESS` | Insurance Created |
| `FAILED` | Failed |
| `APPROVAL` | Pending Approval |
| `EXPIRED` | **Quotation Expired** |

`select[name=insuranceCompany]` values: `RHB`, `Takaful`, `Chubb`, `Lonpac`,
`TokioMarine`. **Both selects carry `id="to-filter"`** — filter by `name`.

**This is the definitive status vocabulary, and `DRAFT` = "Quotation" is the state
EAINT-11864's reminder targets.** `[verified: live HTML, 2026-08-14]`

### Quotations expire after ~24 hours

Observed rows: created `18-06-2026 17:21` → remark `EXPIRED on 19/06/2026 17:21`;
created `18-06-2026 12:54` → `EXPIRED on 19/06/2026 12:54`. So a quotation is
valid for **24 hours to the minute**, then flips to `Quotation Expired` with the
expiry stamped in Remarks.

Consequence for EAINT-11864's dead-window test: a quotation generated at 23:30 is
still valid at the 07:00 cron run 7.5 hours later, so the scenario is viable. But
it also means a run that stalls a day produces an expired quotation and a
completely different expected result. Other observed remarks:
`Invalid Quotation number`.

### Listing columns

13 columns: `#`, Vehicle No, Reference No, Insured Name, Created Date, Insurance
Company, Payment Amount, Payment, JPJ, Status, E-Certificate No, Remarks, Action.
Status cell carries `.status`. Colour coding: green `#008E00` for OK/Accepted,
orange `#FF4000` for Failed/Rejected, black for `-`.

**The Action link carries the transaction id as an attribute:**
`a.to-view[data="ee5d5321-fa00-43c3-a1d3-7497e264d206"][title="to view B68004338"]`.
Read `data` to get the id for the details page — no URL scraping, no guessing.

Reference numbers look like `B68004338`; e-certificates vary by insurer
(`W24VP02455545KUL`, `V6872447`, `A6737919`, `D12697-23000026`,
`T73829X-26005036`), which is why `FIELD_RX.eCert` is deliberately loose. Created
Date is `dd-MM-yyyy HH:mm` — **no seconds**.

### Details page

`/view/ucd/insurance/enquiry/view.do?transactionId=<uuid>`. Field extraction is
still by label adjacency plus `FIELD_RX` body regexes
(`scripts/eauto-e2e/pages/TransactionEnquiryPage.ts:70-108`) — this page's HTML
hasn't been captured yet, so those remain the best available handles. It carries
E-Certificate No/Policy No, Submission Status to JPJ, Date Issue, Insurance
Company, Insurance Plan, Full Name, IC No, Email, Vehicle No, Vehicle Use,
Capacity, Cover Type, Hire Purchase (User Submission), Sum Covered, Total Nett
Contribution After Discount.

Both record pages **refresh and retry** — listing up to 4 attempts, details up to 3
— because status and JPJ resolve progressively on staging.

## Paying is a click, and you can come back to it later

### Payment in eAuto is a simple click

**No gateway, no bank login, no TAC, no QR.** The insurance payment step is the
same shape as the eSTM flow's payment step: a button, its confirmation popups,
then the completion page. **QR payment is not implemented in eAuto at all**, and
when it lands it will belong to one module rather than the platform — so do not
write gateway-driving code against an eAuto payment step unless the ticket
explicitly says that module has one. `[from Faizuddin, 2026-08-18]`

The FPX / Fiuu chain in `scripts/secarang-insurance` is for modules that
genuinely redirect to a gateway (Secarang, UCD onboarding) — see
[eauto-payments.md](eauto-payments.md).

### Resuming an unpaid quotation from the listing

EAINT-11864 TS04's journey: drop out at step 3, wait, then come back through the
**Insurance Transaction Listing** and finish the payment there. That is a real
entry point into step 3, distinct from walking the steps forwards.

**Corrected 2026-08-18.** The row an unpaid step-3 stop leaves behind renders
status **`PENDING`** ("Pending Payment"), not `DRAFT` ("Quotation") — a live
capture settles it:
`_reference/html/eauto/insurance-listing-pending-payment-row.html`. Its Action
cell carries both the transaction id and the real resume control:

```html
<a href="#" class="to-view" data="<uuid>" title="to view B68004346">View</a>
<a href="#" class="to-payment" data="<uuid>" title="to payment B68004346">Resubmit</a>
```

**`a.to-payment[data="<uuid>"]`, labelled "Resubmit", is the resume control.**
`[verified: live HTML, 2026-08-18]` `scripts/eauto-quotation-reminder/pages/
InsuranceListingPage.ts` matches it explicitly (ahead of the earlier, unverified
guesses it still keeps as a fallback for a differently-labelled control on some
other status). `RESUMABLE_STATUSES` in that file is `[DRAFT, PENDING]` — treat
either as "this run left something for the cron/for resuming", since it's
unconfirmed whether `DRAFT` is ever what a step-3 stop actually produces (the
capture only proves `PENDING` is).

**`resumeToPayment()`'s row lookup didn't retry, and that cost a real run.**
`hasQuotation()` above already retries its search up to 4 times, 2s apart,
because the step-3 row can commit server-side a beat after the page that wrote
it moves on (the same race `InsuranceStepsPage.expectStep(3)`'s settle wait
guards from the writing side). `resumeToPayment()`'s own lookup did a single
search with no retry — with `QR_DROP_OFF_SECONDS` defaulting to 10s, a run
could land at the listing right in that gap, find no resumable row, throw, and
the test would fail right there: reads as "it gave up at the listing without
buying," reported 2026-08-19 as TS04 stopping at step 3 and closing without
completing the purchase. Fixed by giving `resumeToPayment()` the same
4-attempt retry as `hasQuotation()`. `[from Faizuddin, 2026-08-19]`

### A purchase consumes the vehicle number

TS04 buys, so its vehicle number is spent afterwards: the eSTM leg needs a fresh
one every run (a vehicle already carrying a transaction hits
`#duplicate-transaction-msg`), and so does the quote.

### The eSTM and the quote must share an IC, not just a vehicle number

The eSTM's buyer identity comes from the **bypass slot**, not from anything the
run passes in — so the IC to quote with is the slot's, and quoting with a
different one silently means the approved eSTM does not apply to the person
quoted. `scripts/eauto-estm` prints it as `BUYER_IC:<ic>` from `#refId` on its
payment step; the quotation-reminder suite reads that line and prefers it over
the IC it was configured with. `[verified: scripts/eauto-estm/pages/PaymentPage.ts]`

## Pricing rules

| Rule | Where |
|---|---|
| Gross = Contribution After NCD + optional add-ons | step 2 |
| Service Tax ≈ **8%** of Gross | step 2 |
| Total = Gross + Tax + Stamp Duty | step 2 |
| Total Nett = Gross + Tax + Stamp − **10%** of Gross (`#platformDiscount`) | step 3 |
| Step 4 amount paid = step 3 Total Nett | step 4 |

`[verified: asserted green by scripts/eauto-e2e]`

Not every insurer shows a 10% discount line — hence the `priceIncludeTax`
fallback in `FIELD_RX`. **Do not derive these formulas from the captured step-3
sample**: its numbers (Basic 2,000.00 / NCD 2% −5.00 / Gross 1,995.00 / SST 10.00 /
discount −202.50 / total 1,822.50) don't reconcile with each other or with the
step-2 page from the same session, so treat that page's *values* as placeholder and
only its *ids* as fact. See also [eauto-insurance.md](eauto-insurance.md).

## Preconditions and test data

- **An approved eSTM for the purchase leg only** — see the split at the top of this
  file. A quotation-only run needs none.
- **Vehicle number and IC are required** and never hardcoded to a real vehicle —
  the run fails early without them (`E2E_VEHICLE_NO`, `E2E_IC`).
- A completed purchase **consumes** the vehicle number; a full run needs a fresh
  one. `E2E_STOP_BEFORE_PAYMENT=1` stops before Pay Now, creating nothing.
- Staging is shared and persistent — see [eauto-portals.md](eauto-portals.md).

## Traps

| Symptom | Cause |
|---|---|
| `"Unable to retrieve your vehicle information"` | VN not resolvable by the e-simulator — try another VN |
| Quote form never renders | staging / e-simulator unresponsive; the script throws rather than continuing |
| No `.plan-container` after Show My Result | no insurer offered that vehicle |
| Select blocked with a transmission/variant message | capacity/transmission/variant selects present and unset — set them and click `#update` |
| Card locators suddenly stale | a sum-insured change replaced `#planList` |
| Payment never reaches `complete.do` within 75s | **NCD / underwriting referral loop** — known for some VNs, try another |
| Price differs between steps | legitimate — `#pricing-changed-dialog` |
| Listing empty | you didn't click `#to-search`, or the purchase didn't land |
| Preferred insurer silently not used | `eauto-e2e` warns and falls back to the first card — not a failure |
| Clicks intercepted | popup chain (suppress via localStorage) or the "Working…" overlay |

## Cross-page verification — the reusable part

`tests/insurance-e2e.spec.ts` captures a snapshot per page into `snap`, then
asserts the same logical field agrees across surfaces: Cover Type, Owner IC,
Vehicle No, Plan, E-Certificate No, Reference No, Sum Covered. Money compares with
`approxEq(a, b, 0.01)`, text with `norm()`, cover type with `normalizeCover()`
(→ `COMPREHENSIVE` / `TPFT` / `PRIVATE CAR (ENHANCED)`). Mismatches report **every**
value, not just a boolean.

This is the in-repo precedent to extend for multi-source comparison work — see
[data-verification-standard.md](data-verification-standard.md). What it lacks: a
`blocked` verdict distinct from fail, and contracts held as data rather than inline
in the spec.

## What is NOT covered

- **Step 4 (Confirm)** HTML — not captured yet.
- **Insurance details page** HTML — not captured; still regex-driven.
- The banner and email-link entry points.
- ~~**The quotation-only stop.**~~ **ANSWERED 2026-08-17:** neither
  `#to-show-result` nor `.select-plan-btn` persists it — **the quotation is
  generated at step 3**. Stopping at step 1 or 2 leaves no listing row at all,
  yet the reminder email is still sent, by a backend drop-off detector with no
  UI. So the listing is not observable for those cases and **Mailtrap is the
  only validation**. See [eauto-insurance.md](eauto-insurance.md),
  "The quotation is generated at STEP 3". `[from QA team, 2026-08-17]`
- BO-side and CIBO views — see [cibo.md](cibo.md).
- Renewal, cancellation, refund, failed-payment paths.
- Sub-UCD vs Main-UCD differences, which EAINT-11864 needs.
