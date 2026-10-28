# Flow — the Service Portal shell (bank / credit company portal)

The Service Portal is a separate eAuto app for banks and credit companies. It
has its own login page, its own field names, its own home and its own logout.
Only one module behind it (JomCheck Report Listing) is documented. Read this
before automating any page under `/credit/home/`.

Hrefs below are verbatim from the captures except the environment segment,
written as `/<env>/`. Captures came from one run each; the env is not a rule
(see [eauto-portals.md](eauto-portals.md) § Never tie an environment to a general rule).

## 1. What it is, who uses it, what depends on it

1. Users are bank / credit-company staff. The home category is "Hire Purchase
   Ownership"; the JomCheck Report Listing shows reports a UCD shared with that
   company. `[verified: _reference/html/eauto/service-portal-home-and-jomcheck-listing.html · span.category, table headers]`
2. It runs on the same host as UCD/BO under a different path (`/credit/home/`).
   Code allows a separate base URL through `EAUTO_SP_BASE_URL`, falling back to
   the UCD/BO base. `[verified: scripts/eauto-jomcheck/data/config.ts:7-9]`
3. The accounts are most likely managed in BO under "Manage Bank/Credit Company
   User Accounts" (`/view/credit-account/user`). `[unconfirmed — menu label only, see flow-bo-shell.md §3.1]`
4. Depends on: UCD JomCheck purchase with a share tick, see [flow-jomcheck.md](flow-jomcheck.md) §7u.

## 2. Entry points, login and landing

| Entry | Detail | Status |
|---|---|---|
| Login page | `/<env>/bank/login/` | `[from Faizuddin, 2026-10-05, in scripts/eauto-jomcheck/data/config.ts:36-41 — "/banker/login" returned "URL not found"]` |
| Landing (home) | `/<env>/credit/home/` — `#home-welcome` "Good Afternoon, <NAME>" + `#home-menu` | `[verified: _reference/html/eauto/service-portal-home-and-jomcheck-listing.html]` |
| Header Home link | `a#home-link` → `/<env>/credit/home/` | `[verified: _reference/html/eauto/service-portal-jomcheck-listing-one-month-error.html · #home-link]` |
| Header Menu dropdown | `a#menu-link` loads `/credit/home/menu.jsp?source=menuLink` into `#menu-bar` | `[verified: same file · inline script]` |

### Login form DOM (complete)

```html
<form id="login-form">                         <!-- no action attribute -->
  <input type="text"     name="name" class="login-name text" size="26">
  <input type="password" name="pass" class="login-pass text" size="26">
  <input type="checkbox" name="rememberMe" id="rememberMe" value="true"> Remember Password
  <input type="submit"   class="to-login button" value="Login »">
</form>
```
`[verified: _reference/html/eauto/service-portal-login.html · form#login-form]`

1. Field names are `name` / `pass`, **not** `username` / `password`. The UCD/BO login selectors do not work here. `[verified: same file]`
2. The page shows a red "WARNING!! This is a DEMO SYSTEM!! DO NOT USE THIS SYSTEM TO SELL TICKET TO CUSTOMER" and a `<marquee>` "DEMO SYSTEM!!". `div#header` is empty on the login page. `[verified: same file]`
3. Automation selectors: `input[name="name"]`, `input[name="pass"]`, `input.to-login, input[type="submit"]`, each `.first()`. `[verified: scripts/eauto-jomcheck/pages/ServicePortalLoginPage.ts:16-18]`
4. Login success = the login form is gone. If no form loads, the code accepts only a visible "JomCheck Report Listing" link as "already logged in"; anything else throws. `[verified: scripts/eauto-jomcheck/pages/ServicePortalLoginPage.ts:50-61, 67-69]`
5. Credentials: `EAUTO_SP_USERNAME` / `EAUTO_SP_PASSWORD`; the default account is the superadmin (display name "Jason Seah"). `[verified: scripts/eauto-jomcheck/data/users.ts:27-34]`

### Logout

Header `a.logout` → native `confirm("Sure to logout?")` → `window.location.href = "/<env>/banker/logout.do"`.
Note the path is `/banker/logout.do`, while the login is `/bank/login/`.
`[verified: _reference/html/eauto/service-portal-jomcheck-listing-one-month-error.html · $("#header a.logout").click]`

## 3. Complete menu tree

One category, `div.Admin.HubAdmin.Normal`, captured on the superadmin account:

| Category | Label | href | Covered by |
|---|---|---|---|
| Hire Purchase Ownership | Ownership Claim Enquiry | `/<env>/credit/home/view.jsp` | no flow doc yet |
| Hire Purchase Ownership | Ownership Claim Listing | `/<env>/credit/home/enquiry` | no flow doc yet |
| Hire Purchase Ownership | Hire Purchase Record Creation Listing | `/<env>/credit/home/hp-record` | no flow doc yet |
| Hire Purchase Ownership | JomCheck Report Listing | `/<env>/credit/home/jomcheck-report-listing/main.do` | [flow-jomcheck.md](flow-jomcheck.md) §7r–§7u |

`[verified: _reference/html/eauto/service-portal-home-and-jomcheck-listing.html · #home-menu]`

Pages reached from the listing:

| Page | URL | Source |
|---|---|---|
| JomCheck report details | `View` → `/<env>/api/credit/jomcheck-report-listing/details.do?transactionId=<uuid>` (`target="_blank"`) | `[verified: service-portal-home-and-jomcheck-listing.html · Action column]` |
| Embedded PDF | `iframe.jc-pdf-viewer[src="/<env>/api/credit/jomcheck-report-listing/print.do?transactionId=<uuid>#toolbar=1&navpanes=1&scrollbar=1"]`, `button#jc-print-btn` "Print", back link "« Back" → listing | `[verified: _reference/html/eauto/service-portal-jomcheck-report-details.html]` |
| Bulk download | tick `input.jc-dl` per row (or `#jc-dl-all`); `a#jc-bulk-dl` "Download files (N)" → ZIP of PDFs | `[verified: service-portal-home-and-jomcheck-listing.html]` |
| Contact Us / Terms & Conditions / Privacy | footer `window.open('/<env>/public/contact-us.jsp' / terms-condition.jsp / privacy.jsp)` | `[verified: service-portal-jomcheck-listing-one-month-error.html · #footer]` |

## 4. Shared DOM handles — verbatim

### 4.1 Header

```
#home-bar   a#home-link "Home |" · a#menu-link "Menu ▾"
#common-bar span.user-name "<name>," · a.logout "Logout"
div#menu-bar.hidden · div#countdown-screen-timeout (observed 1439:xx) · div#session-timeout-dialog
div#logo > img eAuto_TM_logo.svg
```
`[verified: _reference/html/eauto/service-portal-jomcheck-listing-one-month-error.html; service-portal-jomcheck-listing-datepicker-open.html]`

Differences from the BO header ([flow-bo-shell.md](flow-bo-shell.md) §4.1): no
"My Account" link and no pending-transaction counter. `[verified: same files]`

### 4.2 Role filtering

Same loader as BO: `$("div."+_userRole).show()`. Observed `_userRole = "Normal"`
for a regular account. The only captured category carries `Admin HubAdmin Normal`,
so every role sees it. `[verified: service-portal-jomcheck-listing-one-month-error.html; service-portal-home-and-jomcheck-listing.html]`

### 4.3 Listing / search pattern (JomCheck Report Listing)

```
form#search-form
  td.jc-filter-label "Vehicle No.:"     input#vehicleNo[name=vehicleNo][maxlength=255]
  "Chassis No.:"                        input#chassisNo[name=chassisNo]
  "Shared Date From*:"                  input#sharedDateFrom[readonly].hasDatepicker
  "Shared Date To*:"                    input#sharedDateTo[readonly].hasDatepicker
  "Payment Date From:" / "To:"          input#paymentDateFrom / #paymentDateTo (readonly)
  input#to-search[type=button] "Search Now"
  a.to-reset "Reset"
  a#to-export[href="javascript:void(0);"][style*="display:none"] "Export"
  input[type=hidden][name=pageNo] value=1
<b>JomCheck Report Listing</b>
td#result
  div#result-summary[data-count] > span "<n> record(s) in total" + a#jc-bulk-dl
  table > thead tr.header (inline blue) > th.col ; tbody tr.odd / tr.even ; td.col / td.col-c
```
`[verified: _reference/html/eauto/service-portal-home-and-jomcheck-listing.html]`

1. Search is `type=button` (BO's is `type=submit`). Click it; pressing Enter is not proven. `[verified: same file]`
2. Empty result body row: `td[colspan=17]` "No shared JomCheck transactions are currently available." `[verified: service-portal-jomcheck-listing-one-month-error.html]`

### 4.4 Datepicker

1. jQuery UI, same `DP_jQuery` markup as BO: Prev/Next arrows, `select.ui-datepicker-month` (Jan → current month), `select.ui-datepicker-year` (2016 → current year), `td[onclick="DP_jQuery.datepicker._selectDay(...)"] > a.ui-state-default`. `#ui-datepicker-div` keeps class `ui-helper-hidden-accessible` while `display:block`. `[verified: _reference/html/eauto/service-portal-jomcheck-listing-datepicker-open.html header]`
2. Min date = today minus 10 years (a 1 Jan 2016 request clamped to the same day ten years back). `[verified: knowledge/flow-jomcheck.md §7t item 3]`
3. **The To picker is re-ranged only by the From picker's `onSelect`.** `datepicker('setDate')` does not fire it; To then allows only today. Pick through the UI: year select, month select, real day click. `[verified: _reference/html/eauto/service-portal-jomcheck-listing-one-month-error.html header; knowledge/flow-jomcheck.md §7t item 7]`

## 5. Decision points

1. Login form present → submit; absent → must already be on Service Portal home, otherwise fail. `[verified: ServicePortalLoginPage.ts:50-61]`
2. Search with a Shared Date range over one month → rejected (§7).
3. Download checkbox ticked → `#jc-bulk-dl` counter > 0 and a ZIP download is possible.

## 6. Preconditions and test data

1. A UCD must have bought a JomCheck report and ticked this credit company in the share list; otherwise the listing is empty. `[verified: knowledge/flow-jomcheck.md §7u]`
2. Shared Date From and To are both required (`span.required`). `[verified: service-portal-home-and-jomcheck-listing.html]`

## 7. Popups and traps

1. **One-month error.** Shared Date range over one month: the search does not run, a red `div` above the table reads exactly
   `Shared Date range must not exceed one month.`, `#result-summary` has `data-count="0"`, and the body row reads "No shared JomCheck transactions are currently available."
   `[verified: _reference/html/eauto/service-portal-jomcheck-listing-one-month-error.html · div[style*="color:red"]]`
   Default automation window: To = today, From = one month before. `[source: Faizuddin, 2026-10-05, in knowledge/quirks.md § Dates]`
2. **No campaign / announcement dialogs** in any Service Portal capture. `[verified: grep of the four service-portal-*.html captures — no #dialog-* elements]`
3. **Native `confirm()` on Logout** — same trap as BO; Playwright auto-dismisses it. Load `/<env>/banker/logout.do` or accept the dialog.
4. **Different login field names** (`name`/`pass`) — a shared UCD/BO LoginPage silently fills nothing.
5. **Login URL guesses fail.** `/banker/login` returned "URL not found"; the capture header's guesses (`/banker/login` or `/public/login`) are superseded by `/bank/login/`. `[verified: scripts/eauto-jomcheck/data/config.ts:36-41]`
6. **Severity counter order** on the listing is Severe/High/Medium/Low/Critical/Catastrophic, not the SRD order. `[verified: service-portal-home-and-jomcheck-listing.html comment; knowledge/flow-jomcheck.md §6]`

### Footer and version markers

`"Best Compatible With Mozilla Firefox V36.0.4"`, `"Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved."`, Contact Us | Terms & Conditions | Privacy. Identical to BO; no build number. `[verified: service-portal-jomcheck-listing-one-month-error.html · #footer]`

## 8. What is NOT covered

1. Ownership Claim Enquiry, Ownership Claim Listing, Hire Purchase Record Creation Listing — label and href only.
2. Whether other roles see more categories than "Hire Purchase Ownership" (only one category captured).
3. The rendered `/credit/home/menu.jsp` dropdown.
4. Pagination markup (captured result sets fit one page).
5. Login error message for wrong credentials; the session-timeout dialog firing.
6. The Export link's real href after a search (only the hidden state is captured).


## Additions from the 2026-10-23 flows study

Source: lib/eautoFlows/modules/*.ts (data mirror for /eauto/flows). Only facts not already in this file.

- New user passwords: 12 characters with upper case, lower case, number and special character, across all portals. [jira: EAINT-12155 description 2026-08-07]
- JomCheck report sharing: backend audit log records UserID, file type and date and time; sharing date re-checked on every access (EAINT-12345); sharing lasts 30 days; only reports purchased after EAINT-10937 deployed appear. [azfar: knowledge/_core/jomcheck.md]
