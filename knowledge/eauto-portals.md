# eAuto — portals, roles, environments

## Portals and roles

- **UCD Portal** — the dealer-side self-service portal. Buys software
  installations and biometric devices, books and reschedules appointments.
  `[verified: tests/service-hub/utils/config.ts · PATHS.ucd*]`
- **BO (Back Office) Portal** — internal. Holds the "Biometric Device Purchase &
  Software Installation Listing" and the Appointment Calendar, and can add or
  reschedule appointments on a UCD's behalf.
  `[verified: tests/service-hub/pages/bo/AppointmentCalendarPage.ts]`
  The BO menu is role-filtered by `_userRole` (`HubAdmin` observed); see
  [flow-bo-shell.md](flow-bo-shell.md) §4.3. `[verified: _reference/html/eauto/bo-home-hub-admin.html]`
- **Service Portal** — the bank / credit-company app. Login
  `<base>/bank/login/`, form fields `name="name"` / `name="pass"`, submit
  `input.to-login`; the guess `/banker/login` returns "URL not found". Home
  `<base>/credit/home/`; logout `<base>/banker/logout.do`.
  `[verified: scripts/eauto-jomcheck/data/config.ts:36-43; pages/ServicePortalLoginPage.ts:16-18; _reference/html/eauto/service-portal-login.html; service-portal-jomcheck-listing-one-month-error.html; from Teams EAINT-12155, 2026-08-13 15:04, Leong Jin Chuen]`
- **CIBO** — **not an eAuto portal.** A separate system that nonetheless shows
  eAuto insurance transactions, making it a third verification surface after UCD
  and BO. See [cibo.md](cibo.md). `[from QA team, 2026-08-13]`
- **Secarang** — **not an eAuto portal.** The public (B2C) insurance site: no
  user login, staging site-password gate only, Angular SPA, Fiuu-hosted payment.
  Same insurers as eAuto; its transactions appear only in CIBO. See
  [flow-secarang-insurance.md](flow-secarang-insurance.md).
  `[verified: scripts/secarang-insurance/fixtures/sessionFixture.ts:6-8; SRD EAINT-12151 §2.1.1]`
- **CSE (call-in)** — a distinct path from UCD self-service, with different
  rules: no date limit and no per-day slot cap, bound only by CSE capacity.
  `[verified: tests/service-hub/utils/config.ts · ENV.reschedule comment, SRD 2.3.2.1 #6]`

**Service Hub BO roles.** Ops and CSE are the two BO roles the SRDs name for
the Service Hub module, with login IDs:

1. Ops: kmcheah, jasons, mfared, nikmuhamad, eautosoyeng, eautokelvin,
   eautonurul, eautozara, mfizni.
2. CSE: eautochinwei, eautohamal, eautojrjaya, eautoxiayuan, kokping, eautomie.
3. CSE cannot cancel a Biometric Device Purchase and has no Export access.

`[from SRD EAINT-10960 v1.2 §2.2.3; SRD EAINT-11880 v1.2 §2.2.3]`

**Service Hub UCD role split.** Software Installation is open to all UCD users;
Biometric Device Purchase to the main user only.
`[from SRD EAINT-10960 v1.2 §2.2.3 "UCD"]`

The 6-bookings-per-day cap binds **UCD Portal bookings only**. On the BO
calendar the "(Full)" indicator is informational — CSE can still add past it.
`[verified: tests/service-hub/pages/bo/AppointmentCalendarPage.ts · BoDateSlotInfo doc]`

## Environments

Base URL pattern: `https://staging.eauto.my/<env>` where `<env>` is a path
segment, not a subdomain — e.g. `uat1`, `uat4`, `sit2`, `sit3`.
`[verified: tests/service-hub/playwright.config.ts · use.baseURL; scripts/eauto-e2e/data/config.ts · CONFIG.baseUrl]`

A BackOffice capture of 2026-10-15 uses context path `/eauto` in every link where
earlier captures used `/uat1`; its base URL is not stated.
`[verified: _reference/html/eauto/bo-jomcheck-transaction-enquiry-failed-resubmit.html header]`

**The onboarding module (`/obs`) sits outside the instance path:**
`https://staging.eauto.my/obs/...`. BackOffice login and the `/obs` handoff
(`/<instance>/api/admin/onboarding/auth-redirect.do`) take the instance; the
dealer-facing `/obs/preOnb/*` and `/obs/form/*` pages and the `/obs/admin/*`
listings do not. `[verified: scripts/eauto-duitnow-qr/src/env.ts:8-21]`

**Which branch held what, and when**, is a dated history, not a rule. It lives in
[environments-history.md](environments-history.md). The 2026-10 snapshot: uat1 →
Wei Ting wholesale (swap with sit2, 14 Oct); uat2 inactive; uat3 → EAINT-8622, JPJ
Staging connected 15 Oct 09:42; preprod1 → Insurance Cancellation; `/obs` released
7 Oct; all staging branches merged to prod code 6–8 Oct. The preprod1 and `/obs`
items are not yet in environments-history.md.
`[from Teams via memory digest, 2026-10-14/15]`

### Never tie an environment to a general rule

**The environment is chosen per ticket, based on which one is free and usable for
that deployment.** It is not fixed, and it changes often. So:

- A general rule, business rule or flow document must **never** name an
  environment as part of the rule.
- An environment belongs to **a specific ticket**, and is recorded there — the
  ticket, its study, or its test script.
- Automation takes the environment as a **run-time input**, never a constant. This
  is why the Automation Testing runner has an environment picker
  (see [automation-testing.md](automation-testing.md)).
- Anything below that names an env is either a **code default** (what a script
  falls back to when nothing is passed) or an observation from **one captured run**
  — neither is "the environment to use".

`[from QA team, 2026-08-14]`

The code defaults differ between entry points, so never assume which env a run hit
— read it from the env var:

| Where | Env var | Default in code |
|---|---|---|
| Service Hub suite (config) | `EAUTO_BASE_URL` | `https://staging.eauto.my/uat4` |
| Service Hub playwright.config | `EAUTO_BASE_URL` | `https://staging.eauto.my/uat1` |
| eauto-e2e script | `E2E_ENV` | `sit3` |

`[verified: tests/service-hub/utils/config.ts · ENV.baseUrl; tests/service-hub/playwright.config.ts; scripts/eauto-e2e/data/config.ts]`

Staging is **shared and persistent**. Other runs and other users change data
underneath a test: a date's capacity can shift between scanning for room and
acting on it, and the near-term calendar window is often exhausted.
`[verified: tests/service-hub/pages/SlotPickerComponent.ts · allocateUnitsAnywhere doc; ENV.calendar.searchMonthsAhead comment, dated 2026-07-30]`

## Credentials

All injected as env vars, never hardcoded. `EAUTO_UCD_USER` / `_PASS`,
`EAUTO_BO_USER` / `_PASS`, and a second UCD account `EAUTO_UCD2_USER` / `_PASS`
that exists specifically for concurrency tests.
`[verified: tests/service-hub/utils/config.ts · ENV]`

`EAUTO_BO2_USER` / `_PASS` is a second BO Hub Admin account, used only for
EAINT-12166 TS02's "Officer B" check; that leg skips when blank.
`[verified: tests/service-hub/utils/config.ts:11-14; specs/device-purchase-do-ts02.spec.ts:82-85]`

How to create test accounts (UCD, BO user, AATF: real IC for the director,
Group = C4, Pay on behalf, Role = HubAdmin) and the production test-account
process via MJ are in [qa-process-from-notion-export.md](qa-process-from-notion-export.md).
`[from Notion export, QA Home/eAuto Secarang Test Environment URL & Account Creation.pdf; QA Home/Production Account Creation.pdf]`

## Browsers

1. Testing priority: UCD / AATF on Firefox; BO / JPJ on Chrome, then Firefox.
   `[from Notion export, QA Home/eAuto - Web Browser Testing Priority.pdf]`
2. This is superseded from 1 January 2027: EAINT-12180/12253 end Firefox access,
   and testing becomes Chrome-only. `[from Notion export, same page; from Teams, EAINT-12180]`
3. The UCD and AATF footer still reads "Best Compatible With Mozilla Firefox
   V36.0.4". `[from Teams sweep, 2026-10-16]`

## URL structure

Paths are centralised in `PATHS` — always add there rather than inlining a URL.
`[verified: tests/service-hub/utils/config.ts · PATHS]`

Notable specifics worth knowing before guessing a URL:

- Login is `/public/login/`.
- The Listing's "View" link goes to `receipt.do`, **not** `details.do` —
  `details.do` does not exist as a distinct page. `[verified live: uat4]`
- BO has no stable direct URL for the Appointment Calendar. It is reached from
  `/view/bo/service-hub/listing/main.do` by clicking the "Appointment Calendar"
  button (`#sc-appt-cal`), so the page object navigates through the listing.
- The BO detail page needs **both** `txnId` and `apptId` — one row per
  appointment.

`[verified: tests/service-hub/utils/config.ts · PATHS comments]`

- The UCD Service Hub pages: `/view/ucd/service-hub/view.do` (dashboard),
  `installation.do`, `purchase.do`, `installation/slot.do`,
  `installation/submitted.do`, `installation/reschedule.do`, `listing.do`,
  `receipt.do`. `[verified: tests/service-hub/utils/config.ts:104-116]`
- The live reschedule URL carries a second param:
  `reschedule.do?id=<txn>&apptIds=<uuid[,uuid]>`.
  `[verified: tests/service-hub/pages/ServiceRequestListingPage.ts:172]`
- Service Hub API endpoints seen live: BO listing search
  `GET /api/admin/service-hub/listing/list.get`; BO shipping save
  `POST /api/admin/service-hub/biometric/update-shipping.do`; UCD purchase
  `POST /api/ucd/service-hub/purchase/create.do`; UCD invoice
  `/download/ucd/service-hub/invoice-pdf.do?transactionId=`.
  `[verified: _reference/html/eauto/bo-biometric-device-purchase-software-installation-listing.html:21; specs/device-purchase-do-ts02.spec.ts:108; selection-step capture form action; SR-details capture]`
- The insurance (motor) portal login is `<base>/motorInsurance/login/`.
  Insurance company user admin is hidden from the BO menu and reachable only by
  URL: `<base>/view/insurance/company-account/user/`. About 6 insurance users
  exist. `[from Teams EAINT-12155, 2026-08-13 15:04, Leong Jin Chuen; same chat, 2026-08-13 15:55, Jin Siang Boo]`
- UCD and BO logout: load `<base>/user/logout.do` directly. It skips the native
  "Sure to logout?" `confirm()`.
  `[verified: scripts/eauto-jomcheck/data/config.ts:17; pages/LoginPage.ts:69-75]`

The eAuto mobile app shares the web database.
`[from Teams EAINT-12155, 2026-09-02 11:53, Charmain Ea Chiang]`

## The transaction-id query param differs per surface — read it, never assume it

Three forms are in use. **There is no single "current" one** — it varies by module,
so always take it from the live page:

| Param | Seen on |
|---|---|
| `?txnId=<number>` | oldest Service Hub redirects |
| `?transactionId=<uuid>` | **insurance** details — `/view/ucd/insurance/enquiry/view.do?transactionId=` `[verified: live HTML, 2026-08-14]` |
| `?id=<uuid>` | **eSTM** details — `/view/ucd/estm/enquiry/view.do?id=` `[verified: live HTML, 2026-08-14]`; also current Service Hub redirects |

An earlier version of this file called `?id=` "current" as though it were global.
It isn't: eSTM and insurance genuinely differ, so a helper written for one breaks on
the other.
`[verified live: SIT2 — recorded in tests/service-hub/pages/BasePage.ts · getTxnIdFromUrl doc; corrected against live HTML 2026-08-14]`

Consequence for any new code: never hardcode the param name.
`BasePage.getTxnIdFromUrl()` returns the whole `key=value` pair so callers can
splice it into a follow-up URL as `?${txnId}`, and URL waits should match all
three, e.g. `/slot\.do\?(id|txnId|transactionId)=/`.
`[verified: tests/service-hub/pages/BasePage.ts, SoftwareInstallationPage.ts · makePayment]`

## Login redirect chain

Submitting login kicks off a redirect chain to the portal home. Returning
before it settles lets a later `goto()` race the in-flight redirect and land on
the home page instead of the intended target — this is exactly what made the BO
listing and calendar navigations fail. `LoginPage.login()` therefore waits until
the URL has actually left `/public/login`, then waits for networkidle.
`[verified: tests/service-hub/pages/LoginPage.ts · login]`

**BO login lands on `<base>/home/` with `#home-menu`** — use that as the
landing-page assertion (supersedes the earlier note that BO login had no reliable
landing-page assertion). `LoginPage.loginAsBO()` still asserts only that the URL is
no longer the login page, with a message naming bad BO credentials as the likely
cause. `[verified: _reference/html/eauto/bo-home-hub-admin.html; tests/service-hub/pages/LoginPage.ts · loginAsBO]`

BO accounts without listing permission land on `main.do` with `#sc-search`
present but **without** `input[name="requestedFrom"]`. That absence is the "no
listing access" signal.
`[verified: tests/service-hub/pages/bo/SoftwareInstallationListingPage.ts:95-107 (live 2026-09-24)]`

**Logout differs per portal.** UCD = jQuery UI `#logout-confirmation` (Yes/No);
BO and Service Portal = native `confirm("Sure to logout?")`, which Playwright
auto-dismisses. See [quirks.md](quirks.md) § Modals.
`[verified: ucd-home-page-uat1-2026-09-24.html; bo-jomcheck-report-listing-vehicle-filter-active.html]`

## From Charmain's repo (eauto-qa-charmain, read 2026-10-27)

Read-only clone at `_reference/codebases/eauto-qa-charmain/` (branch
`consolidate-charmain`, commit 0ab45d1). No credential values were copied; only
env key names and login IDs that this file already lists.

### Base URL composition

1. One host, many instances, separated by a path segment:
   `https://<BASE_URL>/<BASE_PATH>/` — `BASE_PATH` examples in her code: `sit2`,
   `uat1`, `preprod1`, `eauto`. No hostname is committed; both come from the env
   file. `[charmain-repo: config/environments.ts:1-50]`
2. **`/eauto` and `/uat1` are two builds over ONE database** (observed on
   EAINT-12155): a change on one instance is visible on the other. That is how she
   mints pre-CR fixtures for a post-CR build and runs A/B regression.
   `[charmain-repo: .claude/skills/test-evidence-recording/references/eaint-12155.md:111-113]`
   **Conflict:** Teams 2026-08-12 says transactions on one branch are not visible
   on another — see [environments-history.md](environments-history.md) §5 item 11.
3. Read every env value through a function, never a module-level constant: ES
   imports run before the Playwright config loads the env file, so a constant
   holds the pre-load value. Same trap as our quirks.md § "Env vars set after a
   module imported its config never reach it". `[charmain-repo: config/environments.ts:14-20]`

### Login

1. Login screen `public/login/` (relative to the instance). Selectors:
   `#form-username`, `#form-password`, `button.to-login`; heading
   "Login to eAuto" visible before, hidden after.
   `[charmain-repo: src/auth/login.ts:20-48; config/environments.ts:52-55]`
2. **Host + instance guard before typing a password.** After opening the login
   page, read `page.url()` back; refuse if the host differs from `BASE_URL` or the
   path does not start with `/<BASE_PATH>`. A guessed or redirected URL can land
   on another environment whose login form looks identical.
   `[charmain-repo: config/environments.ts:57-77; src/auth/login.ts:38-49]`
3. **Navigate by clicking; a path is only an arrival check.** Her wizard opens a
   module by its dashboard tile, then asserts the URL matches the landing path
   (e.g. `view/ucd/stms/view.do`). Screen URLs carry session ids, so a constructed
   URL lands nowhere. `[charmain-repo: src/pages/wizard.page.ts:56-89; env/env-default:68-71]`
   Same rule as our scaffold skill §7.

### Personas (roles → env key names; values never in git)

| Key | Portal | Role | Env keys | Destructive |
|---|---|---|---|---|
| ucd | UCD | dealer, read-only listings | `UCD_USERNAME` / `UCD_PASSWORD` | no |
| ucdE2E | UCD | dealer for journeys that create/transfer | `UCD_E2E_*` | yes |
| ucdSsm | UCD | dealer with SSM document access | `UCD_SSM_*` | no |
| ucdNoPerm | UCD | permissions withheld (absence checks) | `UCD_NOPERM_*` | no |
| bo | BO | operator | `BO_*` | no |
| boFinance | BO | finance role | `BO_FINANCE_*` | no |
| boAdmin | BO | hub administrator | `BO_ADMIN_*` | yes |
| aatf | AATF | deregistration listings | `AATF_*` | no |
| jpj | JPJ | JPJ Hasil reader, Malay reports | `JPJ_*` | no |

The login ID is the portal LOGINID, not the display name. A missing key throws
naming the key, instead of failing later as "invalid login".
`[charmain-repo: config/personas.ts:1-122; env/env-default:25-45]`

BO Service Hub roles beyond Ops / CSE (from her EAINT-12131 notes): Hub Admin /
Admin / Probation are **one shared login whose role Ops switches**; Finance is a
separate login. Neither can access the Service Hub module.
`[charmain-repo: .claude/skills/test-evidence-recording/references/eaint-12131.md:463-475]`

### Dashboard and menu handles

1. **UCD dashboard tiles** are `button.dashboard-menu-item-btn` with labels:
   eSERAHAN, eSERAHAN TRANSACTION LISTING, UCD TO UCD, STMS, APT, BMK,
   BMK Listing, JOMCHECK REPORT, JOMCHECK TRANSACTION LISTING, INSURANCE,
   INSURANCE TRANSACTION LISTING, SSM DOCUMENT, SETTINGS.
   `[charmain-repo: src/pages/ucd/ucd-home.page.ts:7-52]`
2. **BO menu categories:** Account Management, Reports, Insurance, Transactions
   Relevant, eAuto Plus Relevant, Proforma Invoice / e-Invoice Listing, Support
   Tools, Settings, Settings (Hub Admin), JPJ Reports. BO home shows `#home-welcome`.
   `[charmain-repo: src/pages/bo/bo-home.page.ts:6-37]`
3. **Shared top bar:** `#home-link`, `#menu-link`, `a.my-account` (signed-in
   identity text), `li > a.logout`. UCD logout then asks Yes; BO logout raises a
   native dialog (she accepts it with `page.once('dialog')`).
   `[charmain-repo: src/pages/components/top-bar.ts:1-24; src/pages/ucd/ucd-home.page.ts:54-57; src/pages/bo/bo-home.page.ts:49-52]`
4. `#create-tx` is the "new transaction" button on STMS, eSerahan, BMK and
   JomCheck landing pages. `[charmain-repo: src/pages/wizard.page.ts:4-7, 91-99]`

### URLs seen in her code and notes

| Screen | Path (after `/<instance>/`) | Source |
|---|---|---|
| STMS landing | `view/ucd/stms/view.do` | `src/pages/ucd/stms-wizard.page.ts:31` |
| STMS wizard | `view/ucd/stms/transaction/view.do` | `stms-wizard.page.ts:32` |
| STMS step 1 seller auth | `auth-seller.do?category=<1/4/0>` (also `mykad-bypass`, `mykad-without` variants) | `stms-wizard.page.ts:41; tests/staging/ucd/stms-wizard/ucd-stms-wizard.e2e.spec.ts:65` |
| STMS step 2 | `data-entry.do` | `stms-wizard.page.ts:73` |
| STMS step 3 buyer auth | `auth-buyer.do` | `stms-wizard.page.ts:152` |
| STMS step 4 JPJ check | `jpj-enq.do` | `ucd-stms-wizard.e2e.spec.ts:86` |
| STMS step 5 payment | `payment.do` | `stms-wizard.page.ts:223` |
| STMS step 6 transfer | `jpj-sub.do` | `stms-wizard.page.ts:235` |
| STMS bulk payment (UCD) | `view/ucd/stms/bulk-payment/list.do`, search `#refNo` | `…/references/eaint-12054.md:370-376` |
| STMS listing (UCD) | `view/ucd/stms/enquiry/main.do`, rows `tr.odd`/`tr.even` | same |
| SSM listing (UCD) | `view/ucd/ssm/enquiry/` (needs From/To) | same |
| STMS listing (BO) | `view/stms/enquiry/` | same |
| SSM listing (BO) | `view/ssm/enquiry` | same |
| BO insurance quote enquiry | `view/insurance/insurance-quote-enquiry/` | `tools/insurance-quote-checker/data/config.ts:11` |

STMS steps: 1 Seller (Owner) · 2 Vehicle · 3 Buyer (Dealer) · 4 JPJ Check ·
5 Payment · 6 Transfer. The STMS transaction id is `?id=` from step 3 on.
ID-category codes: MALAYSIAN = 1, SYARIKAT = 4, MyPR = 0.
`[charmain-repo: src/pages/ucd/stms-wizard.page.ts:12-13; src/pages/wizard.page.ts:29-41; src/flows/stms.flow.ts:212-214]`

More Service Hub API endpoints (read from the detail page's inline scripts as
Ops, 2026-08-17, no request sent): BDP special remark
`/api/admin/service-hub/biometric/update-special-remarks.do`; installation
complete `/api/admin/service-hub/installation/complete.do`; installation failed
`/api/admin/service-hub/installation/fail.do`; SI special remark
`/api/admin/service-hub/installation/update-special-remarks.do` (not re-verified).
Each service type has its own namespace (`biometric/…` vs `installation/…`).
`[charmain-repo: .claude/skills/test-evidence-recording/references/eaint-12131.md:498-523]`

### `/obs` handoff types

Each `/obs` menu item is `<li class="obs-auth-required" data-type="…">` and goes to
`/<instance>/api/admin/onboarding/auth-redirect.do?type=<data-type>`:

| Screen | type |
|---|---|
| UCD Application Listing | `OBS_APPLICATION_LISTING` |
| UCD Pre-Application Listing | `PRE_OBS_APPLICATION_LISTING` |
| UCD Application Audit Log | `OBS_AUDIT_LOG_LISTING` |
| UCD Pre-Application Audit Log | `PRE_OBS_AUDIT_LOG_LISTING` |

After one redirect in the session, direct `/obs` navigation works. `/obs` pages
have no identity header; `#common-bar span.user-name` is on the BO shell
(`/<instance>/home/`) only. `/obs` listing export: `#to-export` →
`confirm("Sure to export?")` → `window.open(<ctx>admin/form/enquiry/export?<search-form>)`.
`[charmain-repo: .claude/skills/test-evidence-recording/references/eaint-11982.md:331-357, 736-760, 830-833]`

### Production is read-only (her suite's rule)

The `production` Playwright project `grepInvert`s `@destructive`; specs that
change state carry that tag, and `skipInProduction()` covers partly unsafe
checks. Probing production needs `PROBE_ALLOW_PRODUCTION=1`.
`[charmain-repo: playwright.config.ts:94-102; src/utils/skip.ts:1-12; tests/_explore/screen-probe.spec.ts:60-71]`
