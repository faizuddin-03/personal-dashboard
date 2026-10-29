# Addenda from the portal-shell pass (2026-10-16)

Facts found while writing flow-bo-shell.md / flow-service-portal-shell.md /
flow-ucd-shell.md that belong in other files. Not applied.

## knowledge/README.md (index rows)

| [flow-bo-shell.md](flow-bo-shell.md) | **The BackOffice portal shell** — login/landing/logout, the complete Hub Admin menu tree (12 categories, every href, which flow doc covers each), header + pending counter, role-filtered Menu dropdown, listing/search/export/datepicker variants, traps (native logout confirm, duplicate menu labels). Find any BO page by name here |
| [flow-service-portal-shell.md](flow-service-portal-shell.md) | **The Service Portal (bank/credit company) shell** — `/bank/login/` form (`name`/`pass`), `/credit/home/` menu, header, JomCheck Report Listing pattern, datepicker onSelect trap, the verbatim one-month error, `/banker/logout.do` |

## knowledge/flows.md (index rows)

| [flow-bo-shell.md](flow-bo-shell.md) | BackOffice shell — full menu map with hrefs and coverage, header, role filtering, listing/datepicker/export patterns, traps | BO home captures 2026-08-21/08-24/09-30 + BO listing captures + code |
| [flow-service-portal-shell.md](flow-service-portal-shell.md) | Service Portal shell — login, home menu, header, listing pattern, one-month error | Service Portal captures 2026-09-30 / 10-05 + eauto-jomcheck code |

Also in flows.md: the line "Modules with **no** flow document yet" should drop
JomCheck and Service Hub (both have flow docs now) — `[verified: ls knowledge/]`.

## knowledge/eauto-portals.md

1. § Portals and roles: add **Service Portal** — bank/credit-company app, login `/<env>/bank/login/` (fields `name`/`pass`), home `/<env>/credit/home/`, logout `/<env>/banker/logout.do`. `[verified: scripts/eauto-jomcheck/data/config.ts:36-43; _reference/html/eauto/service-portal-login.html; service-portal-jomcheck-listing-one-month-error.html]`
2. § Login redirect chain: "BO login has no reliable landing-page assertion" is outdated — BO lands on `/<env>/home/` with `#home-menu`. `[verified: _reference/html/eauto/bo-home-hub-admin.html]`
3. § Portals and roles: BO is "internal" — add that the menu is role-filtered by `_userRole` (`HubAdmin` observed). Cross-ref flow-bo-shell.md §4.3.
4. Logout differs per portal: UCD = jQuery UI `#logout-confirmation` (Yes/No); BO and Service Portal = native `confirm("Sure to logout?")`, which Playwright auto-dismisses. `[verified: ucd-home-page-uat1-2026-09-24.html; bo-jomcheck-report-listing-vehicle-filter-active.html]`

## knowledge/quirks.md

1. Native `confirm()` on BO/Service Portal logout is auto-dismissed by Playwright; click does nothing. Load `/user/logout.do` (BO) or `/banker/logout.do` (SP). Cross-portal trap.

## knowledge/flow-jomcheck.md

1. The capture header of `_reference/html/eauto/bo-jomcheck-report-listing.html` gives the URL as `/uat1/view/admin/jomcheck/report-listing`; the menu href is `/<env>/view/jomcheck/report-listing/index.do`. Export path does contain `/admin/`: `/<env>/download/admin/jomcheck/report-listing/export.do?vehicleNo=<v>&pageNo=1`. Note which is the page URL if §-text relies on it.
2. `_reference/html/eauto/service-portal-login.html` header guesses `/banker/login` or `/public/login`; superseded by `/bank/login/` (config.ts:36-41).

## knowledge/flow-ucd-company-listing.md

1. Line 18 cites `_reference/html/eauto/ucd-home-hub-admin.html`; that file is the **BO** home (`/uat1/home/`, Hub Admin). "Manage Company Accounts" is a BO menu item (Account Management). `[verified: file content]`

## _reference/html/README.md (read-only — owner action only)

1. `ucd-home-hub-admin.html` is misnamed (it is BO home). `EAINT-9306-bo-home-menu.html`'s header also calls it "a near-identical BO home", which is correct; only the filename misleads. Rename needs the owner's explicit request.
2. The eauto/ index table lists only 3 eSTM files; ~35 eauto captures are unindexed, including all BO/Service Portal/UCD-home ones used here.
3. "Not yet captured … UCD home" is now outdated — `ucd-home-page-uat1-2026-09-24.html` and `home-with-merdeka-and-raya-banners.html` exist.
