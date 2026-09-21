# Manage Company Accounts — search/listing flow

## 1. Why this flow matters

Onboarding a new UCD company account requires ROC / New ROC / TIN values that
are **valid but not yet consumed** in the target staging environment — the
system rejects account creation if any of these three fields already belongs
to another company record. Sourcing "free" values by hand and then hitting a
duplicate error on submit wastes a full onboarding attempt. This flow is what
the Company Details Checker (EAINT-12153 sub-function, `/eauto/company-details-checker`)
automates: given candidate values, report whether each is still free.

## 2. Entry points

- Home → **Account Management → Manage Company Accounts**
  (`<a href="/<env>/view/account/company">`) — the only entry point exercised
  so far. `[verified: live HTML, uat1, 2026-08-21]`
  (`_reference/html/eauto/ucd-home-hub-admin.html`)
- Direct navigation to `/<env>/view/account/company` after login also lands on
  the same page (this is what the checker script does — it skips the home
  page entirely). `[verified: live HTML, uat1, 2026-08-21]`

## 3. URL map

| Step | URL pattern | Arrival signal |
|---|---|---|
| Login | `/<env>/public/login` | login form present |
| Company listing | `/<env>/view/account/company` | `form#search-form` with a `Company Account Listing` caption |
| Search | same URL, no navigation — AJAX | `#result` td's inner `<table>` is replaced |

There is no separate "results page" URL. The search form has no `action`/AJAX
endpoint visible in the captured HTML — Search is a same-page update of the
`#result` `<td>`. `[verified: live HTML, uat1, 2026-08-21]`

## 4. The real DOM handles — verbatim

Captured pages: `_reference/html/eauto/company-listing-blank.html`,
`company-listing-search-empty.html`, `company-listing-search-with-results.html`.
`[verified: live HTML, uat1, 2026-08-21]`

- Form: `form#search-form`
- Company ROC field: `input[name="registrationCompany"]` (also has `id="registrationCompany"`)
- New Company ROC field: `input[name="newRegistrationCompany"]` (no id — name-only)
- TIN Number field: `input[name="tinNo"]` (no id — name-only)
- Other filter fields on the same form (not used by the checker, but share the
  form so must be left blank/cleared for an isolated single-column search):
  `name`, `companyAccountId`, `email`, `loginName`, `refId`,
  `contactPersonName`, `eInvoiceContactName`, `eInvoiceContactNumber`,
  `eInvoiceContactEmail`, `sstNo`, `businessType` (select), `transactionRestriction`
  (select), `makerName`, `makerPhone`, `makerEmail`, `state` (select), `type` (select)
- Search button: `input#to-search[type="submit"]`
- Reset link: `a.to-reset` — clears the form without a page reload; use this (or a
  fresh page load) between per-column searches rather than clicking into each field
  and manually clearing, since the form has 17+ fields sharing no common class.
- Results container: `td#result` → contains one `<table>` with a fixed
  27-column `<thead>` and a `<tbody>`.
  - **Not present**: `<tbody>` exists but has **zero** `<tr>` children.
    `_reference/html/eauto/company-listing-search-empty.html`
  - **Present**: `<tbody>` has one `<tr class="even|odd">` per matching company.
    `_reference/html/eauto/company-listing-search-with-results.html`
  - Before any search, `td#result` itself is just `&nbsp;` with no inner table
    at all — distinct from the empty-`<tbody>` state above.
    `_reference/html/eauto/company-listing-blank.html`

Presence check strategy: after Search, count `#result table tbody tr`. Zero
rows → field value not used (safe). One or more rows → field value already
used (unsafe). No "Working..." interstitial was observed in the captured
pages — the swap appears synchronous relative to the click, but the checker
script still waits for the table to be present. `[verified: live HTML, uat1,
2026-08-21]`

## 5. Decision points

**AND-only search — the reason this must be checked one column at a time.**
The listing filters every populated field together (an AND, not an OR). If a
candidate ROC is genuinely already used but its paired New ROC/TIN are not, a
combined all-three-fields search returns empty (no single existing record
matches all three at once) and would be misread as "all free." Each of Company
ROC / New Company ROC / TIN Number must therefore be searched **individually**,
with the other two fields (and every other filter field) blank, to get an
independent presence signal per column. `[from Faizuddin, 2026-08-21]`

Pass/fail for a candidate triple: **PASS** only when all three columns are
independently absent. If any one column is present, the whole triple is
**FAIL** even though the other columns are individually free — the three
values are meant to be used together and can't be mixed with values from a
different triple. `[from Faizuddin, 2026-08-21]`

## 6. Preconditions and test data

- Requires a Hub Admin login (`EAUTO_USERNAME` / `EAUTO_PASSWORD`) with access
  to Account Management. Same credential pair as `scripts/eauto-insurance`.
- No test data is created or consumed by this flow — it is read-only searching,
  never "Create New". Safe to run against any environment repeatedly.
- Dash (`-`) is the placeholder eAuto renders for an unset field in results —
  seen in the New Company ROC and TIN Number columns of several sample rows.
  Not relevant to the checker itself (a user's candidate value is never `-`),
  but note it if a captured row looks like a field is "empty" — the record
  still exists and still counts as present for whichever column *does* have
  a value that matches the search field.

## 7. Traps

- **Do not search all three fields at once** — see § Decision points. This is
  the whole reason the flow exists as three isolated searches instead of one.
- The New Company ROC and TIN Number fields have **no `id` attribute**, only
  `name` — don't reach for `#newRegistrationCompany` or `#tinNo`, they don't exist.
- Campaign/notification banners on the UCD shell can intercept clicks on first
  load after login — reuse `BasePage.dismissBanners()` from
  `scripts/eauto-insurance/pages/BasePage.ts` rather than re-deriving it; see
  [flow-ucd-shell.md](flow-ucd-shell.md) and [quirks.md](quirks.md) for the
  duplicate-id traps in that dismiss logic.

## 8. What is NOT covered

- Only the Hub Admin "Manage Company Accounts" listing
  (`/view/account/company`) was captured. The similarly-named "Company Account
  Listing (Limited Features For UCD To UCD)" page
  (`/view/account/company/limited-features-ucd-to-ucd`) was not — assume it has
  a different, unverified form until captured.
- Pagination behaviour when a search matches more rows than fit on one page was
  not observed (the captured result set was 8 rows, no pager visible). The
  Company Details Checker only needs "any rows at all", so this gap doesn't
  block that use case, but a future flow that needs to read specific matched
  rows should capture a paginated result first.
- No AJAX/network trace was captured, only the resulting DOM — the exact
  request (endpoint, whether it's a full form GET or an AJAX POST) is
  unverified.
