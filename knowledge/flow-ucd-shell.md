# Flow — the UCD portal shell (home, nav, popups, listings)

Every UCD page shares the same chrome: header nav, the startup popup chain, the
listing/filter pattern, the label/value markup, the session timer. Learn it once
here instead of rediscovering it per module.

`[verified: live page source captured 2026-08-14 from one run — UCD home, Insurance
main, Insurance listing, Get Free Quote, Insurance steps 1-3, eSTM home, eSTM
listing, eSTM details. The env that run happened to use is not "the" env; see
[eauto-portals.md](eauto-portals.md) § Never tie an environment to a general rule]`

Saved captures behind this file (added 2026-10-16):
`_reference/html/eauto/ucd-home-page-uat1-2026-09-24.html` (UCD home, then the
Settings page, then Manage Branches — three pages, one per line 15/16/17) and
`_reference/html/eauto/home-with-merdeka-and-raya-banners.html` (UCD home with a
campaign banner open, 2026-08-18). **`_reference/html/eauto/ucd-home-hub-admin.html`
is not a UCD page** — it is the BackOffice home (`/home/`, Hub Admin); see
[flow-bo-shell.md](flow-bo-shell.md). The Service Portal shell is in
[flow-service-portal-shell.md](flow-service-portal-shell.md).

## Login, landing and logout

1. Login page `/<env>/public/login/` is shared with BO; role decides the landing. `[verified: tests/service-hub/utils/config.ts · PATHS.login; scripts/eauto-jomcheck/data/users.ts:13-14]`
   No capture of the login page exists; selectors are in [flow-bo-shell.md](flow-bo-shell.md) §2 (same page).
2. UCD lands on `/<env>/view/ucd/home.do` (title "Welcome to eAuto"). `[verified: tests/service-hub/pages/LoginPage.ts:39 · toHaveURL(PATHS.ucdHome); _reference/html/eauto/ucd-home-page-uat1-2026-09-24.html · <title>]`
3. A browser gate runs before login completes: bowser detects Firefox older than 36.0.4 and redirects to `/<env>/public/login/unsupported-browser.do?version=<v>`. Chromium is not gated. `[verified: ucd-home-page-uat1-2026-09-24.html · inline script after bowser-2.3.0.es5.min.js]`
4. Logout: `#header a.logout` opens jQuery UI dialog `#logout-confirmation` ("Sure to logout?") with buttons `No` (`.cancel-dialog-btn`) and `Yes` (`.confirm-dialog-btn`) → `/<env>/user/logout.do`. `[verified: ucd-home-page-uat1-2026-09-24.html · $("#header a.logout").click]`
   This differs from BO and the Service Portal, which use a native `confirm()`. Automation can load `/user/logout.do` directly. `[verified: scripts/eauto-jomcheck/pages/LoginPage.ts:69-75]`

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

⚠️ **That array is the order in one capture, not a fixed rule.** Which campaign
popups exist, and their order, change with the season and the celebration; the
array is rewritten per campaign. Never assert a fixed popup order across campaigns —
take the order from the current campaign ticket. `[from Faizuddin, 2026-10-16]`
Examples of per-campaign orders the CR scripts expected, each true only for its own
campaign:

1. "Web Socket (1st) ➡️ … campaign popup (2nd)" `[from SharePoint TS #005 EAINT-10053, sheet EAINT-10053, row 8]`
2. "Web socket (1st) ➡️ Merdeka 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)"
   `[from SharePoint TS #024 EAINT-11925, sheet EAINT-11925, row 14]`
3. "East Coast popup (1st) ➡️CNY 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)"
   `[from SharePoint TS #100 EAINT-9559, sheet EAINT-9559, row 9]`
4. "1. Web Socket popup 2. East Coast Popup 3. CNY Campaign 4. Company Update Popup (if
   available)" `[from SharePoint TS #102 EAINT-9564, sheet Popup display, row 11]`
5. Hari Raya: campaign popup before Company Profile Update
   `[from SharePoint TS #101 EAINT-9560, sheet EAINT-9560, row 14]`
6. TNG winners popup "should be the last popup" `[from SharePoint TS #068 EAINT-8564, sheet EAINT-8564, row 8]`

So the CNY/Raya scripts placing the campaign popup before Company Profile Update and
the capture above placing `#profile-updates-dialog` before `#dialog-cny-campaign` /
`#dialog-raya-campaign` are not a conflict — they are different campaigns' arrays.
For automation this changes nothing: the chain still opens one dialog at a time, so
suppress the flags or close whatever is visible, without depending on the order.

### Campaign popup behaviour the scripts test

1. **Bilingual switch:** "popup in English is shown first by default" and "Interval
   between English and Chinese is 7 seconds".
   `[from SharePoint TS #005 EAINT-10053, sheet EAINT-10053, row 4]` `[from SharePoint TS #024 EAINT-11925, sheet EAINT-11925, row 4]`
2. **Once per login:** "popup is not displayed whenever redirected back to Homepage"
   `[from SharePoint TS #005 EAINT-10053, sheet EAINT-10053, row 6]`; also not shown
   again on the Insurance module page `[from SharePoint TS #024 EAINT-11925, sheet EAINT-11925, rows 8-9]`.
3. **East Coast popup:** shown only to East Coast HQ or branch UCDs; "not showing EC
   popup on 31st day". `[from SharePoint TS #102 EAINT-9564, sheet Popup display, rows 4-14]`
4. **Firefox → Chrome announcement (EAINT-12180):** Firefox only, after every login;
   title "Announcement 公告"; text "Support for Mozilla Firefox will officially end on
   31 December 2026. Effective 1 January 2027, all users are required to use Google
   Chrome when accessing the eAuto system." Not shown on Chrome.
   `[from SharePoint TS #036 EAINT-12180, sheet Scenario Testing, rows 3, 9, 17; sheet Functional Testing, rows 6-7]`
   Whether this is the `#dialog-websocket` entry above or a separate dialog is
   `[unconfirmed]` — no capture after EAINT-12180 exists.

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

⚠️ **During a campaign, suppression does NOT work for the campaign flags.**
In the 2026-08-18 capture the chain script ran
`localStorage.setItem("homerayacampaign", true)` and
`localStorage.setItem("homemerdekacampaign", true)` **unconditionally on every
page load**, overwriting an `addInitScript` "false" before the same script read it.
`[verified: _reference/html/eauto/home-with-merdeka-and-raya-banners.html lines 324-325]`
The 2026-09-24 capture has **no** force-true lines: the script goes straight from
the "Setting it to false to temporarily disable the dialog" comment to the
`=== "true"` checks, and both campaign divs are `display: none`.
`[verified: _reference/html/eauto/ucd-home-page-uat1-2026-09-24.html line 15 · dialog-chain script]`
So the forcing is switched on per campaign, not permanent. Rule: pre-set the flags
**and** run `dismissBanners()` after **every** navigation that loads this header
(UCD home, Insurance, and any page sharing it) — during the 2026-08-18 campaign
an insurance flow saw both banners **twice** when only the post-login call was made.

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

Tile markup and destinations re-confirmed on 2026-09-24: STMS, UCD TO UCD, APT
and SERVICE HUB carry inline `onclick="window.location='/<env>/view/ucd/...'"`;
eSERAHAN, BMK, INSURANCE, JOMCHECK REPORT, COMPANY/ BUSINESS PROFILE, SETTINGS,
REPORTS are id-only (handler in script); eVOC and LKM REFUND carry
`.dashboard-menu-item-btn.disabled`. **No Wholesale / Digits Marketplace tile is
present in that capture** (no `wholesaleTileClick` either), although the Wholesale
T&C dialogs (`#wholesale-tnc-dialog`, `#wholesale-onboard-dialog`,
`#wholesale-tnc-success-dialog`) are in the markup. The tile is probably
account- or rollout-dependent. `[verified: ucd-home-page-uat1-2026-09-24.html · button.dashboard-menu-item-btn; unconfirmed: why the tile is absent]`

Header nav (present on every page, `#header #home-bar`) — all are
`button.tab-button1`, not links:

| Button | Text | Destination |
|---|---|---|
| `#home-link` | HOME | inline `onclick` → `/<env>/view/ucd/home` |
| `#insurance-link` | INSURANCE | script → `/<env>/view/ucd/insurance` |
| `#reports-link` | REPORTS | script → `/<env>/view/ucd/report/view.do` |
| `#settings-link` | SETTINGS | script → `/<env>/view/ucd/settings/view.do` |
| `#user-guide-link` | USER GUIDE | inline → `/<env>/view/ucd/user-guide` |
| `#download-link` | DOWNLOAD | inline → `/<env>/view/ucd/download` |
| `#contact-link` | CONTACT US | inline → `/<env>/view/ucd/contact` |

`[verified: ucd-home-page-uat1-2026-09-24.html · #home-bar buttons and $("#settings-link").click etc.]`

`table#common-bar`: `td.page-title` (set from `<title>` by script), `span.user-name`
"<NAME> (RHB:<account no>-Active)", `a.logout`. A commented-out APT-pending
`<marquee>` sits there too. `[verified: same file]` Logout behaviour is in
§ Login, landing and logout above.

### Settings page sub-menu

`/<env>/view/ucd/settings/view.do`, breadcrumb "Home / Settings". Four tiles:

| Tile | Destination |
|---|---|
| MANAGE BRANCHES (`#manage-branches`) | `/<env>/view/ucd/settings/account/` — "Home / Settings / Branch Listing", Company/Branch and State filters |
| CONFIRMATION OF REGISTRATION | `/<env>/view/ucd/settings/confirmation-of-registration/view.do` |
| MANAGE USERS (`#manage-users`) | `/<env>/view/ucd/settings/user/` |
| ACCOUNT ACTIVATION (`#account-activation`) | `/<env>/view/ucd/settings/account-activation/` |

`[verified: ucd-home-page-uat1-2026-09-24.html line 16 (settings) and line 17 (branch listing)]`
No flow doc covers these pages yet.

### Footer and version markers

`div.footer` (class, not id, on UCD): "Best Compatible With Mozilla Firefox V36.0.4",
"Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.", Contact Us |
Terms & Conditions | Privacy (`window.open('/<env>/public/contact-us.jsp' …)`),
logo `eAuto_TM_logo.svg`. No build number. `[verified: ucd-home-page-uat1-2026-09-24.html]`
A mock Google Tag Manager script at the top of `<head>` logs
"staging.eauto.my - GTM at: <timestamp>" to the console — a staging marker, not a version. `[verified: same file, first <script>]`

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
- **Transaction Restriction popup (EAINT-9044):** a restricted UCD that tries to
  create a transaction sees "You are currently restricted from creating
  transactions. Please contact eAuto at 03-27798899."
  `[from SharePoint TS #089 EAINT-9044, sheet E2E Scenarios - eSTM, row 2]`
  The restriction is set per company in BO — see [flow-bo-shell.md](flow-bo-shell.md).
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
pagination `.pagination` — verbatim: `<div class="pagination"><span class="current prev">Prev</span><span class="current">1</span><a href="#">2</a>…<a href="#" class="next">Next</a></div>`; the current page and a disabled Prev are `span.current`, other pages are `a[href="#"]`
`[verified: _reference/html/eauto/estm-listing-with-approved-row.html line 341]`. Date inputs are `readonly` — **fill them by value or via
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
     Current state of the three dismiss helpers (verified 2026-10-16):

     | Helper | Visibility check | Effect with Raya hidden + Merdeka visible |
     |---|---|---|
     | `scripts/eauto-jomcheck/pages/BasePage.ts:166-240` `dismissBanners()` | `:visible` appended to every container and closer (167-170), then `.first().count()` | Clicks Merdeka's own close button; its `closeDialog()` runs, sets the flag and opens the next dialog in the chain |
     | `scripts/eauto-12107/pages/BasePage.ts:166-240` `dismissBanners()` | identical to eauto-jomcheck (diff of 160-240 is empty) | same |
     | `scripts/eauto-estm/utils/session.ts:62-156` `closeBanners()` | `.first().isVisible()` with no `:visible` filter (77, 91, 98) | Container check passes (Merdeka's `img.dialog-campaign-1` is first), but `#dialog-campaign-close-btn`, `.close-btn` (first is `#dialog-eastcoast-close-btn`) and the `×` span all resolve to hidden copies. Falls through to Escape + force-hide by style (127-148). The banner disappears, but `closeDialog()` never runs, so the flag is not cleared and the next chain dialog never opens `[inferred from code + home-with-merdeka-and-raya-banners.html markup]` |

     The "silent no-op" form of the trap (helper returns 0 with a banner on screen)
     happens when the **container** check also uses `.first()` without `:visible`
     and the first match is hidden — the pre-2026-08-18 insurance and
     quotation-reminder helpers.
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

- **The login page DOM** — never captured; selectors come from code
  ([flow-bo-shell.md](flow-bo-shell.md) §2). Redirect behaviour is in
  [eauto-portals.md](eauto-portals.md).
- **The BO and Service Portal shells** — see [flow-bo-shell.md](flow-bo-shell.md)
  and [flow-service-portal-shell.md](flow-service-portal-shell.md).
- **The Reports page** (`/view/ucd/report/view.do`) and the Settings sub-pages
  past their tile destinations.
- **UCD date-range error text.** The one-month default applies
  ([quirks.md](quirks.md) § Dates); no UCD capture shows its message.
- **Modules behind their tiles** other than eSTM and insurance: STMS, UCD-to-UCD,
  APT, BMK, JomCheck, Service Hub, Wholesale, Settings, Reports, eVOC. The tile
  handles and destinations are listed above; nothing past the tile is documented.
- **The disabled tiles** (eVOC, LKM Refund) — no behaviour to record yet.
- **Whether the localStorage suppression works outside the home page.** The flags
  are all named `home*`; banners on transaction pages are handled the harder way in
  [flow-estm.md](flow-estm.md) § Traps. `[unconfirmed]`
- **The session timeout dialog's actual behaviour** — the elements are listed, but
  no run has sat long enough to see it fire.


## Additions from the 2026-10-23 flows study

Source: lib/eautoFlows/modules/*.ts (data mirror for /eauto/flows). Only facts not already in this file.

- LoginStatus values: firstTimeLogin, secondTimeLogin, inactive, resetPassword; inactive blocks login; firstTimeLogin and resetPassword force a password change. [askeauto: Q2 prod code 2026-10-23]
- CompanyStatus values: New, Activated, Inactivated, Rejected, Terminated; only Activated can log in. [askeauto: Q2 prod code 2026-10-23]
- An IP lookup event is sent on UCD login. [askeauto: Q2 prod code 2026-10-23]
- Popup state is per-session flags plus browser localStorage, not a database status. [askeauto: Q2 prod code 2026-10-23]
- Poster opens once per login. Current poster = Insurance Cancellation (EAINT-12555, prod 2026-10-20); it replaced LKM Refund popup v1.1 (EAINT-12438, prod 2026-10-07), which replaced the LKM Refund launching poster (EAINT-12421, prod 2026-10-01). Also check What's New (EAINT-12525). [jira: EAINT-12555 2026-10-19] [jira: EAINT-12525]


## Additions from Charmain's QA repo (added 2026-10-27)

Source: read-only clone of a QA colleague's repo, `_reference/codebases/eauto-qa-charmain/` (branch consolidate-charmain, commit 0ab45d1, last commit 2026-10-13). Status: a colleague's notes, not verified live by us.

1. "A transaction listing is scoped to the signed-in company. A record created by one dealer account is invisible to another, so a sweep must re-find a record as the same persona that made it." `[charmain-repo: docs/modules/ucd/README.md:29-31]`
2. "Permissions vary per user, not per company: eLKM, eVOC and SSM access are granted individually". `[charmain-repo: docs/modules/ucd/README.md:32-34]` See the company-level STMS permission note in flow-stms.md (Charmain additions), which partly contradicts this for SSM bypass.
3. "The SSM and several report listings return nothing without a date range, which is indistinguishable from 'no such record' unless the stated record count is read." `[charmain-repo: docs/modules/ucd/README.md:35-37]`
4. Landing on the dashboard means clearing the popup queue first; a dialog left open makes the menu click never land. `[charmain-repo: docs/modules/ucd/README.md:11-12]` `[charmain-repo: test-scenarios/ucd-apt/ucd-apt.assertions.yaml:102-103]`
5. Insurance company Main Users sign in on the dealer login and land on the same dashboard (seen during EAINT-12155 testing). `[charmain-repo: test-scenarios/ucd-user-password/ucd-user-password.md:355]`
