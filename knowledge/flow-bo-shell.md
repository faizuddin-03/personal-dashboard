# Flow — the BackOffice (BO) portal shell (login, home menu, header, listings)

Every BackOffice page shares one chrome: the category menu on `/home/`, the
header with Home | Menu, the pending-transaction counter, and one listing/search
pattern. This file maps the whole BO menu so a ticket can find any BO page by
its menu label, then says which flow document (if any) covers it.

Hrefs below are verbatim from the captures except the environment path segment,
written as `/<env>/`. Each capture came from one run; the env it used is not
"the" env (see [eauto-portals.md](eauto-portals.md) § Never tie an environment to a general rule).

## 1. What BO is, who uses it, what depends on it

1. BO is the internal eAuto portal used by eAuto staff (CSE, support, admins)
   to search every dealer transaction, manage company/user accounts, run
   support tools and read JPJ/SSM/insurance logs.
   `[verified: _reference/html/eauto/ucd-home-hub-admin.html · span.category list]`
2. BO and UCD share one host and one login page; the account's role decides
   which portal you land in. `[verified: scripts/eauto-jomcheck/data/users.ts:13-14 comment; scripts/eauto-jomcheck/data/config.ts:14-17]`
3. Every BO-side verification step in other flows (Service Hub listing, JomCheck
   enquiry, eDereg logs, company accounts, insurance listing) starts from this
   shell. Read this first, then the module's flow doc from the tables in §3.

## 2. Entry points, login and landing

| Entry | Detail | Status |
|---|---|---|
| Login page | `/<env>/public/login/` (same page as UCD) | `[verified: tests/service-hub/utils/config.ts · PATHS.login "/public/login/"]` |
| Landing after login | `/<env>/home/` — `div#home-welcome` ("Good Afternoon, <name>") + `div#home-menu` category grid | `[verified: _reference/html/eauto/bo-home-hub-admin.html header "URL: /uat1/home/" · #home-welcome, #home-menu]` |
| Header Home link | `a#home-link` → `/<env>/home/` on every BO page | `[verified: _reference/html/eauto/bo-jomcheck-report-listing-vehicle-filter-active.html · #home-link]` |
| Header Menu dropdown | `a#menu-link` loads `/home/menu.jsp?source=menuLink` into `#menu-bar` | `[verified: same file · inline script]` |
| Deep link to any `/view/...` page | Works once logged in. House rule: `goto()` only `/home/`, then click | `[from Faizuddin, 2026-09-30, quoted in scripts/eauto-jomcheck/data/config.ts:26-30 "navigate via clicks, not page.goto()"]` |

### Login form DOM

1. **No capture of the UCD/BO login page exists.** Selectors come from code only.
2. Selectors in use:
   - `input[name="username"], input[placeholder="Username"]`; `input[name="password"], input[placeholder="Password"]`; `button:has-text("Login"), input[type="submit"], button[type="submit"]` `[verified: scripts/eauto-jomcheck/pages/LoginPage.ts:8-10]`
   - `input[type="text"]` / `input[type="password"]` / `button[type="submit"], input[type="submit"]`, each `.first()` `[verified: tests/service-hub/pages/LoginPage.ts:6-8]`
3. After submit, wait until the URL leaves `/public/login`, then networkidle. Returning
   earlier lets a later `goto()` race the redirect. `[verified: tests/service-hub/pages/LoginPage.ts:29-32]`
4. BO login assertion in the Service Hub suite = "URL is no longer `/public/login`". `[verified: tests/service-hub/pages/LoginPage.ts:49-50]`
   A stronger landing check is `#home-menu` on `/<env>/home/`. `[verified: _reference/html/eauto/bo-home-hub-admin.html · #home-menu]`
5. eauto-jomcheck retries the submit once if still on `/login`, and calls `dismissBanners()` after each submit. `[verified: scripts/eauto-jomcheck/pages/LoginPage.ts:44-53]`
6. `goto()` fallback: networkidle first, retry with domcontentloaded when the legacy portal aborts the first request. `[verified: tests/service-hub/pages/BasePage.ts:13-24]`

### Logout

1. Header `a.logout` runs a **native** `confirm("Sure to logout?")`, then
   `window.location.href = "/<env>/user/logout.do"`.
   `[verified: _reference/html/eauto/bo-jomcheck-report-listing-vehicle-filter-active.html · $("#header a.logout").click]`
2. Automation loads `/user/logout.do` directly instead of clicking. This also
   switches UCD↔BO accounts inside one browser context. `[verified: scripts/eauto-jomcheck/pages/LoginPage.ts:58-75; data/config.ts:18]`

## 3. The complete BO menu (Hub Admin account)

Source of the full tree: `_reference/html/eauto/ucd-home-hub-admin.html` — despite
its name it is the **BO** home (`/uat1/home/`, Hub Admin, captured 2026-08-21, untrimmed).
Cross-checked against `_reference/html/eauto/bo-home-hub-admin.html` (2026-09-30; five
categories collapsed to comments) and `_reference/codebases/AATF/EAINT-9306-bo-home-menu.html` (2026-08-24).
Markup: each category is `div.<roles> > table td > span.category + ul > li > a`; in the
2026-08-21 capture each `li` also holds `img[src$="arrow_next.gif"]`.
`[verified: _reference/html/eauto/ucd-home-hub-admin.html · span.category, ul li a]`

"Covered by" = which `knowledge/flow-*.md` documents the page.

### 3.1 Account Management — `div.Admin.HubAdmin`

| Label | href | Covered by |
|---|---|---|
| Manage Company Accounts | `/<env>/view/account/company` | [flow-ucd-company-listing.md](flow-ucd-company-listing.md); Print DO in [flow-device-purchase.md](flow-device-purchase.md) |
| Manage Backoffice User Accounts | `/<env>/view/account/user` | no flow doc yet |
| View UCD User Accounts | `/<env>/view/account/user/ucd` | no flow doc yet |
| *(commented out)* Branch | `/<env>/view/account/branch` | not rendered |
| Manage Bank/Credit Company Accounts | `/<env>/view/credit-account/company` | no flow doc yet |
| Manage Bank/Credit Company User Accounts | `/<env>/view/credit-account/user` | no flow doc yet (these accounts are likely the Service Portal users `[unconfirmed]`, see [flow-service-portal-shell.md](flow-service-portal-shell.md)) |
| Manage Bank/Credit Company IP Whitelist | `/<env>/view/credit-account/ipwhitelist` | no flow doc yet |
| Company Account Listing (Limited Features For UCD To UCD) | `/<env>/view/account/company/limited-features-ucd-to-ucd` | no flow doc yet |
| Manage AATF/PBT Account | `/<env>/view/account/dereg/aatf` | no flow doc yet |
| Manage e-Invoice Setup Company Listing | `/<env>/view/einvoice/company` | no flow doc yet |

Rules on these pages stated in CR test scripts (none captured live):

1. **Transaction Restriction (EAINT-9044)** `[from SharePoint TS #089 EAINT-9044]`:
   1. Setting "Transaction Restriction: ◎ Yes ◉ No (default)" sits below Block STMS
      Category on the company account; existing companies default No after deploy
      `[sheet (FT) BO Update Company Account, rows 3, 11]`.
   2. Manage Company Account listing filter "Transaction Restriction" right of Business
      Type, options All (default), Yes, No; the CSV follows the filter
      `[sheet (SnF) BO Manage Company Account, rows 3-5]`.
   3. BO users without the permission "can see but unable to access" the setting
      `[sheet (FT) BO Update Company Account, row 19]`.
   4. The UCD-side effect (the "restricted from creating transactions" popup) is in
      [flow-ucd-shell.md](flow-ucd-shell.md) § Other home-page bits.
2. **Company audit log entry format (EAINT-6762):** "[Field] Old: X New: Y", e.g.
   "[SSM Permission] Old: Unticked New: Ticked", "[ESTM SSM Permission]", "[Bypass
   Purchase SSM Permission]", "[eLKM Permission]", "[eLKM Permission - Max. Authorized
   User] Old: 2 New: 10", "[ESTM Permission - Max. Authorized User]", "[Company Name]",
   "[TIN Number]", "[Transaction Restriction]".
   `[from SharePoint TS #052 EAINT-6762, sheet Company Account Audit Log, rows 10-30]`
3. **Company account field validation (EAINT-8774)** `[from SharePoint TS #083 EAINT-8774, sheet Sheet1, rows 4-11]`:
   1. Postcode: "Postcode is required."; digits only, exactly 5; "Postcode must be 5
      digits only." `[rows 4-5]`
   2. Mailing address: "Mailing address is required."; max 300 characters `[rows 6-7]`.
   3. Director/Owner Name: "Director / Owner Name is required."; letters, digits and
      only "Apostrophe (') ii. Slash (/) iii. Dot (.) iv. Comma (,) v. Colon (:) vi.
      Dash (-) vii. Ampersat (@)"; auto-capitalised; max 100 `[rows 8-9]`.
   4. Director/Owner email: "Director / Owner Email Address is required."; prefix
      allows a–z, 0–9, dot, underscore, hyphen; max 100 `[rows 10-11]`.
4. **Bank/Credit Company account checkboxes (EAINT-11175):** "Allow UCD to share
   JomCheck Report", "Allow Login to Service Portal", "Allow Bypass Whitelisting
   Feature", placed below "Full Enquiry Permission". Defaults: "Full enquiry permission
   - ticked … Allow UCD to share JomCheck Report - unticked … Allow Login to Service
   Portal - ticked … Allow Bypass Whitelisting Feature - unticked". Non-authorised BO
   users see them disabled. `[from SharePoint TS #012 EAINT-11175, sheet Sheet1, rows 4-6, 17]`

### 3.2 Reports — `div.Admin.HubAdmin.Normal`

| Label | href | Covered by |
|---|---|---|
| JPJ Reports | `/<env>/view/jpj/report/payment/report.do?type=Office` | no flow doc yet |
| Account Balance Summary | `/<env>/view/report/account-balance-summary/index.jsp` | no flow doc yet |
| Account Balance Summary (Month / Year) | `/<env>/view/report/account-balance-summary-month-year/index.jsp` | no flow doc yet |
| Account Deposit / Adjustment Report | `/<env>/view/report/account-deposit-adjustment/index.jsp` | no flow doc yet |
| Company POB Balance Report | `/<env>/view/report/company-pob-balance-report/index.jsp` | no flow doc yet |
| POB Payment Report | `/<env>/view/report/POB-payment-report/index.jsp` | no flow doc yet |
| Statement of Account (UCD) | `/<env>/view/report/statement-of-account/index.jsp` | no flow doc yet |
| Transaction Summary Report | `/<env>/view/report/tx-summary-report` | no flow doc yet |
| Transaction Summary Report (State) | `/<env>/view/report/tx-summary-report-state` | no flow doc yet |
| Vehicle Movement Report (UCD) | `/<env>/view/report/vehicle-movement-report` | no flow doc yet |
| Interim Payment Report | `/<env>/view/report/interim-payment-report` | no flow doc yet |
| Reset Payment Report | `/<env>/view/report/reset-payment-report` | no flow doc yet |
| Inter-Branch Transfer History Report | `/<env>/view/report/inter-branch-transfer/index.jsp` | no flow doc yet |
| *(commented out)* Dealer Summary Report | `/<env>/view/report/dealer-summary-report/index.jsp` | not rendered |

### 3.3 Insurance — `div.Admin.HubAdmin`

| Label | href | Covered by |
|---|---|---|
| Insurance Permission Listing | `/<env>/view/insurance/insurance-permission-listing` | no flow doc yet |
| Insurance User Permission Log | `/<env>/view/insurance/user-permission-log` | no flow doc yet |
| Endorsement | `/<env>/view/insurance/endorsement` | no flow doc yet |
| Insurance Transaction Listing | `/<env>/view/insurance/enquiry` | [flow-eauto-insurance-enquiry.md](flow-eauto-insurance-enquiry.md) |
| Insurance Payment Transaction | `/<env>/view/insurance/insurance-payment-transaction` | no flow doc yet |
| Upload Insurance e-Certificate | `/<env>/view/insurance/insurance-upload-ecertificate` | no flow doc yet |
| Insurance Quote Enquiry | `/<env>/view/insurance/insurance-quote-enquiry` | no flow doc yet |
| Refer Risk Log | `/<env>/view/insurance/refer-risk-log` | no flow doc yet |
| Insurance Payment OTP Log | `/<env>/view/insurance/otp-payment-log` | no flow doc yet |

### 3.4 Onboarding — `div.Admin.HubAdmin.Normal`

| Label | href / handle | Covered by |
|---|---|---|
| UCD New Application | `/<env>/view/backoffice/support/onboarding/view.do` | [flow-ucd-onboarding.md](flow-ucd-onboarding.md) |
| UCD Application Listing | `href="#"` on `li.obs-auth-required[data-type="OBS_APPLICATION_LISTING"]` | [flow-ucd-onboarding.md](flow-ucd-onboarding.md), [flow-payment-channels.md](flow-payment-channels.md) |
| UCD Pre-Application Listing | `href="#"`, `data-type="PRE_OBS_APPLICATION_LISTING"` | same |
| UCD Application Audit Log | `href="#"`, `data-type="OBS_AUDIT_LOG_LISTING"` | no flow doc yet |
| UCD Pre-Application Audit Log | `href="#"`, `data-type="PRE_OBS_AUDIT_LOG_LISTING"` | no flow doc yet |

The four `href="#"` items navigate by script: `.obs-auth-required` click →
`window.location = "/<env>/api/admin/onboarding/auth-redirect.do?type=" + type`.
`[verified: _reference/html/eauto/ucd-home-hub-admin.html · inline script at top of #home-menu]`
`getAttribute('href')` returns `#` — click the item, or build the auth-redirect URL.

### 3.5 Transactions Relevant — `div.Admin.HubAdmin`

| Label | href | Covered by |
|---|---|---|
| STMS Transaction | `/<env>/view/stms/enquiry` | no flow doc yet |
| APT Transaction | `/<env>/view/apt/enquiry` | no flow doc yet |
| eSTM Transaction | `/<env>/view/estm/enquiry` | no flow doc yet (UCD side: [flow-estm.md](flow-estm.md)) |
| Deregistration Transaction | `/<env>/view/dereg/enquiry/main.do` | [flow-edereg.md](flow-edereg.md) |
| Jomcheck Transaction | `/<env>/view/jomcheck/enquiry` | [flow-jomcheck.md](flow-jomcheck.md) |
| SSM Transaction | `/<env>/view/ssm/enquiry` | no flow doc yet |
| eDereg Pre-Checking Transaction | `/<env>/view/dereg/precheck/enquiry/main.do` | [flow-edereg.md](flow-edereg.md) |
| Company Business Document Listing | `/<env>/view/system/company-business-document-listing/main.do` | no flow doc yet |

**[Reset] on STMS / eSTM listings (EAINT-8826).** BO Reset Payment: "[Reset] button is
displayed in the Action column"; after reset "UCD able to make payment again"
`[from SharePoint TS #087 EAINT-8826, sheet EAINT-8826, rows 3, 7]`. It sits
"alongside [View] and [Cancel] for a Failed transaction"
`[from SharePoint TS #042 EAINT-12403, sheet APT, row 56]`. No capture shows its markup.

### 3.6 eAuto Plus Relevant — `div.Admin.HubAdmin`

| Label | href | Covered by |
|---|---|---|
| BMK Transaction | `/<env>/view/bmk/enquiry/main.do` | no flow doc yet |
| RHB Payment Transaction (eAuto Plus) | `/<env>/view/payment/rhb-payment-transaction/plus` | no flow doc yet |

### 3.7 Support Tools — `div.Admin.HubAdmin`

| Label | href | Covered by |
|---|---|---|
| STMS Transaction | `/<env>/view/support/stms/` | no flow doc yet — **same label as §3.5, different page** |
| Support Audit Log (STMS, APT & eSTM) | `/<env>/view/support/support-audit-log/` | no flow doc yet |
| Audit Trail Log | `/<env>/view/report/audit-log` | no flow doc yet |
| Company Account Audit Log | `/<env>/view/report/company-audit-log` | no flow doc yet |
| Backoffice User Account Audit Log | `/<env>/view/report/backoffice-user-audit-log` | no flow doc yet |
| Blacklist Company ROC, MyKad No. & Vehicle No. Audit Log | `/<env>/view/report/blacklist-audit-log` | no flow doc yet |
| Pending/Failed APT Transaction Audit Log | `/<env>/view/apt/resubmission-audit-log/` | no flow doc yet |
| Pending STMS, APT & eSTM Audit Log | `/<env>/view/support/incomplete-txn-auditlog/` | no flow doc yet |
| RHB Reconciliation Audit Log | `/<env>/view/report/rhb-reconciliation-audit-log/` | no flow doc yet |
| JPJ Hasil Audit Log | `/<env>/view/report/jpj-audit-log/` | no flow doc yet |
| Resubmit Pending STMS, APT & eSTM | `/<env>/view/support/incomplete-txn/` | no flow doc yet (also the target of the header counter, §4.2) |
| Manual APT Trigger | `/<env>/view/stms/manual-trigger-apt` | no flow doc yet |
| Manage Pending/Failed APT Transaction | `/<env>/view/apt/enquiry/pending-or-failed` | no flow doc yet |
| eSTM Transaction | `/<env>/view/support/estm/` | no flow doc yet — **same label as §3.5, different page** |
| JPJ Enquiry | `/<env>/view/system/manual-jpj-enquiry/` | no flow doc yet |
| JPJ Enquiry (New) | `/<env>/view/system/new-manual-jpj-enquiry/` | no flow doc yet |
| Bulk STMS Cancellation | `/<env>/view/support/bulk-stms-cancellation/` | no flow doc yet |
| Bulk STMS Cancellation Audit Log | `/<env>/view/support/bulk-stms-cancellation-auditlog/` | no flow doc yet |
| Resubmit JPJ Final Submission (STMS) | `/<env>/view/backoffice/jpj/resubmission/stms/view.do` | no flow doc yet |
| Resubmit JPJ Final Submission (eSTM) | `/<env>/view/backoffice/jpj/resubmission/estm/view.do` | no flow doc yet |
| Resubmit JPJ Final Submission (eDereg Pre-Checking) | `/<env>/view/dereg/precheck/enquiry/resubmission/view.do` | [flow-edereg.md](flow-edereg.md) (link only; page not captured) |

### 3.8 Proforma Invoice / e-Invoice — `div.Admin.HubAdmin`

| Label | href | Covered by |
|---|---|---|
| Generate Proforma Invoice | `/<env>/view/proformainvoice/main/new.do` | no flow doc yet |
| Proforma Invoice / e-Invoice Listing | `/<env>/view/proformainvoice/enquiry/` | no flow doc yet |
| Credit Note Listing | `/<env>/view/creditnote/enquiry/main.do` | no flow doc yet |
| Biometric Device Purchase & Software Installation Listing | `/<env>/view/bo/service-hub/listing/main.do` | [flow-service-hub.md](flow-service-hub.md), [flow-device-purchase.md](flow-device-purchase.md) |

### 3.9 Settings — `div.HubAdmin.Admin`

| Label | href | Covered by |
|---|---|---|
| *(commented out)* Transaction Fees / Scheduled Task / Number Plate Conversion / JPJ Response Code Mapping | `/<env>/view/codes/` with `onclick='alert("TODO!"); return false;'` | not rendered |
| *(commented out)* Transaction and Payment Files | `/<env>/view/payment/batch-file/` | not rendered |
| RHB Payment Transaction | `/<env>/view/payment/rhb-payment-transaction` | no flow doc yet |
| 1 Layer Permission Listing | `/<env>/view/estm/estm-user-permission-layer1` | no flow doc yet |
| 2 Layer Permission Setup | `/<env>/view/estm/estm-user-permission` | no flow doc yet |
| eLKM Permission Listing | `/<env>/view/estm/lkm/lkm-user-permission` | no flow doc yet |
| eLKM Permission Log | `/<env>/view/estm/lkm/lkm-user-permission-log` | no flow doc yet |
| Blacklist Company ROC (STMS & eSTM) | `/<env>/view/account/blacklisted/companyroc` | no flow doc yet |
| Blacklist MyKad No. (STMS & eSTM) | `/<env>/view/account/blacklisted/mykad` | no flow doc yet |
| Blacklist MyKad No. (UCD User) | `/<env>/view/account/blacklisted/mykad-add-ucd-user` | no flow doc yet |
| Blacklist Vehicle No. | `/<env>/view/account/blacklisted/vehicle` | no flow doc yet |

### 3.10 Settings (Hub Admin) — `div.HubAdmin.Admin`

| Label | href | Covered by |
|---|---|---|
| Manual Payment Processing (STMS, APT, eSTM) | `/<env>/view/stms/file/` | no flow doc yet |
| JPJ XML Log (APT) | `/<env>/view/apt/jpj/log` | no flow doc yet |
| JPJ XML Log (STMS) | `/<env>/view/stms/jpj/log` | no flow doc yet |
| JPJ XML Log (ESTM) | `/<env>/view/estm/jpj/log` | no flow doc yet |
| JPJ XML Log (Deregistration) | `/<env>/view/dereg/jpj/log` | [flow-edereg.md](flow-edereg.md) |
| JPJ XML Log (eDereg Pre-Checking) | `/<env>/view/dereg/precheck/jpj/log/main.do` | [flow-edereg.md](flow-edereg.md) |
| JPJ XML Log (BMK) | `/<env>/view/bmk/jpj/log` | no flow doc yet |
| SSM XML Log | `/<env>/view/ssm/xml-log` | no flow doc yet |
| Generate Batch Invoice (STMS, APT, eSTM) | `/<env>/view/stms/export-tax-invoice` | no flow doc yet |
| Estm User Permission Log | `/<env>/view/estm/estm-user-permission-log` | no flow doc yet |
| Change Director Log | `/<env>/view/account/change-director-log` | no flow doc yet |
| Customize Display Message | `/<env>/view/system/display-messages` | no flow doc yet |
| Bulk Submission Setup (JPJ Enquiry, Payment) | `/<env>/view/bulk-submission-setup` | no flow doc yet |
| Bulk Submission Setup (JPJ Enquiry, Payment) Audit Log | `/<env>/view/report/bulk-submission-setup-audit-log` | no flow doc yet |
| Bulk Submission Control for System Maintenance | `/<env>/view/bulk-submission-control` | no flow doc yet |
| Bypass Purchase SSM (STMS & eSTM) | `/<env>/view/bypass-purchase-ssm/view.do` | no flow doc yet |
| JomCheck Report Listing | `/<env>/view/jomcheck/report-listing/index.do` | [flow-jomcheck.md](flow-jomcheck.md) |
| Bypass Purchase SSM (STMS & eSTM) Audit Log | `/<env>/view/bypass-purchase-ssm/audit-log.do` | no flow doc yet |

### 3.11 JPJ Reports — `div.HubAdmin.Admin`

| Label | href | Covered by |
|---|---|---|
| eAuto Reconciliation Summary Report | `/<env>/view/jpj/report/reconcile-v2/eauto-report.jsp` | no flow doc yet |
| eAuto STMS, APT and eSTM Transaction Listing | `/<env>/view/jpj/report/stms-apt-estm/list.do` | no flow doc yet |
| eAuto Reconciliation Summary Report (eAuto Plus) | `/<env>/view/jpj/report/reconcile-plus/eauto-report.jsp` | no flow doc yet |
| eAuto BMK, HTM dan eLKM Transaction Listing | `/<env>/view/jpj/report/plus/list.do` | no flow doc yet |
| eAuto eDereg Pre-Checking Transaction Listing | `/<env>/view/jpj/report/dereg/list.do` | no flow doc yet |
| eAuto Reconciliation Summary Listing | `/<env>/view/jpj/report/consolidated-reconcile/eauto-report.jsp` | no flow doc yet |
| JPJ Reconciliation Report (HASIL) | `/<env>/view/jpj/report/reconcile/` | no flow doc yet |
| JPJ eSTM Report (HASIL) | `/<env>/view/jpj/report/reconcile-estm/` | no flow doc yet |

### 3.12 Wholesale — `div.Admin.HubAdmin`

| Label | href | Covered by |
|---|---|---|
| Manage Wholesale Company Account | `/<env>/view/wholesale/company/` | no flow doc yet |
| Wholesale Transaction Listing | `/<env>/view/wholesale/listing/` | no flow doc yet |
| Wholesale Refund Listing | `/<env>/view/wholesale/refund/` | no flow doc yet |
| Wholesale Vehicle Payment Listing | `/<env>/view/wholesale/vehicle-payment/` | no flow doc yet |
| Wholesale Rejection Listing | `/<env>/view/wholesale/rejection/` | no flow doc yet |
| Wholesale Payment Listing | `/<env>/view/wholesale/payment/` | no flow doc yet |
| Alternative Vehicle Maintenance | `/<env>/view/support/alt-vehicles/maintenance.do` | no flow doc yet |
| Alternative Vehicle Maintenance Audit Log | `/<env>/view/support/alt-vehicles/audit-log.do` | no flow doc yet |

### 3.13 Pages reached from a listing or the header, not from the menu

| Page | URL / handle | Source |
|---|---|---|
| Service Request details | `/<env>/view/bo/service-hub/detail.do?id=<txnUuid>&apptId=<apptUuid>` (`target="_blank"`) | `[verified: _reference/html/eauto/bo-biometric-device-purchase-software-installation-listing.html · Action "View"]` |
| Appointment Calendar | button `#sc-appt-cal` on the Service Hub listing; no direct URL | `[verified: same file · #sc-appt-cal]`; [eauto-portals.md](eauto-portals.md) |
| JomCheck transaction details | `/<env>/view/jomcheck/enquiry/view.do?id=<uuid>&back=false` (new tab) | `[verified: _reference/html/eauto/bo-jomcheck-transaction-enquiry.html · Action "View"]` |
| eDereg Pre-Checking details | `/<env>/view/dereg/precheck/enquiry/view.do?id=<uuid>` | `[verified: _reference/codebases/AATF/EAINT-9306-bo-precheck-transaction-listing.html header]` |
| Company edit | `/<env>/view/account/company/edit.get?id=<n>`; back link `a.back-to` "« Back" | `[verified: _reference/tickets/EAINT-12166/EAINT-12166-company-management-edit-details-uat1-2026-09-23.html]` |
| Print DO form | `/<env>/view/account/user/print.do`, from `#to-print-do` on Company edit | `[verified: _reference/tickets/EAINT-12166/EAINT-12166-company-management-print-do-manual-form-uat1-2026-09-23.html header]` |
| My Account | `/<env>/view/ucd/my-account/view.do?type=Office` (header `a.my-account`) | `[verified: _reference/html/eauto/bo-home-hub-admin.html · #common-bar]` |
| Contact Us / Terms & Conditions / Privacy | footer `window.open('/<env>/public/contact-us.jsp' / terms-condition.jsp / privacy.jsp)` | `[verified: _reference/html/eauto/bo-jomcheck-report-listing-vehicle-filter-active.html · #footer]` |

## 4. Shared DOM handles — verbatim

### 4.1 Header (`div#header`, every BO page)

```
#home-bar   ol.inline > a#home-link "Home |"  ·  a#menu-link "Menu ▾"
            div#incomplete-txn-notification-wrapper  "<n> Pending Transaction Found!"
#common-bar span.user-name "<name>," · a.my-account "My Account |" · a.logout "Logout"
div#menu-bar.hidden            ← filled by the Menu dropdown
div#countdown-screen-timeout   ← LoginSessionTimer, observed 1439:xx (~24 h)
div#session-timeout-dialog     ← "You still have <n> sec before this login session expired."
div#logo > img eAuto_TM_logo.svg
```
`[verified: _reference/html/eauto/bo-jomcheck-report-listing-vehicle-filter-active.html · div#header]`

The header sits **after** `#container` in DOM order and is positioned by CSS. `[verified: same file]`

### 4.2 Pending-transaction counter

1. On ready, `POST /<env>/ajax/support/incomplete-txn/notification.do`; when the
   response contains "Pending Transaction" it replaces `#incomplete-txn-notification-wrapper`'s HTML.
2. Clicking the wrapper goes to `/<env>/view/support/incomplete-txn/`.
3. Observed: "3 Pending Transaction Found!" and "7 Pending Transaction Found!". Shared data — never assert a count.
`[verified: same file · doPendingTransactionCountQuery(); _reference/html/eauto/ucd-home-hub-admin.html · #incomplete-txn-notification-wrapper]`

### 4.3 Menu dropdown and role filtering

```js
$("#menu-bar").load(_contextPath + "/home/menu.jsp?source=menuLink", function() {
    $("#menu-bar").css({...}).slideToggle('fast');
    $("#menu-bar div").hide();
    var _userRole = "HubAdmin";          // split on "," when several roles
    $("div."+_userRole).show();
});
$("body").click(function() { $("#menu-bar").slideUp(); });
```
`[verified: same file · $("#header #menu-link").click]`

1. Each category div carries role classes (headings in §3). Only divs matching the account's `_userRole` show.
2. Observed BO `_userRole`: `"HubAdmin"`. `[verified: same file; _reference/tickets/EAINT-12167/EAINT-12167-backoffice-01-sr-details-uat1.html]`
3. Inferred from the classes: a `Normal` account sees only **Reports** and **Onboarding**; `Admin` and `HubAdmin` see every category. `[unconfirmed — no Normal or Admin BO capture]`
4. "Settings (Hub Admin)" has the same classes as "Settings" (`HubAdmin Admin`), so its name is not enforced by a distinct class. `[verified: _reference/html/eauto/ucd-home-hub-admin.html]`
5. Click a menu link by **text scoped to its category**, e.g. `div:has(> table span.category:text-is("Settings (Hub Admin)")) a:text-is("JomCheck Report Listing")`. `[unconfirmed selector — derived from the markup]`
6. **Super Admin vs Hub Admin (EAINT-10038).** Menus only Super Admin sees include
   Company Account Listing (Limited Features For UCD To UCD), Manage AATF/PBT Account,
   JPJ Reports, Account Balance Summary, Statement of Account (UCD), Transaction Summary
   Report. `[from SharePoint TS #003 EAINT-10038, sheet access ref, rows 3-32]` This
   conflicts with the 2026-08-21 Hub Admin capture, which shows Company Account Listing
   (Limited Features…), Manage AATF/PBT Account and the JPJ Reports category (§3.1,
   §3.11). The script may predate a later permission change, or the capture account
   may hold more than Hub Admin. `[unconfirmed]` An inactive BO user's login shows
   "Unable to login. Please contact your supervisor or admin."
   `[from SharePoint TS #003 EAINT-10038, sheet Test Scenario, row 8]`
7. **EAINT-12348 (PBT as eDereg users) opens Manage AATF/PBT Account to every BO
   user (future, not deployed).** "Existing: Manage AATF/PBT Account is accessed by
   authorised BackOffice users." "New Expected: All BackOffice users can view and
   access Manage AATF/PBT Account. The access setting follows Manage Company
   Accounts under BackOffice > Account Management." `[from ticket EAINT-12348, SRD
   v1.0 §2.2.4 REQ-002, line 132; unchanged in v1.1 per Scout study]` The EAINT-10038
   matrix has "Manage Company Accounts | ✔ | ✔ | ✔" `[from SharePoint TS #003
   EAINT-10038, sheet access ref, R5]`, so after deploy Hub Admin should see it.
   Test it as before vs after. EAINT-10038 Jira holds no access rule of its own.
   `[source: pipeline EAINT-12348, Scout answer to Scribe, 2026-10-27]` Whether Hub
   Admin already sees it on staging today (the item 6 conflict) is `[unconfirmed]`.

### 4.4 Listing / search page pattern

Most BO listings share this skeleton:

```
td.not-to-print > form#search-form
   inputs with id = name (vehicleNo, refNo, companyName, companyRoc, chassisNo)
   input#fromDate / #toDate (readonly, class hasDatepicker), "*" = span.required
   input#paymentFrom / #paymentTo (readonly datepickers)
   input[type=hidden][name=pageNo] value=1
   input#to-search  (type=submit)
   a.to-reset "Reset"
   a#to-export.hidden "Export CSV" | "Export"   ← hidden until a search returns
<b>page title</b> in a centred td under the form
td#result  ← results injected here
   "<n> record(s) in total"
   table > thead tr.header > th ; tbody tr.odd / tr.even ; td.center
   Action: <a href=".../view.do?id=<uuid>&back=false" target="_blank">View</a>
```
`[verified: _reference/html/eauto/bo-jomcheck-transaction-enquiry.html; _reference/codebases/AATF/EAINT-9306-bo-dereg-transaction-listing.html; _reference/codebases/AATF/EAINT-9306-bo-precheck-transaction-listing.html]`

Variants — do not assume one spelling:

| Element | Variants seen | Source |
|---|---|---|
| Search button | `input#to-search` value `SEARCH Now` (JomCheck enquiry, Dereg, JPJ XML Logs), `Search Now` (eDereg Pre-Checking), `SEARCH` (JomCheck Report Listing); Service Hub `input#sc-search[type=button]` value `Search` | the listed captures |
| Reset | `a.to-reset`; `a#to-reset` (Report Listing); `a#sc-reset` (Service Hub) | same |
| Export | `a#to-export.hidden` "Export CSV"; `a#to-export[style="display:none;"]` "Export" whose href becomes `/<env>/download/admin/jomcheck/report-listing/export.do?vehicleNo=<v>&pageNo=1` after search; `a#sc-export` "Export" (Service Hub) | `bo-jomcheck-report-listing-vehicle-filter-active.html · #to-export` |
| Status select | `select[name=status]#to-filter` (JomCheck, Dereg); `select#status` (eDereg Pre-Checking) | `EAINT-9306-bo-precheck-transaction-listing.html` header |
| Record count | `<n> record(s) in total` in a span; `div#result-summary[data-count]` (Report Listing); `input#sc-result-count` (Service Hub) | listed captures |
| Search-by radios | JPJ XML Logs: two `input[name=type]` radios, **both `id="type"`**, values `vehicleNo` / `refNo` | `EAINT-9306-bo-jpj-xml-log-dereg.html` |
| Mutually exclusive fields | Report Listing: with Vehicle No. in use, `#chassisNo` carries `disabled` | `bo-jomcheck-report-listing-vehicle-filter-active.html` |
| Draft toggle | `input#includeDraft[name=includeDraft]` "Includes Draft Trx" — Dereg listing only | `EAINT-9306-bo-dereg-transaction-listing.html` |

The Service Hub listing is a newer variant: `form#sc-filter-form` (GET to
`/<env>/api/admin/service-hub/listing/list.get`), `span.sc-fg > label.sc-lbl`,
required marker `span.sc-req`, results in `#sc-result-region > table#sc-combined-tbl`,
Time Slot as a checkbox dropdown `#sc-slot-dd` (`#sc-slot-all`, `.sc-slot-item`).
Its datepicker inputs have generated ids (`dp1790065437969`) — select by `name=`.
`[verified: _reference/html/eauto/bo-biometric-device-purchase-software-installation-listing.html]`

### 4.5 Datepicker (jQuery UI, legacy `DP_jQuery`)

1. Inputs are `readonly`; `fill()` does nothing. `[verified: every BO listing capture · readonly="readOnly"]`
2. Opened widget: `div#ui-datepicker-div` with `a.ui-datepicker-prev` / `a.ui-datepicker-next`,
   `select.ui-datepicker-month`, `select.ui-datepicker-year` (2016 → current year),
   day cells `td[onclick="DP_jQuery.datepicker._selectDay('#fromDate',<m>,<y>, this);return false;"] > a.ui-state-default`.
   `[verified: _reference/html/eauto/bo-jomcheck-transaction-enquiry-datepicker.html]`
3. Max date = today: later days are `td.ui-datepicker-unselectable.ui-state-disabled` and Next is disabled in the current month. `[verified: same file]`
4. Fill strategies, each proven on one page:
   - JomCheck enquiry: pick in the widget (year select, month select, real day click). `[verified: knowledge/flow-jomcheck.md §7s]`
   - Service Hub listing: `$el.datepicker("setDate", new Date(y, m-1, d))`; `.value` + `change` is ignored by Search. `[verified: knowledge/eauto-service-hub.md § BO listing rules, citing pages/bo/SoftwareInstallationListingPage.ts:109-139]`
   - Where a To picker is re-ranged by the From picker's `onSelect`, only a real click works; `setDate` does not fire onSelect. `[verified: knowledge/flow-jomcheck.md §7t item 7 — Service Portal page]`
5. eDereg listings: `#fromDate` is compulsory; `selectFromDateToday()` = click `#fromDate` → `.ui-datepicker-today a`. `[verified: knowledge/flow-edereg.md, BO Pre-Checking listing section]`
6. Values are DD-MM-YYYY; ISO is silently dropped. `[verified: knowledge/quirks.md § Dates]`

### 4.6 One-month date range

1. Every From/To filter accepts at most one month unless the module says otherwise. `[source: Faizuddin, 2026-10-05, in knowledge/quirks.md § Dates]`
2. BO Service Hub listing: Date Requested From/To mandatory, default current month, min 1 day, max 1 month; Appointment Date max 1 month. `[from SRD EAINT-10960 v1.2 §2.3.2.5 #1, in knowledge/eauto-service-hub.md]`
   Selecting From auto-sets To = From + 1 month. `[from QA team, 2026-09-24, in knowledge/flow-service-hub.md — not captured live]`
3. **No BO capture shows BO's error text** for an over-long range. The only captured wording is the Service Portal's ([flow-service-portal-shell.md](flow-service-portal-shell.md) § 7). `[unconfirmed for BO]`

### 4.7 Pagination

No BO capture shows a pager (every captured search fit one page). The form posts
`pageNo` as a hidden input. `[verified: input[name=pageNo] in every BO listing capture]`
The UCD pager is `.pagination` (see [flow-ucd-shell.md](flow-ucd-shell.md)); whether BO uses it is `[unconfirmed]`.

### 4.8 Dialogs on BO pages

1. jQuery UI confirm dialogs: `.confirm-dialog-btn` (Yes) / `.cancel-dialog-btn` (No). `[verified: tests/service-hub/pages/BasePage.ts:74-86; scripts/eauto-jomcheck/pages/BasePage.ts:147-158]`
2. Service Hub listing Cancel: `onclick="return scCancel('<apptId>')"` opens `#sc-cancel-dialog` "Sure to cancel?". `[verified: bo-biometric-device-purchase-software-installation-listing.html]`
3. `div#custom-dialog > span#custom-field` sits at the end of every BO `<body>` (generic message dialog). `[verified: bo-jomcheck-report-listing-vehicle-filter-active.html]`

### 4.9 Footer and version markers

```
#footer  "Best Compatible With Mozilla Firefox V36.0.4"
         "Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved."
         Contact Us | Terms & Conditions | Privacy   (window.open popups)
```
`[verified: bo-jomcheck-report-listing-vehicle-filter-active.html · #footer]`
No build or release number is rendered in the BO chrome; take release identity
from [releases.md](releases.md). `[verified: same file — no version string]`

## 5. Decision points

1. **Which portal you land in** depends on the account role, not the URL. `[verified: scripts/eauto-jomcheck/data/users.ts:13-14]`
2. **Which categories show** depends on `_userRole` (§4.3).
3. **Onboarding listing links** leave BO through `auth-redirect.do` into the `/obs` app (§3.4).
4. **Export** is hidden or `href="#"` until a search returns rows.

## 6. Preconditions and test data

1. BO credentials are env vars: `EAUTO_BO_USER`/`_PASS` (Service Hub suite), `EAUTO_USERNAME`/`EAUTO_PASSWORD` (eauto-jomcheck). `[verified: knowledge/eauto-portals.md § Credentials; scripts/eauto-jomcheck/data/users.ts:15-19]`
2. Listings render nothing until a search runs with the compulsory From date set.
3. Staging is shared; pending counts and record totals move between runs.

## 7. Popups and traps

1. **No campaign/announcement dialog chain on BO.** No BO capture contains the UCD `dialogSelectorOrder` chain or `#dialog-*-campaign` divs. `[verified: grep of _reference/html/eauto/bo-home-hub-admin.html and ucd-home-hub-admin.html — 0 matches for "dialog" or "campaign"]` `dismissBanners()` after a BO login is a harmless no-op.
2. **Native `confirm()` on Logout.** Playwright auto-dismisses native dialogs, so clicking `a.logout` does nothing. Load `/user/logout.do`, or `page.once('dialog', d => d.accept())` before the click. `[verified: handler in bo-jomcheck-report-listing-vehicle-filter-active.html; workaround scripts/eauto-jomcheck/pages/LoginPage.ts:58-75]` UCD uses a jQuery UI dialog instead ([flow-ucd-shell.md](flow-ucd-shell.md)).
3. **Duplicate menu labels.** "STMS Transaction" and "eSTM Transaction" each appear in Transactions Relevant **and** Support Tools with different hrefs. `getByRole('link', {name})` takes the first. Scope by category. `[verified: §3.5 vs §3.7]`
4. **"Jomcheck Transaction" ≠ "JomCheck Report Listing"** — enquiry page vs the 29-column report listing, in different categories. `[verified: _reference/html/eauto/bo-home-hub-admin.html header comment]`
5. **Duplicate ids:** `#type` on both JPJ XML Log radios; `#custom-dialog`/`#custom-field` at body end; `td#result` twice in one Report Listing capture. Prefer `name=`. `[verified: EAINT-9306-bo-jpj-xml-log-dereg.html; bo-jomcheck-report-listing-vehicle-filter-active.html]`
6. **Generated datepicker ids** on the Service Hub listing (`dp<timestamp>`) change per load. `[verified: bo-biometric-device-purchase-software-installation-listing.html]`
7. **Header after content in DOM order**, so a page-wide `.first()` on text can hit page content before the header link.
8. **Login redirect race** — §2 and [eauto-portals.md](eauto-portals.md) § Login redirect chain.
9. **Menu captures disagree.** The 2026-08-24 capture lacks about 30 links present on 2026-08-21 and 2026-09-30 (2 Account Management, 11 Reports, 2 Support Tools, 3 Proforma, 6 Settings (Hub Admin) items, the whole JPJ Reports category) although its header says "Not trimmed". Most likely a partial paste. `[unconfirmed]` Treat §3 (2026-08-21, re-confirmed by 2026-09-30 where visible) as the reference.

## 8. What is NOT covered

1. The UCD/BO login page DOM (no capture) and its error messages.
2. The rendered `/home/menu.jsp` dropdown (only the loader script is captured).
3. Any non-HubAdmin BO account (`Admin`, `Normal`); §4.3 visibility is inferred.
4. BO pagination markup; BO error text for an over-one-month range.
5. The session-timeout dialog firing.
6. Every page marked "no flow doc yet" in §3 — only its label and href are known.
7. `_reference/tickets/EAINT-12166/eAuto_BackOffice_Existing_Mockup_20260818.html` is a designer mockup (top bar "Home | Menu ▾", "Username , My Account | Logout"). It matches the live header layout but is not live DOM. `[verified: mockup lines 73-77]`


## Additions from the 2026-10-23 flows study

Source: lib/eautoFlows/modules/*.ts (data mirror for /eauto/flows). Only facts not already in this file.

- Some new BO pages ship behind hard-coded user whitelists not in the SRD (e.g. JomCheck BO listing, Bypass BioID, Bypass Purchase SSM page, Insurance Cancellation); check on deploy night. [azfar: knowledge/_core/roles-and-accounts.md] [azfar: knowledge/portals/backoffice/open-questions.md]
- [unconfirmed] What Ops, CSE, Finance, Bintang Prospek, JPJ Dereg and JPJ Hasil can see is not written in the Azfar repo. [azfar: knowledge/portals/backoffice/open-questions.md]
- Kod Hasil: H0272423 (STMS, eSTM, APT), H0272404 (BMK, TH, eDereg Pre-Checking), H0171105 (eLKM), '-' for non-JPJ. [azfar: cr/EAINT-10168/LEDGER.md]
- Insurance user (EAINT-11887) sees Insurance type only; Summary section hidden. [ts: RECON_ROLEPERM_TS1] [azfar: cr/EAINT-10168/LEDGER.md]
- Azfar records a 02:00 snapshot step before reconciliation compares (EAINT-12407). [azfar: cr/EAINT-10168/LEDGER.md]
- Credit Note Module (8700) status path: Draft, Pending Approval, In Progress, Completed or Failed; side exits Cancelled (from Draft) and Rejected (from Pending Approval). Finance reject needs a reason (1 to 100); Ops raises a new Credit Note from the PFI. [miro: uXjVHUk5_XI= ([eAuto - BackOffice] 8700 - Credit Note Module)]
- Signature popup shows on the first approval only. [miro: uXjVHrYDgq8= (EAINT-12028)]


## Additions from Charmain's QA repo (added 2026-10-27)

Source: read-only clone of a QA colleague's repo, `_reference/codebases/eauto-qa-charmain/` (branch consolidate-charmain, commit 0ab45d1, last commit 2026-10-13). **Status: a colleague's notes, not verified live by us.** Tag: `[charmain-repo: <path>:<line>]`.

### BO shell notes from her slice index
- Two-level menu (category, then screen); "STMS Transaction" appears under both Transactions Relevant and Support Tools, "so the category is part of the address". Same trap as §7 item 3 here. [charmain-repo: docs/modules/bo/README.md:7-10]
- "Role decides which categories appear at all. An absence observed as a restricted role proves nothing about the feature — check it as the most privileged role available before calling a control missing." [charmain-repo: docs/modules/bo/README.md:28-30]
- "Export controls sit behind a native `confirm` dialog on several report screens and open the file in a popup. A page that returns zero rows often hides the export entirely." Example prompt on the BO STMS and SSM listings: "Sure to export?". [charmain-repo: docs/modules/bo/README.md:31-33] [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:384-388]
- "The company edit form has around 190 fields. Any write is diff-checked before and after". [charmain-repo: docs/modules/bo/README.md:34-35]
- A Probation account has no Onboarding group in its menu. [charmain-repo: test-scenarios/bo-application-extend-button/bo-application-extend-button.md:246-248]
- Her post-deploy BO smoke: Reports › Transaction Summary Report opens and shows its Search button (BOREP_TS1, staging, P2). [charmain-repo: test-scenarios/bo-reports/bo-reports.md:44-48] [charmain-repo: test-scenarios/bo-reports/bo-reports.assertions.yaml:23-57]
- AATF portal (her index): Deregistration Transaction Listing and eDereg Pre-Checking Transaction Listing, both listing-and-search with a per-row View and a cancel path; the same records surface in BO under Transactions Relevant. [charmain-repo: docs/modules/aatf/README.md:10-16]
- JPJ Hasil portal (her index): Malay UI, read-only in practice; screens Senarai Transaksi STMS, APT dan eSTM eAuto; Senarai Transaksi BMK, HTM dan eLKM eAuto; Senarai Transaksi eDereg Pre-Checking; Laporan Ringkasan Penyamaan Penyata eAuto; Laporan Ringkasan Penyamaan Penyata BMK, HTM dan eLKM eAuto. Types chosen by checkbox; date range mandatory; assert Malay headings as shown. [charmain-repo: docs/modules/jpj/README.md:7-21]

### Reconciliation Summary Listing — EAINT-12055 SRD v1.0 (23.07.2026)
SRD copied to `_reference/tickets/EAINT-12055/EAINT-12055-SRD-v1.0-20260723.pdf` (+ `-text.txt`). Author Lim Yi Link. CCB-867, EAUTO-991. Page: "Reconciliation Summary Listing (Reconciliation Listing tab)", here at `/view/jpj/report/consolidated-reconcile/eauto-report.jsp` (§3 above).
- Assumption 1: "A payment and an approved transaction are considered a matched pair when they share the same Payment Ref No." [charmain-repo: docs/source-material/bo-all-reconciliation-exclude-resubmission-srd-v1.0.txt:140]
- Assumption 2: "For a matched pair, the Approved Amount in eAuto and the Payment Amount in RHB offset each other". [charmain-repo: docs/source-material/bo-all-reconciliation-exclude-resubmission-srd-v1.0.txt:144]
- Old issue: a transaction approved on a different date from the RHB payment "appears as two separate lines in the Recon list", each with a different "Refund Required". [charmain-repo: docs/source-material/bo-all-reconciliation-exclude-resubmission-srd-v1.0.txt:204-208]
- Cross-month: "A payment made on 30 July shall be matched with a transaction approved on 1 August." [charmain-repo: docs/source-material/bo-all-reconciliation-exclude-resubmission-srd-v1.0.txt:266-283]
- "Once a payment and an approved transaction have been successfully matched, the system shall remove both records from the reconciliation listing". [charmain-repo: docs/source-material/bo-all-reconciliation-exclude-resubmission-srd-v1.0.txt:292-298]
- "The system shall continue to display transactions that do not have a matching payment". [charmain-repo: docs/source-material/bo-all-reconciliation-exclude-resubmission-srd-v1.0.txt:310-311]
- "Upon deployment of this enhancement, the system shall apply the same matching logic to existing records in the reconciliation listing." [charmain-repo: docs/source-material/bo-all-reconciliation-exclude-resubmission-srd-v1.0.txt:323-331]
- Her observations (EAINT-104 pack, applied to the LKM Refund fee): a pair stays removed when the statement is re-uploaded and compared again; a failed final submission then a successful resubmission leaves no line; same reference but different amount → both removed (QA ruling 2026-10-01). [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:211-218,333-336]
- Conflict (SRD vs build): SRD assumption 2 says matched amounts "offset each other" and is silent on unequal amounts; the build removes a same-reference pair with different amounts, so a short payment never reaches Finance (her Q13). [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:410]
- From SRD EAINT-10168 v1.1 (as she quotes it): compare runs at 10:00 and 12:00; while a mismatch stands nothing goes to JPJ Hasil by itself; Summary lets an officer add a Nota and upload by hand; Payment Date To fills to the month's last day, no future date, To not before From; nine columns incl. Vehicle Number (grid lacks it, export has it); export should write an audit entry (it does not; EAINT-12419 closed); Proforma Invoice and failed payments never listed; weekend payments reconcile next working day (measured running on Saturday and Sunday). [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:337-375,415]
- Kod Hasil "-" for a module with no JPJ fee (eVOC, LKM Refund): Listing tab only, never Summary or the JPJ Hasil upload. Matches §"Additions from the 2026-10-23 flows study" Kod Hasil list here. [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:49-52]
- Onboarding (Pre-Application / Application) Fiuu payments are not on this page today: "Fiuu transactions fall under the "Other" category and are not reconciled in the Reconcile Summary listing." EAINT-12336 (Fiuu onboarding recon CR, To Do, no SRD) plans to reconcile them "on the same page as the current reconciliation", keyed on the Fiuu Transaction ID from the merchant-portal Excel. See business-rules-from-test-scenarios.md §11 items 13–14. [from ticket EAINT-12336, Jira description rows 4–5, captured 2026-10-27] [unconfirmed: planned design]
