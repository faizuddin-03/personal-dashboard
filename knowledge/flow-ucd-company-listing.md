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

- BO Home → **Account Management → Manage Company Accounts**
  (`<a href="/<env>/view/account/company">`) — the only entry point exercised
  so far. `[verified: live HTML, uat1, 2026-08-21]`
  (`_reference/html/eauto/ucd-home-hub-admin.html` — despite the file name, that
  capture is the **BO** home (`/uat1/home/`, Hub Admin); "Manage Company Accounts" is
  a BO menu item under Account Management. See [flow-bo-shell.md](flow-bo-shell.md) §3.1.)
  `[verified: file content]`
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

## 9. The Company Details Checker as built (added 2026-10-15)

How the dashboard and script implement §4-§5. `[verified: scripts/eauto-company-checker/**;
app/eauto/company-details-checker/CheckerTab.tsx; app/api/eauto/company-details-checker/run/route.ts]`

### Pages that render it

1. `/eauto/company-details-checker` — EAINT-12153 page, tabs **Checker** / **Test Script** (`page.tsx:15-44`).
2. `/eauto/duitnow-qr` — EAINT-12257 page reuses `CheckerTab` with `onUse`, `usedKey`, `notice`, `ticket="EAINT-12257"` props (`CheckerTab.tsx:275-286`). Both pages share one background-run key `eauto/company-details-checker` because the route holds a single module-level child process — only one check runs at a time whichever page is open (`CheckerTab.tsx:291-300`).
3. `/eauto/checker` is a static **placeholder page** describing the plan ("Planned — nothing is built yet"); it runs nothing (`app/eauto/checker/page.tsx`).

### Input

1. Textarea: one row per line, `roc<TAB>newRoc<TAB>tin`; falls back to 2+ spaces or commas (`CheckerTab.tsx:61-75`).
2. Drag-and-drop `.xlsx` / `.csv` of a full Company Listing export: header row matched case-insensitively on exactly `Company ROC`, `New Company ROC`, `TIN Number`; the export uses `="0123"` forced-text fields and comma-laden Remarks, hence the RFC4180 parser (`CheckerTab.tsx:77-159`).
3. Toggle "only complete rows" (default **on**): a cell that is blank or `-` is a placeholder and the row is skipped (`CheckerTab.tsx:47-57, 339-346`).
4. Environment presets `SIT3`, `SIT1`, `UAT1`, `UAT2`, `UAT3` (`https://staging.eauto.my/<seg>`) or Custom; username/password typed per run; concurrency default 4 (`CheckerTab.tsx:28-36, 330-332`).

### Contract with the script

1. Route writes `scripts/eauto-company-checker/input-rows.json` as `{ "rows": [ { "roc", "newRoc", "tin" } ] }`, deletes any old `output-results.json`, spawns `npx playwright test --project=company-checker` with `EAUTO_USERNAME`, `EAUTO_PASSWORD`, `EAUTO_BASE_URL`, `COMPANY_CHECKER_CONCURRENCY` injected; 30-minute kill timer (`route.ts:26-121`).
2. Script reads `{rows}`, logs in **once** on a bootstrap page, then opens one **page per worker inside the same BrowserContext** (cookies are context-level, so N workers never means N logins — per Faizuddin 2026-09-02), chunks rows across workers, and flushes `output-results.json` after **every row** so a stopped run still returns partial results (`fixtures/authFixture.ts`; `utils/batch.ts:24-47`).
3. Output `{ "results": [ { roc, newRoc, tin, rocStatus, newRocStatus, tinStatus, overall, errorMessage? } ] }` with `ColumnStatus = "PRESENT" | "ABSENT" | "ERROR"` and `overall = "PASS" | "FAIL"` (`data/types.ts`). A thrown check yields all three `ERROR` + `FAIL` + the message (`emptyResult`). The UI labels PRESENT "Used", ABSENT "Free", ERROR "check failed" (`CheckerTab.tsx:241-253`); the plan page calls the row states "Able to use" / "Unable to use".
4. Per-column check: Reset (`a.to-reset`) **and** clear the three inputs directly (Reset is a client-side handler and not trusted for every field type) → fill one input → `#to-search` → wait for `#result table` → 1.5 s → count `#result table tbody tr`. **A blank value is reported `ABSENT` without searching** (`CompanyListingPage.ts:29-62`).
5. Script defaults when run bare: base `https://staging.eauto.my/sit3`, user `faizuddinBO1` / `password` (`data/config.ts:6`; `data/users.ts:14-16`).
6. Sample `output-results.json` (2026-09) shows the typical pattern on a real export: `rocStatus` and `newRocStatus` PRESENT, `tinStatus` ABSENT, `overall` FAIL — i.e. a free TIN says nothing about the company; only an all-ABSENT triple passes.

### Results, persistence and the handover to a runner

1. Results, the typed rows, username and base URL are saved to localStorage key `company_details_checker_results` for the next visit; the in-flight run lives in AppShell's background-run store (`lib/companyDetailsChecker.ts:15-39`; `CheckerTab.tsx:360-396`).
2. Export to Excel: 7 columns `Company ROC / ROC Status / New Company ROC / New ROC Status / TIN Number / TIN Status / Overall`, statuses coloured red/green/grey (`CheckerTab.tsx:161-205`).
3. **Spent-company ledger** `lib/companyUsageLedger.ts`, localStorage key `eauto_ucd_company_usage`, keyed `roc|newRoc|tin`, **not ticket-scoped** — a company onboarded by any ticket is dead for all; entries carry `ticket`, `scenario`, `companyName`, `reference`, `confirmed`, `usedAt`; a confirmed entry is never downgraded by a hand mark. "Available" in the stats = PASS and not in the ledger (`CheckerTab.tsx:424-429`).
4. **Use** (12257 only): copies `roc → Old BRN`, `newRoc → New BRN`, `tin → TIN` into localStorage key `eaint12257_picked_company` (`PickedCompany` also carries a typed-in `companyName`, because the export has no name column) and switches to the Test Script tab; the button is offered only when `checkerNeed()` says the selected scenario + business type needs real data (the three SSM types, or the dummy TS99) (`lib/companyDetailsChecker.ts:41-74`; `app/eauto/duitnow-qr/scenarios.ts:99-118`).
5. When a 12257 run finishes with a minted pre-application reference (or passed), the picked row is marked `confirmed: true` in the ledger and cleared from the form (`app/eauto/duitnow-qr/TestScriptTab.tsx:223-242`).

### Open items

1. Environment presets on the checker are instance-scoped (`/sit3`, `/uat1`…) while the onboarding module the data feeds has a single `/obs` staging. Which instance's Company Listing is authoritative for an `/obs` onboarding is **not recorded**. `[unconfirmed]`
2. A row cleared here is free in the **Company Listing**; whether `checkSSM.do` (the live SSM registry) also accepts it is a separate question answered only at the pre-application form. `[verified: flow-ucd-onboarding.md § SSM; src/dealer.ts:38-45]`

## 10. Listing column rules from Charmain's QA repo (added 2026-10-27)

Source: read-only clone of a QA colleague's repo, `_reference/codebases/eauto-qa-charmain/` (branch consolidate-charmain, commit 0ab45d1), intake inventory of her `by-module/backoffice-audit` harness, file `tests\listing-derivations.test.js` (15 unit tests). **These are a colleague's unit-test titles for her own harness's column derivation, not verified live by us.** `charmain-bo-audit-v1` (the first version) has no listing tests. Tag: `[charmain-repo: <path>:<line>]`.

### Her test titles, verbatim
1. Block STMS Transaction: "stms: no flags ticked → empty, isEmpty=true"; "stms: Foreigner only → 'Foreigner'"; "stms: Company only → 'Company'"; "stms: both ticked → 'Foreigner, Company' in that order"; "stms: blockUcdToUcd does NOT appear in Block STMS Transaction column"; "stms: null/undefined company returns empty state, doesn't throw" [charmain-repo: intake/reports/charmain-backoffice-audit.json:2101-2106]
2. RHB Status: "rhb: rhbAccActive=true → 'Active'"; "rhb: rhbAccActive=false → 'Inactivated'"; "rhb: undefined → 'Inactivated'"; "rhb: null company → 'Inactivated'" [charmain-repo: intake/reports/charmain-backoffice-audit.json:2107-2110]
3. eLKM: "elkm: elkmPermission=true → 'Yes'"; "elkm: elkmPermission=false → 'No'"; "elkm: undefined → 'No'"; "elkm: elkmMaxAuthorizeUser presence does NOT affect Yes/No" [charmain-repo: intake/reports/charmain-backoffice-audit.json:2111-2114]
4. Other Yes/No columns: "yesno: truthy → 'Yes', falsy → 'No'" (which columns is not named) [charmain-repo: intake/reports/charmain-backoffice-audit.json:2115]

### Checked against our capture
1. The 27-column header in `_reference/html/eauto/company-listing-search-with-results.html` (uat1, 2026-08-21) has `Block STMS Transaction`, `RHB Status`, `Limited Features For UCD to UCD`, `Transaction Restriction`, `eLKM` as separate columns. `[verified: file content, lines 255-259]`
2. Captured rows show RHB Status `Active` and `Inactivated`, eLKM `Yes ` (trailing space), Limited Features / Transaction Restriction `No`. Agrees with items 2-4. `[verified: file content, lines 278-330]`
3. An empty Block STMS Transaction cell renders `-` in the capture; her title says "empty". Not a conflict: `-` is the listing's placeholder for unset fields (§6). No captured row has Foreigner or Company ticked, so the "Foreigner, Company" order is unchecked by us.
4. Item 1 "blockUcdToUcd does NOT appear" fits the separate `Limited Features For UCD to UCD` column. Note `flow-stms.md` (BO support actions) lists "Block STMS Category (Foreigner, Company, Limited Features for UCD to UCD)" as one group on the edit page; the listing splits them.
