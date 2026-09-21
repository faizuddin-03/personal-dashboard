# Flow — the UCD portal shell (home, nav, popups, listings)

Every UCD page shares the same chrome: header nav, the startup popup chain, the
listing/filter pattern, the label/value markup, the session timer. Learn it once
here instead of rediscovering it per module.

`[verified: live page source captured 2026-08-14 from one run — UCD home, Insurance
main, Insurance listing, Get Free Quote, Insurance steps 1-3, eSTM home, eSTM
listing, eSTM details. The env that run happened to use is not "the" env; see
[eauto-portals.md](eauto-portals.md) § Never tie an environment to a general rule]`

## Entry points

There is one way in, and everything else is downstream of it:

| Entry | Status |
|---|---|
| `/<env>/public/login/` → lands on `/<env>/view/ucd/home(.do)?` | **Verified** — the only entry to the whole portal |
| Header nav buttons (`#home-link`, `#insurance-link`, …) | **Verified** — available from every page once logged in |
| A deep link to any `/view/ucd/...` page | **Verified**, but redirects to login when the session is gone, so treat login as a precondition rather than assuming the URL lands |

Login behaviour — the redirect chain and why a `goto()` can race it — is in
[eauto-portals.md](eauto-portals.md) § Login redirect chain.

## The single most useful automation fact: suppress the popups via localStorage

The home page runs a **dialog chain**, not independent popups. On `ready` it walks
`dialogSelectorOrder` and opens **only the first** dialog whose flag is set;
closing that one calls `findNextDialog()`, which opens the next. So clicking one
close button can reveal another, which is why blind close-retry loops are flaky.

```js
var dialogSelectorOrder = [
  "#dialog-websocket", "#dialog-eastcoast", "#dialog-merdeka-campaign",
  "#profile-updates-dialog", "#dialog-einvoice", "#dialog-cny-campaign",
  "#dialog-raya-campaign"]
```

Each is gated on a **localStorage flag**, so the reliable move is to set them all
before the page loads (`addInitScript`) and never see a popup at all:

| localStorage key | Suppress with | Note |
|---|---|---|
| `dialog-websocket` | `"false"` | Chrome-migration announcement |
| `dialog-eastcoast` | `"false"` | |
| `homemerdekacampaign` | `"false"` | campaign, changes per season |
| `homerayacampaign` | `"false"` | campaign |
| `homecnycampaign` | `"false"` | campaign |
| `homeEInvoiceReminder` | `"false"` | e-Invoice profile reminder |
| `homeAnnouncement` | `"false"` | opens unless flag `!= "false"` |
| `homeStmsCancellationReminder` | `"false"` | opens unless flag `!= "false"` |

Note the asymmetry: the campaign/websocket flags open only when **`=== "true"`**,
while `homeAnnouncement` and `homeStmsCancellationReminder` open unless
**`!= "false"`** — i.e. those two default to *showing*. Set both explicitly.

⚠️ **Correction, 2026-08-18: suppression does NOT work for
`homemerdekacampaign` / `homerayacampaign`.** The dialog-chain script itself
sets both to `"true"` **unconditionally, on every page load** —
`localStorage.setItem("homerayacampaign", true)` runs regardless of what an
`addInitScript` set beforehand, so pre-setting `"false"` for these two
specifically is overwritten before the same script reads it back.
`[verified: live HTML, 2026-08-18 —
_reference/html/eauto/home-with-merdeka-and-raya-banners.html]` Everything
else in the table above is unaffected. For these two, `dismissBanners()` /
`closeBanners()` (actively clicking closed) is the only defence — and it has
to run after **every** navigation that can trigger the chain, not just the
first one: it fires on the UCD home page and again on the Insurance page (and
presumably any other page sharing this header), so an insurance flow sees both
banners **twice** if only the post-login call is made.

**Suppression is the house approach for everything else; clicking is required
here.** `[from QA team, 2026-08-14 — follow the live HTML]` The selectors below
come from the live source,
so use them when you genuinely have to close a dialog rather than prevent it. For
banners on the *transaction* pages — which the localStorage keys (all named
`home*`) do **not** cover — the class-prefix escalation in
[flow-estm.md](flow-estm.md) § Traps still applies.

Close buttons, if you must click:

| Dialog | Close selector |
|---|---|
| `#dialog-websocket` | `#dialog-websocket #eautoCloseBtn` |
| `#dialog-eastcoast` | `#dialog-eastcoast #dialog-eastcoast-close-btn` |
| `#dialog-einvoice` | `#dialog-einvoice #close-dialog` |
| `#dialog-raya-campaign` / `#dialog-merdeka-campaign` | `#dialog-campaign-close-btn` — **duplicated id, see traps** |
| `#dialog-stms-cancellation-reminder` | jQuery UI dialog, button `Tutup`, or `#close-dialog-stms-cancellation-reminder` |
| `#profile-updates-dialog` | jQuery UI dialog, button `OK` |

`jQueryDialogMap` records which are jQuery UI dialogs (`.dialog('open')`) versus
plain `.show()` divs — currently only `#profile-updates-dialog` is a true jQuery UI
dialog in that chain. jQuery UI ones need their buttons clicked in
`.ui-dialog-buttonpane`, not a close `span`.

## Home dashboard — the module tiles

`/<env>/view/ucd/home` (also `home.do`). Tiles are `button.dashboard-menu-item-btn`
inside `.dashboard-menu-item`.

| Tile | Handle | Destination |
|---|---|---|
| STMS | inline `onclick` | `/view/ucd/stms/view.do` |
| UCD TO UCD | inline `onclick` | `/view/ucd/stms/interstate/ucd-view.do` |
| APT | `#APT` | `/view/ucd/apt/enquiry/` |
| eSERAHAN | `#ESTM` | T&C gate → `/view/ucd/estm/view.do` |
| BMK | `#bmk` | `/view/ucd/bmk/view.do` |
| **INSURANCE** | `#insurance` | `/view/ucd/insurance` |
| JOMCHECK REPORT | `#jomcheck` | `/view/ucd/jomcheck/view.do` |
| SERVICE HUB | `#servicehub` | `/view/ucd/service-hub/view.do` |
| eVOC | `#evoc` | **disabled** (`.disabled`) |
| LKM REFUND | *(no id)* | **disabled**, "coming soon" |
| COMPANY/BUSINESS PROFILE | `#company-business-profile` | `/view/ucd/einvoice/view.do` (main user) else profile dialog |
| SETTINGS | `#setting` | `/view/ucd/settings/view.do` |
| REPORTS | `#report` | `/view/ucd/report/view.do` |

Header nav (present on every page, `#header #home-bar`): `#home-link`,
`#insurance-link`, `#reports-link`, `#settings-link`, `#user-guide-link`,
`#download-link`, `#contact-link`. Logout is `#header a.logout` → jQuery UI
confirm (`No`/`Yes`).

### Two tiles are gated behind a T&C dialog on first use

- **eSERAHAN (`#ESTM`)** — `POST /ajax/ucd/estm/transaction/check-eClassified.do`.
  `"true"` → straight to `/view/ucd/estm/view.do`. Otherwise the eClassified T&C
  dialog opens: checkbox `input.terms` inside `#allow-estm-dialog`, and
  **`div.ui-dialog-buttonpane` is hidden until the checkbox is ticked**. `I Accept`
  → `POST /ajax/ucd/estm/transaction/allow-eClassified.do`.
- **eAuto Digits Marketplace / Wholesale** — `window.wholesaleTileClick()` →
  `POST /api/ucd/wholesale/check-tnc.do` returning `ACCEPTED` (→
  `/view/ucd/wholesale/home.do`, EAINT-11872's two-tile hub), `NEEDS_ACCEPT` (→
  T&C dialog `#wholesale-tnc-dialog`, checkbox `input.wholesale-tnc-terms`, PDF
  iframe `#wholesale-tnc-pdf` lazy-loaded from `data-src`, accept →
  `POST /api/ucd/wholesale/accept-tnc.do`), or anything else (→ sub-user onboard
  notice `#wholesale-onboard-dialog`).

Same hidden-buttonpane trick appears in the Insurance permission T&C
(`#allow-insurance-dialog`). Treat "buttons missing" as "consent not ticked yet".

### Other home-page bits

- Pending-payment banner `#totalCount`, filled by
  `GET /ajax/apt/transaction/countAptPayment.do` (hidden until it returns).
- Blocking error dialogs, all of which redirect to home on OK:
  `#dialog-estm-access-denied`, `#dialog-txn-forbidden` (JPJ blacklisted),
  `#dialog-txn-block-422` (owner record missing), `-422b`, `-422c`/`-422d`
  (MyKad under 18), `#ic-null-dialog`, `#dialog-bmk-no-permission`,
  `#dialog-insurance-not-add-as-user`, `#dialog-permission-access-denied`.
- A `#to-buy-insurance` **handler** exists on home (→
  `/view/ucd/insurance/quote/view.do?transactionId=`, with the id left empty) but
  no matching element appears in the dashboard markup — looks like a leftover.
  Don't rely on it; the eSTM payment step has its own `#to-buy-insurance` that
  goes somewhere different (see [flow-estm.md](flow-estm.md)). `[unconfirmed]`

## Session timeout

`LoginSessionTimer.startCountdown()` on every page, with
`#countdown-screen-timeout` and `#session-timeout-dialog`. On uat4 the observed
counter starts around **1439:5x**, i.e. ~24 hours — long enough that an overnight
run won't be logged out mid-flow, but confirm per environment before relying on it.

## The listing/filter pattern (identical on eSTM and Insurance)

**Nothing renders until you search.** `#empty-state` says "Please apply search to
show the record." — so an automation that navigates to a listing and immediately
scrapes rows finds nothing and looks like a data bug.

```
form#search-form
  input#vehicleNo[name=vehicleNo]
  input#refNo[name=refNo]              ← labelled "Transaction No"
  input#fromDate / #toDate             ← readonly jQuery UI datepickers
  input#paymentFrom / #paymentTo
  select[name=status]                  ← see per-module vocab below
  button#to-search      "Search Now"
  button.to-reset       "Reset"
  input[type=hidden][name=pageNo]
```

Results: `table.custom-table`, header `tr.header`, rows `tr.odd` / `tr.even`,
pagination `.pagination`. Date inputs are `readonly` — **fill them by value or via
the datepicker, a plain `fill()` on a readonly input fails**.

## Reading label/value data — two different markups

Neither is a `<dl>`, and they differ by page family. Match the one you're on:

- **Detail pages (eSTM details, newer UI):** `div.flex.flex-row` containing
  `h6.label` (or `h6.trx-details-label`) + `h6.data`, with width classes
  `w-40`/`w-60`/`w-50`. Selecting the `.data` sibling of a `.label` whose text
  matches is exact and fast.
- **Insurance step pages:** plain `<table>` with `<td>Label:</td><td><b>value</b></td>`,
  *plus* — much better — **ids on nearly every value** (see
  [flow-insurance-purchase.md](flow-insurance-purchase.md)).

Prefer ids where they exist. `BasePage.extract()`'s generic label-adjacency scan
(`scripts/eauto-e2e/pages/BasePage.ts`) is a fallback for pages that have neither.

## Traps in the shared markup

1. **Duplicate ids are everywhere.** The HTML is invalid and `#id` selectors
   silently take the first match:
   - `#to-filter` on **both** the Status and Insurance Company selects (insurance
     listing) — use `select[name=status]` / `select[name=insuranceCompany]`.
   - `#vehicleCategory` on **both** the Individual and Company radios (Get Free
     Quote) — use `input[name=vehicleCategory][value=company]`.
   - `#sumInsuredValue` on **every** insurer card's dropdown (insurance step 1) —
     use `select[name=sumInsuredValue][plancode="Lonpac"]`.
   - `#dialog-campaign-close-btn` on both campaign dialogs — and it isn't just
     a selector-writing footgun, it broke `dismissBanners()`/`closeBanners()`
     themselves. `.locator('#dialog-campaign-close-btn').first()` always
     resolves to Raya's copy (first in DOM order, `display:none`) even while
     Merdeka's identical-id button is genuinely visible; `.isVisible()` on that
     stale match reports false and the whole dismiss loop gives up thinking
     nothing is showing. Fixed 2026-08-18 in both
     `scripts/eauto-quotation-reminder/pages/BasePage.ts` and
     `scripts/eauto-insurance/pages/BasePage.ts` by appending Playwright's
     `:visible` pseudo-class to every closer/container selector before calling
     `.first()`, so the filter picks a rendered element rather than a DOM-order
     one. `scripts/eauto-estm/utils/session.ts`'s `closeBanners()` has the same
     shape of bug but was left untouched — see [[dont-touch-working-automation]].
   - `#custom-dialog` / `#custom-field` appear twice at the end of every `<body>`.
   - `#checkboxForm` on several consent forms.
   **Rule: prefer `name=` or an attribute-scoped selector over `#id` on these
   pages, and never assume `#id` is unique.**
2. **Buyer/insured names are truncated in listings.** The eSTM listing shows
   `MUHAMMAD FAIZUD` and `TEST FAIZ SDN B` — **15 characters**. A cross-surface
   name comparison must compare a prefix, or read the name from the details page
   instead. This one would silently fail an "identical across pages" assertion.
3. **Real checkboxes and radios are hidden behind styled spans.** Patterns:
   `label.custom-checkbox > input + span.checkmark`, and
   `label > input[style="display:none"] + span.label.custom-radio`. Clicking the
   `input` does nothing visible; click the label/span, or set `.checked` **and
   dispatch `change`**.
4. **Timestamp formats differ per surface.** Listings render `14-08-2026 11:07`
   (24h, no seconds); eSTM details renders `14-08-2026 10:33am` (12h + meridiem).
   Normalise before comparing — and note **no surface shows seconds**, which
   matters for EAINT-11864's minute-boundary scenarios.
5. **Uppercase button text is CSS, not markup.** `text-transform: uppercase` means
   the DOM text is `Get a Free Quote` while the screen reads `GET A FREE QUOTE`.
   Case-insensitive matching works; an exact-case match against the screenshot
   does not.
6. **`.do` endpoints live under both `/view/` and `/ajax/`.** Some navigations go
   to an `/ajax/...do` URL as a full page load (insurance step 2 does). Don't
   assume `/ajax/` means XHR.

## What is NOT covered

- **Login itself** — see [eauto-portals.md](eauto-portals.md).
- **The BO portal shell.** This file is UCD-side only; BO has its own nav and its
  own quirks.
- **Modules behind their tiles** other than eSTM and insurance: STMS, UCD-to-UCD,
  APT, BMK, JomCheck, Service Hub, Wholesale, Settings, Reports, eVOC. The tile
  handles and destinations are listed above; nothing past the tile is documented.
- **The disabled tiles** (eVOC, LKM Refund) — no behaviour to record yet.
- **Whether the localStorage suppression works outside the home page.** The flags
  are all named `home*`; banners on transaction pages are handled the harder way in
  [flow-estm.md](flow-estm.md) § Traps. `[unconfirmed]`
- **The session timeout dialog's actual behaviour** — the elements are listed, but
  no run has sat long enough to see it fire.
