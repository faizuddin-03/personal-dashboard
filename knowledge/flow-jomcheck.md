# JomCheck module — pages, portals and the CR lineage

First flow document for this module. Built 2026-09-29 while studying EAINT-12339
(Gateway API v1.9→v2.0 upgrade) and its three predecessor CRs. Sourced from Jira
descriptions (`[from Jira, 2026-09-29]`), SRD v0.3 read in full and later diffed
against SRD v1.0 line-by-line — **v1.0 is the baselined, sign-off copy of v0.3,
zero requirement changes between them** (`[verified: SRD_EAINT-12339_v0.3_20260928.docx
and SRD_EAINT-12339_v1.0_20260929.docx, both saved to
_reference/tickets/EAINT-12339/]`), and a live walkthrough of the legacy CRs'
test-scenario workbooks on SharePoint (`[from SharePoint, QA Team site, 2026-09-29
— QA Team/Shared Documents/1. eAuto Project/eAuto - CR Test Scenarios/EAINT-10089,
10937, 11175 - JomCheck Enhancement CRs]`, screenshotted but not locally captured
— see §5), plus a cross-check against a colleague's (Azfar) independent TS draft
(`_reference/tickets/EAINT-12339/Azfar - EAINT-12339_Test_Scenarios_draft.xlsx`).

## 1. What JomCheck is

JomCheck is a vehicle claim-history checking service. eAuto (the internal system)
consumes it through ezAuto's **JomCheck Gateway API**, currently v1.9, migrating
to v2.0 on **05.10.2026 (Monday) night**, ezAuto completing at 11:30pm. ezAuto
owns and operates the API; eAuto is a client. Staging was updated to v2.0 by
ezAuto ahead of the production date, so eAuto's own staging code can be tested
against it before that date lands `[from SRD v0.3 §2.1.3]`. The v2.0 switch
shipped as planned (EAINT-12339, release S34.4-20261005; KJ hotfix 2026-10-06
for an invalid JomCheck API result — see §4).
`[from appraisal proof pack 2026-10-15 §A]` `[from Teams via memory digest, 2026-10-14]`

## 2. Portals and pages touched, across the whole CR lineage

Not every CR touches every page — see §4 for what belongs to which ticket.

- **UCD** — JomCheck Transaction Details page (report purchase, share checkbox,
  "download report" button).
- **BackOffice** — JomCheck Report Listing (+ its Excel export), JomCheck
  Transaction Details, Bank/Credit Company Account Page (permission checkboxes).
- **Service Portal** — this is a genuinely separate link/login from the standard
  eAuto UCD/BO site, used by banks and credit companies `[from Faizuddin,
  2026-09-29]`. Within it there are (at least) three distinct surfaces, easy to
  conflate:
  1. **Ownership Claim Listing → Transaction Details** — for a newly-approved
     eSTM transaction, a permitted bank/credit company can view the JomCheck
     report inline on the transaction's own details page.
  2. **Hire Purchase Ownership → JomCheck Report Listing** — a standalone listing
     page of all approved JomCheck transactions, one row per transaction, with
     its own filters, columns and export/bulk-download. Originally named
     "JomCheck Transaction Listing" in SRD v1.0 of EAINT-10937, renamed to
     "JomCheck Report Listing" in v1.1.
  3. A permission-gated **credit-company export** of that listing, with its own
     column set (see §4).
- **Wholesale** — triggers a JomCheck purchase too, confirmed in scope for
  EAINT-12339 by Faizuddin after consulting the team (2026-09-29), reversing an
  earlier in-session call that had deferred it as "a data prep step, picked up
  later." **Not documented in the EAINT-12339 SRD at all**, but the flow itself
  is confirmed from a parallel Wholesale JomCheck price-change CR's test
  scenarios (RM18→RM20, shared by Faizuddin 2026-09-30 — ticket key not given,
  cites internal PR #2307 and REQ-001–007):
  - **There is no login screen.** The whole flow is **chatbot-driven** — a
    "served dealer" (seller) or "buyer" role interacts with the bot directly.
    "Login to eAuto as Wholesale" (an earlier guess in this file's history) is
    wrong and was corrected 2026-09-30.
  - Entry point is a **match card** for a listed vehicle, which carries a
    "Book here or purchase JomCheck report" line — clicking it opens the
    **payment page** (shows the JomCheck price + SST).
  - After payment: the bot sends a **purchase confirmation message**, and an
    **e-invoice/receipt** is generated separately.
  - The bot can also answer **direct price questions** and has an **FAQ
    knowledge-base** path as a second route to the same answer — both must
    agree with the payment page's figure (this matters for the price CR, not
    directly for EAINT-12339, but confirms the bot is a real Q&A surface, not
    just a purchase trigger).
  - **Still unconfirmed for EAINT-12339 specifically:** how the JomCheck report
    is actually *downloaded* after purchase (via the bot, or only visible
    later through UCD/BO), and whether Wholesale reads the re-sourced/deprecated
    API fields directly anywhere or only ever displays JomCheck data via the
    UCD/BO surfaces this CR already covers. Confirm before treating
    `_reference/tickets/EAINT-12339/` TS32/33/34 (Wholesale section) as
    anything more than best-effort.

## 3. Access is permission-gated, not open to all banks/credit companies

A bank/credit company only sees a given JomCheck report if:

1. **UCD granted permission** — a checkbox UCD ticks during or within a set
   window after purchasing the report, sharing it with a specific
   bank/credit company (EAINT-10089/10937). The sharing window has moved across
   SRD revisions: 14 days (EAINT-10089 v0.1) → 30 days (both EAINT-10089 v1.1
   and EAINT-10937 v1.1). **Confirm current value before writing any TS that
   depends on it** — it has changed at least once already.
2. **BackOffice granted the account-level permission** — a checkbox on the
   Bank/Credit Company Account Page (EAINT-11175): "Allow UCD to share JomCheck
   Report," alongside two siblings, "Allow Login to Service Portal" and "Allow
   Bypass Whitelisting Feature." All three were added to remove a prior manual
   IT-ticket-based process for Ops.

Both gates exist because EAINT-10937's E2E tests explicitly split scenarios by
account type — a **Superadmin account (Jasons)** sees `JomCheck = YES` /
`Latest JomCheck Report` differently from a **Credit Company account**, and the
test workbook runs the same before/after-deployment check for both.

## 4. The CR lineage — what each ticket actually delivered

| Ticket | Portal | What it delivered | Status |
|---|---|---|---|
| EAINT-10089 | UCD & BackOffice | JomCheck report sharing checkbox (UCD side); JomCheck fee increase RM18→RM20 across all UI, invoices, reports, videos | Done |
| EAINT-10937 | Service Portal | Ownership Claim Listing → Transaction Details permission-gated report view; new JomCheck Report Listing page for banks/credit companies, with its own filter/column/export spec | Done |
| EAINT-11175 | BackOffice | 3 new permission checkboxes on Bank/Credit Company Account Page (share JomCheck, Service Portal login, bypass whitelisting) | Done |
| EAINT-12339 | UCD, BackOffice, Service Portal, Wholesale | Gateway API v1.9→v2.0: re-source 3 deprecated fields, add Possible Total Loss/BER, expand Severity 4→6 bands. Wholesale trigger confirmed in scope 2026-09-29, not in the SRD | Done: fix version S34.4-20261005, 3 QA man-days, production switch 2026-10-05 night; KJ hotfix 2026-10-06 for invalid JomCheck API result (supersedes "In progress, Code Review as of 2026-09-29") `[from appraisal proof pack 2026-10-15 §A]` `[from Teams via memory digest, 2026-10-14]` |
| EAINT-12412 | UCD & BackOffice (invoice + e-Invoice only) | Split the single RM20.00 JomCheck invoice/e-Invoice line into 2 lines, RM18.00 + RM2.00, each with 8% SST; total stays RM21.60 | Ready For Development in Jira on 2026-10-15; dev ETA was Fri 2026-10-09 (Sia Zhong Tai); fix version S34.X-20261020/21; QA estimate 1 + 1 days (May Chin, 2026-10-15) |

EAINT-12339's SRD explicitly cites EAINT-10089 and EAINT-10937 as already having
delivered "JomCheck report sharing feature and permission control" — out of
scope for the API-upgrade CR (`[from SRD v0.3 §2.1.2, Out-of-Scope item 3]`).

**Standing scope note for EAINT-12339 specifically** (may not generalise to
future CRs without checking): Faizuddin confirmed 2026-09-29 that "scenarios for
credit companies will not be included in this CR. this CR will only check for
the API we receive from ezAuto" — meaning the Ownership Claim Listing /
Service-Portal-credit-company surfaces from EAINT-10937 are regression territory
only for EAINT-12339, not new-scope test cases. The Service Portal work EAINT-12339
*does* own is narrower: just the Severity counter expansion on the existing
JomCheck Report Listing (REQ-008/010) — the 3 re-sourced columns and Possible
Total Loss/BER are explicitly BackOffice-only (SRD v0.3 §2.1.2 items 7–8).

## 5. Legacy test-scenario workbooks (captured locally 2026-10-16)

Location: SharePoint, QA Team site → `Shared Documents/1. eAuto Project/eAuto -
CR Test Scenarios/EAINT-10089, 10937, 11175 - JomCheck Enhancement CRs/`.
Three files, one per ticket, each already executed (all rows seen were `PASS`):

- `EAINT-10089 - ... .xlsx` — 2 sheets: "Price Change Functional" (RM18→RM20,
  TS-001 to TS-012, covers UCD Home Page, JomCheck Report page, JomCheck Intro
  Video, Get JomCheck Report, Invoice/e-Invoice both portals, SST Payment
  Report, Payment Breakdown Report, Download Payment Document, UCD Payment
  Report) and "JomCheck Invoice Price" (not opened this session).
- `EAINT-10937 - ... .xlsx` — 6 sheets: Progress Tracker, Configuration, E2E,
  "Checkbox Behaviour (Special TS)", "Permission TS", "Functional Testing
  (S&F)". The E2E sheet's TS18 pattern: create eSTM transaction, purchase
  JomCheck via vehicle number and again via chassis number, with/without
  sharing, verify in both a Superadmin and a Credit Company Service Portal
  account — checking `Ownership Claim Listing > JomCheck = YES/NO` and
  `Ownership Claim Details > Latest JomCheck Report` before/after deployment.
  "Functional Testing (S&F)" sheet documents the JomCheck Report Listing export
  columns for credit companies: #, Company Name, Company ROC, Purchase Date,
  JomCheck Report Sharing Date, Search by Vehicle Number, Search by Chassis
  Number, Total Lost History (newly added), Avg. Retail Price, Recommended
  Trade Price, Flood History, Windscreen Claim (newly added), Multiple
  Registration of Car Plate/Chassis No., Count(s) of Date of Loss, Count(s) of
  Incidents Severity Scale. Listing paginates at 50 rows; Reset clears filters
  but not search.
- `EAINT-11175 - ... .xlsx` — not opened this session; permission-checkbox
  scenarios for the Bank/Credit Company Account Page.

**Now captured locally** (supersedes "not captured; retry the download"): the
SharePoint sweep of 2026-10-16 downloaded all three, plus the other JomCheck CR
scripts, to `_reference/sharepoint/eauto-cr-test-scenarios/`. Catalogue numbers
in [cr-test-scenario-catalogue.md](cr-test-scenario-catalogue.md): #007
EAINT-10089, #010 EAINT-10937, #012 EAINT-11175. The rules they state are in §5a.
`[from SharePoint library listing 2026-10-16]`

## 5a. Rules from the JomCheck CR test scripts (SharePoint sweep, 2026-10-16)

Tested expectations from the team's CR scripts, not verified system behaviour.
Check the live system or the newest SRD before one drives a decision. The full
JomCheck list (price display, SST report, payment popup, documents) is in
[business-rules-from-test-scenarios.md](business-rules-from-test-scenarios.md) §5.

1. **Search by vehicle or chassis (EAINT-6475)** `[from SharePoint TS #050 EAINT-6475]`:
   1. Vehicle Number radio selected by default; the other field greyed out
      `[sheet Functional TS, rows 7-8]`.
   2. Chassis keeps * / - and spaces; "System auto removes special characters
      (except for * / -)"; non-ASCII removed; lowercase converted to uppercase;
      "System blocks further input after 30 characters" `[sheet Functional TS,
      rows 19-22]`.
   3. Not found: "Chassis not found. Try again with another chassis" / "Vehicle
      not found. Try again with another vehicle", Tx Pending `[sheet E2E TS,
      rows 8, 16]`.
   4. API down: "Jomcheck API is temporarily unavailable now, please try again
      in 10 minutes." → Tx Failed, [Pay Now] not shown `[sheet Regression TS, row 8]`.
   5. Failed transaction: vehicle and chassis not editable, Resubmit not shown;
      a chassis-bought report shows Vehicle No "-" in listings `[sheet E2E TS, row 22]`.
   6. Success text: "Report is retrieved successfully. You can download the
      report now or access it later through the JomCheck report listing."
      `[sheet E2E TS, row 7]`.
2. **BO JomCheck Report Listing (EAINT-8638)** `[from SharePoint TS #073 EAINT-8638]`:
   1. Vehicle number auto-uppercased; special and non-ASCII characters removed
      `[sheet SnF Fields & Results, rows 8-10]`.
   2. Chassis keeps "- / space *"; removes others such as ~ < ] = ! `[rows 14-15]`.
   3. Search is **exact-match**: "Partial Vehicle Number | Result will display
      unmatched" `[row 26]`.
   4. No match: the script expects "0 record(s) in total" and an exported CSV
      holding only the header `[sheet E2E, row 10]`. The on-screen half is
      superseded by the live run of 2026-10-05: the page shows the row "No
      records found. Please ensure there are existing JomCheck report purchase
      records." and `#result-summary` stays hidden (§7q item 6). The
      header-only CSV is not yet checked live `[unconfirmed]`.
   5. Unauthorised users: "JomCheck Report Listing" hidden `[sheet Authorized
      Users, row 14]`.
3. **Resubmit visibility (EAINT-9203, v2 by May)** `[from SharePoint TS #093
   EAINT-9203, sheet 9203 TS v2 (May), rows 8-15]`:
   1. Payment OK + Tx Failed: "'Resubmit' action is NOT showing for UCD but
      remain showing for BO user" `[row 8]`; after BO resubmits successfully,
      both hide it `[row 9]`. Matches the BO capture in §9g.
   2. Approved (any LHDN status), Pending, New: not shown on UCD or BO `[rows 10-15]`.
   3. Payment Failed + Tx Failed: not shown on either `[row 13]`. The v1 sheet
      agrees: its TS5/TS10 titles say "is showing", but their Expected Result
      says "not showing" on both UCD and BO `[sheet 9203 TS v1 (Zuhaira), rows
      12, 17]`. The title is a typo; this is not a conflict.
      `[from Faizuddin, 2026-10-16, after reading both sheets]`
4. **Maintenance and Pending (EAINT-9786, ezAuto spec 1.6).** Maintenance
   message: "Unable to retrieve JomCheck results due to system maintenance.
   Please try again later." → Transaction No "-", Payment "-", Tx Status
   "Pending". The report shows "Avg Market Value - Approx. New Car Price".
   `[from SharePoint TS #112 EAINT-9786, sheet Sheet1, rows 3-4]`
5. **Sharing window text (EAINT-10937).** "Share Report with Financial
   Institution (Bank and Credit Company) (Optional) You are allowed to share
   your JomCheck report with other banks or credit companies by ticking the
   checkbox until {date d30 > dd-mm-yyyy}" — the 30-day window of §3 item 1
   `[from SharePoint TS #010 EAINT-10937, sheet E2E, row 18]`. Ticking a
   company shows a [Share] button `[row 6]`. No credit companies configured →
   the section is not displayed `[row 15]`. Revoking the UCD's sharing
   permission hides the section, also after a failed payment `[sheet Checkbox
   Behaviour (Special TS), rows 5-7]`.
6. **JomCheck API for credit companies (EAINT-11757)** `[from SharePoint TS #016
   EAINT-11757, sheet Sheet1]`:
   1. Keys: "algorithm (RS256 · RSA-3072)" `[row 7]`.
   2. Partner row after provisioning: "TYPE = CREDIT COMPANY, KEYS = '1
      active', STATUS = ACTIVE" `[row 9]`; audit entries COMPANY_CREATED and/or
      CREDENTIAL_ISSUED `[row 10]`.
   3. Rotation asks for confirmation; old key "Expiring", new key "Active"
      `[row 11]`. Revoking makes the key "Revoked" (still listed) and it must
      actually fail `[rows 12-13]`.
   4. Report call: "HTTP 200 with report JSON including documentUrl and
      documentUrlExpiresAt. PDF is NOT inside the JSON." `[row 15]`.
   5. Every auth failure is the same generic 401 `[from SharePoint TS #001
      EAINT-11757, sheet 11757 JomCheck API, row 6]`.
7. **BO JomCheck Transaction Listing "Payment To" date picker (EAINT-1245):**
   defaults to today; "Unable to select future dates" and "Unable to select
   date after 30 days" `[from SharePoint TS #043 EAINT-1245, sheet Sheet1, rows 3, 6-7]`.

## 6. Mock-up vs SRD conflicts — confirmed directly from the mock-up source, 2026-09-30

Both mock-ups were read in full 2026-09-30 (`[verified: Mockup_EAINT-12339_JomCheck_Report_Listing_20260928.html
and Mockup_EAINT-12339_Service_Portal_JomCheck_Report_Listing_20260925.html, both
saved to _reference/tickets/EAINT-12339/]`). Also confirmed byte-identical (md5)
to the copies still attached under the v1.0 SRD row — republishing v1.0 did not
touch either mock-up.

1. **Possible Total Loss "Yes" trap is real, not just Azfar's claim.** BackOffice
   mock-up row 4's sample data has both claims typed `"Own Damage (OD)"` (ICAP
   code 1), yet hardcodes `ptl: "Yes"`. Per SRD REQ-004, the vehicle-level flag
   should only be `"Yes"` when a claim is ICAP code **16** (Actual Total Loss) —
   code 1 doesn't qualify. The mock-up's own sample data contradicts the SRD's
   stated rule. Don't copy this row as a valid worked example.
2. **Severity counter order genuinely conflicts.** Service Portal mock-up's
   actual data: `sev: [["Severe","1"], ["High","0"], ["Medium","1"], ["Low","0"],
   ["Critical","0",true], ["Catastrophic","0",true]]` — order is **Severe, High,
   Medium, Low, Critical, Catastrophic**, with the 2 new bands appended at the
   end (the `true` flag marks them as new in the mock-up's own styling). SRD
   REQ-008 says the order is **"Severe, Critical, Catastrophic, High, Medium and
   Low"** — Critical/Catastrophic placed right after Severe, not at the end.
   **Unresolved** — needs a BA decision on which is authoritative before the
   counter-order can be a pass/fail check.

## 7a. Test-execution golden rules (from the TS workbook header, sent to seniors 2026-09-30)

These apply to any JomCheck testing, not just EAINT-12339 — the workbook prints
them once at the top of the sheet, above section A, so every row inherits them
without repeating the caveat:

1. **eSim-connected → PDF report is a dummy.** To confirm details reflected
   correctly, cross-check the Report Listing against eSim's own data, not the
   PDF.
2. **API-connected → PDF report contains real details.** Can cross-check
   against the Report Listing as normal.
3. **API results are random and cannot be pre-determined** — don't write a
   test step that assumes a specific claim/severity value comes back from a
   live API call; only eSim gives controllable, specific values.
4. **API has a limit of 20 reports per day** — budget test runs against this
   when planning API-connected sessions; eSim has no such limit.
   `[confirmed: Faizuddin, 2026-10-23]` The new JomCheck (API v2.0) limit is 20
   per day. The "10 per day" in Azfar's EAINT-12339 STATUS.md is an older/other
   version.

## 7b. EAINT-12339 TS workbook status (2026-09-30)

The 37-scenario workbook (`12339_TS01`–`12339_TS37`, sections A–I: UCD;
BackOffice Listing; BackOffice Listing Existing/Pre-push; BackOffice Export;
BackOffice Transaction Details; Service Portal; Wholesale; API Testing;
Regression) was sent to seniors for review 2026-09-30. **Treat this as the
current baseline until senior comments come back** — don't restart drafting
from an earlier numbering/section shape.

Structural changes from the last recorded version in this file's history:
gained an **API Tested** column (between Field Reference and QA — currently
blank/`N/A` on most rows) and a **Field Reference** column (right of Remarks,
pointing to the Field Reference sheet on the rows that need it: TS01, TS25).
TS35 (API raw-response check) now says "Request for raw API response from dev"
instead of a bare "inspect" instruction, since the tester side can't reach the
API/backend logs directly.

## 7c. DOM captured for automation, 2026-09-30

Live HTML pasted directly by Faizuddin (not Chrome-downloaded) for UCD,
BackOffice and Service Portal JomCheck pages, saved per the repo's capture rule
to `_reference/html/eauto/` — see the "JomCheck" section of
[_reference/html/README.md](../_reference/html/README.md) for the full file
list. Key selectors, by page:

- **Click paths from home into JomCheck** (confirmed 2026-09-30, replacing
  `page.goto()`-to-deep-path navigation per Faizuddin's standing rule —
  automation must click real UI, not jump by URL):
  - **UCD**: home page (`/view/ucd/home.do`) → `#jomcheck` dashboard tile
    (`_reference/html/eauto/ucd-home-page-uat1-2026-09-24.html`) → JomCheck
    Report menu → `#create-tx` ("PURCHASE JOMCHECK REPORT").
  - **BO**: home page (`/home/`) → "Settings (Hub Admin)" category → the
    "JomCheck Report Listing" link
    (`_reference/html/eauto/bo-home-hub-admin.html`) — its href
    (`/view/jomcheck/report-listing/index.do`) differs from an earlier
    guessed path (`/view/admin/jomcheck/report-listing`); click by link text,
    don't `goto()` either. The guessed path is also what the capture header
    of `_reference/html/eauto/bo-jomcheck-report-listing.html` gives as the
    URL (`/uat1/view/admin/jomcheck/report-listing`); the menu href
    `/<env>/view/jomcheck/report-listing/index.do` is the page URL. Only the
    **export** path carries `/admin/`:
    `/<env>/download/admin/jomcheck/report-listing/export.do?vehicleNo=<v>&pageNo=1`.
    `[verified: _reference/html/eauto/bo-home-hub-admin.html; bo-jomcheck-report-listing.html]`
    Separately, "Transactions Relevant" → "Jomcheck
    Transaction" reaches the BO Transaction Enquiry page.
  - **Service Portal**: home page (`/credit/home/`) → "Hire Purchase
    Ownership" category → the "JomCheck Report Listing" link.
- **UCD JomCheck Report menu** (`ucd-jomcheck-report-menu.html`): `#create-tx`
  ("PURCHASE JOMCHECK REPORT"), listing button via
  `onclick="window.location='/uat1/view/ucd/jomcheck/enquiry/'"`.
- **UCD purchase form** (`ucd-jomcheck-purchase-*.html`, 3 states): radio
  `#vehicleNoRadio`/`#chassisNoRadio`, inputs `#vehicleRegNo`/`#vehicleChassisNo`,
  submit `#to-check-vehicle`. After vehicle found: share checkboxes
  `.share-cc-pay` (pre-payment) — note the class changes to `.share-cc`
  post-payment, same page, don't reuse one selector across both states — and
  `#to-pay` ("Pay Now"). After payment: `#to-view-report` ("Download Report"),
  `#to-search-new-vehicle` ("Search Another Vehicle"). Result text lives in
  `#result`/`#desc` spans, color-coded green on success.
- **UCD transaction listing** (`ucd-jomcheck-transaction-listing.html`): filter
  inputs `#vehicleNo`/`#refNo`/`#chassisNo`/`#fromDate`/`#toDate`/`#to-filter`,
  submit `#to-search`. Results render into `#result` as a `.custom-table`; each
  row's "View" link is `/uat1/view/ucd/jomcheck/enquiry/view.do?id=<uuid>`.
- **UCD transaction details** (`ucd-jomcheck-transaction-details.html`):
  `#to-print-invoice`, `#to-print-e-invoice`, `#to-print-report` (all download
  directly, no further page state to capture). Status banner is
  `.trx-details-status.approved`.
- **BO transaction enquiry** (`bo-jomcheck-transaction-enquiry.html`): same
  filter shape as UCD plus `#companyName`/`#companyRoc`/payment-method/LHDN
  filters; results table's "View" link opens in a new tab
  (`target="_blank"`) at `/uat1/view/jomcheck/enquiry/view.do?id=<uuid>&back=false`.
  A **Failed** row also carries `| <a href="#" class="to-resubmit" txid="<uuid>"
  title="to resubmit <Transaction No.>">Resubmit</a>` in the same Action cell
  — see §9g (`bo-jomcheck-transaction-enquiry-failed-resubmit.html`, 2026-10-15).
- **BO transaction details** (`bo-jomcheck-transaction-details.html`): same
  print buttons as UCD plus `#specialRemark` textarea + `#to-specialRemark`.
- **BO JomCheck Report Listing** (`bo-jomcheck-report-listing.html`) — **the
  primary automation target for EAINT-12339**: filter `#vehicleNo`/`#chassisNo`,
  submit `#to-search`, `#to-export` link becomes
  `/uat1/download/admin/jomcheck/report-listing/export.do?vehicleNo=<v>&pageNo=1`
  once a search is active. The 29-column table has no per-column `id`s — column
  identity is positional (`<th>` text), confirmed against the captured header
  row. Multi-claim cells render as `1. <value><br>2. <value><br>` inside a
  single `<td class="col">` — **not** separate rows; automation must split on
  the numbered-line pattern, not assume one `<tr>` per claim.
- **Service Portal home + listing** (`service-portal-home-and-jomcheck-listing.html`):
  entry link `/uat1/credit/home/jomcheck-report-listing/main.do`. Filter adds
  `#sharedDateFrom`/`#sharedDateTo` (required, marked with `.required`),
  `#paymentDateFrom`/`#paymentDateTo`. Severity counters render as
  `Severe - N<br>High - N<br>Medium - N<br>Low - N<br>Critical - N<br>Catastrophic - N`
  in one `<td>` — confirms the mock-up's order (§6, item 2) against a second
  independent source (this live page), not just the mock-up file. Bulk
  download: `.jc-dl` row checkboxes, `#jc-dl-all` select-all,
  `#jc-bulk-dl` link text flips from hidden to `"Download files (N)"`.
- **Service Portal report details** (`service-portal-jomcheck-report-details.html`):
  PDF rendered inline via `<iframe class="jc-pdf-viewer" src="/uat1/api/credit/jomcheck-report-listing/print.do?transactionId=<uuid>#toolbar=1...">`
  — this is a real, automatable PDF URL (not a blob download trigger like
  UCD/BO's print buttons), useful if TS35-style API-response assertions need a
  second confirmation path.

**Still not captured** — Wholesale's match-card/payment-page/chatbot screens
(TS32-34), and any UCD/BO page in its **post-v2.0-push** state (every BO
listing row captured this session is pre-push: Possible Total Loss/BER both
`N/A`). Automation for TS05-TS19 (the new-value assertions) needs a fresh
capture after a v2.0-connected transaction exists, since no such row was
available to capture live yet.

## 7c-i. UCD purchase payment confirm dialog (confirmed 2026-10-02)

Clicking "Pay Now" on the UCD purchase form opens a jQuery UI dialog titled
"Payment" — `_reference/html/eauto/ucd-jomcheck-purchase-payment-confirm-dialog.html`.
Same `.confirm-dialog-btn`/`.cancel-dialog-btn` convention as the rest of this
app (e.g. the logout confirmation, `tests/service-hub/pages/BasePage.ts`'s
identical helpers) — **must be accepted or the purchase never completes**.
This was missing from `UcdJomCheckPurchasePage.payNow()` initially: the
automation clicked Pay Now, then immediately read the result text, which was
still "Vehicle number found." because the page was blocked behind the
unconfirmed dialog. Fixed by adding `waitForDialog()` +
`acceptConfirmDialog()` to `BasePage` and calling them inside `payNow()`.
Dialog text (English/Malay/Chinese) confirms it's specifically an RHB
sufficient-funds check: "Are you sure you want to proceed with this payment?
Please ensure that there is sufficient fund in your RHB account."

**⚠ `#result`'s TEXT is not a reliable completion signal for a REAL
API-connected payment — wait for the "Download Report" button instead.**
First fix attempt (2026-10-03): had `payNow()` poll for `#result` to change
away from its pre-click "Vehicle number found." text, assuming a real
payment eventually rewrites it (to "...successfully", like eSim's path
does). That assumption was wrong — Faizuddin, same day: "after clicking pay
now, the automation still checks the wording for Vehicle Number Found. by
right, shouldnt check that anymore." A real API-connected payment doesn't
reliably update `#result`'s wording at all; what DOES reliably change is the
"Download Report" button (`#to-view-report`) — **absent** from the
pre-payment "vehicle found" state, **present** in the post-payment "paid"
state (confirmed from both captured HTML states). `payNow()` now waits for
that button to become visible instead
(`this.downloadReportBtn().waitFor({ state: 'visible', timeout:
CONFIG.paymentProcessingTimeout })`) — the real signal, and the same thing
every downstream step needs anyway. `UcdJomCheckPurchasePage.isReportReady()`
exposes this as a boolean so every spec's own "Confirm the payment
completed" step asserts the real signal instead of matching text.
`CONFIG.paymentProcessingTimeout` (5 minutes — Faizuddin confirmed a real
payment takes around 2 minutes end to end, so this gives headroom) and
`playwright.config.ts`'s per-test `timeout` (raised to 480s detailed / 420s
otherwise, was 180s/60s — a 5-minute wait alone would blow through the old
ceiling) both still apply. This lives in the shared `payNow()` method, so it
covers every TS that calls it (TS01/02/03/04/05/17/35/PURCHASE) without
needing a per-TS fix.

**Every JomCheck-API TS (TS02/TS27/TS35) now downloads AND persists its
report, regardless of what else in the test does or doesn't pass.**
Faizuddin, 2026-10-03: "for all JomCheck API ts, make sure it downloads and
save the report, whatever the scenario is. Since the download from JomCheck
is limited, we need to make sure we get all details possible in case need to
refer in the future." `UcdJomCheckPurchasePage.downloadReportAsText(label)`
and `BoJomCheckTransactionDetailsPage.downloadReportAsText(label)` both now
save the PDF into `PW_EVIDENCE_DIR` (falling back to a deleted temp file
only when that env var isn't set, e.g. a bare CLI run) instead of discarding
it after parsing — it then shows up in the dashboard's evidence list with
its own download link, and in the bulk-download zip, via the same generic
evidence infra built for Excel downloads (§ below / the skill). `label` is
scenario+vehicle-specific (`"TS02-report-<vehicleNo>"`,
`"TS27-report-<vehicleNo>"`, `"TS35-report-<vehicleNo>"`) so multiple
scenarios sharing one run's evidence folder never overwrite each other's
saved report. TS35 didn't download a report at all before this — the shared
`purchaseAndOpenListing()` helper (TS05/TS17/TS35) now takes an optional
`{ downloadReportLabel }` so only TS35 pays the extra download cost, right
after payment completes and before logging out of UCD (the button only
exists on that page).

## 7d. Automation coverage as of 2026-10-03

`scripts/eauto-jomcheck` automates, via `app/eauto/jomcheck`:
- **TS02** — purchase by vehicle no. → download the report PDF → log into
  BackOffice → search the same vehicle no. in the Report Listing →
  **crosscheck the PDF's extracted text against the listing's 5 re-sourced
  columns** (Odometer Reading, Type of Claim, Total No. of Parts Approved,
  Possible Total Loss, Possible BER), asserting every non-blank listing
  value appears in the PDF. Revised 2026-10-03 from an earlier, lighter
  version (purchase → assert the download is a `.pdf`) once the workbook's
  own TS02 steps turned out to include the BO crosscheck all along — the
  earlier version undersold the TS. Uses `UcdJomCheckPurchasePage
  .downloadReportAsText()` (new — downloads via `downloadReport()`, saves to
  a temp file, extracts text with `pdf-parse`, normalises to uppercase,
  deletes the temp file). **This assumes TS02's own precondition is true
  ("Must connect to JomCheck API")** — per the workbook's Golden Rule #1/#2,
  an eSim-connected run gets a DUMMY PDF with no real details to crosscheck;
  if this test fails because the PDF text doesn't contain values the listing
  shows, check which source (eSim vs real API) actually served the
  transaction before assuming the automation is wrong. `pdf-parse` /
  `@types/pdf-parse` were added to `scripts/eauto-jomcheck/package.json` for
  this — same library `scripts/secarang-insurance/pages/PaymentSuccessPage.ts`
  already uses for its own PDF-vs-page crosscheck, copy that pattern rather
  than re-deriving it.
- **TS01** — full UCD purchase (by vehicle no.) → download the report →
  BackOffice listing shows the transaction with the 5 re-sourced/new columns
  readable (Odometer Reading, Type of Claim, Total No. of Parts Approved,
  Possible Total Loss, Possible BER). Values are logged as `DETAIL:` lines for
  a reviewer to eyeball, not hard-asserted non-blank — that unconditional
  guarantee is TS17's job, not TS01's.
- **TS03** — same purchase flow but by **chassis no.** instead of vehicle no.
  (`UcdJomCheckPurchasePage.submitChassisNo()`, already existed), then
  BackOffice listing filtered by chassis no. (`searchByChassisNo()`, already
  existed) shows the same 5 columns.
  **⚠ A chassis-no submission's result text reads "Chassis number found."
  — NOT "Vehicle number found." like the vehicle-no path.** `[verified: live
  test run, 2026-10-03]` — the first live TS03 run failed asserting the
  vehicle-no wording here (copied without checking), confirming the two
  input paths render genuinely different `#result` text, not just a
  different label on the same message. `getResultText()` itself is unchanged
  (reads whichever text is actually there) — only the spec's own assertion
  needed fixing. No live HTML of this chassis-found state is captured yet
  (only the vehicle-no found state is, in
  `_reference/html/eauto/ucd-jomcheck-purchase-vehicle-found.html`) — capture
  it per the standing HTML rule next time this screen is seen live.
  No running-counter format exists for
  chassis numbers (unlike vehicle no.s), so the dashboard's "Chassis no."
  field is a plain required text input — the person types a real one each
  run, via `JOMCHECK_TS03_CHASSIS_NO`.
- **TS04** — checks the exact Pay Now prompt wording ("Vehicle number found.
  Pay now (RM20.00 + 8% Service Tax) to purchase the report." — new
  `UcdJomCheckPurchasePage.getFullPromptText()`, since `getResultText()`
  alone only reads the `#result` span, not the adjoining `#desc` one), then
  drives the new `UcdJomCheckTransactionListingPage` /
  `UcdJomCheckTransactionDetailsPage` page objects (built from
  `_reference/html/eauto/ucd-jomcheck-transaction-listing.html` and
  `ucd-jomcheck-transaction-details.html`) to open the just-purchased
  transaction and confirm the Invoice/e-Invoice/Report buttons are all still
  present, then downloads the e-Invoice. Reaches the Transaction Listing via
  the "JOMCHECK TRANSACTION LISTING" button on the JomCheck menu (no `id`,
  located by its visible text) — not a hardcoded path.
- **TS16** — BO Report Listing's 29 columns, positional check.
- **TS18/TS19** — multi-claim alignment across Date of Loss/Odometer/Type of
  Claim/Parts Approved. ⚠ **Superseded 2026-10-03/04** — these ran against
  the shared `HXJ0001` fixture (2 claims, pre-push), which could only ever
  prove "the lines stay aligned", never the SPECIFIC values the workbook
  asks for. Rebuilt eSim-driven in `esim-claim-boundaries.spec.ts`; see §7i.
- **TS05 and TS17 — split into two independent tests** (Faizuddin, 2026-10-02:
  "they are checking different things at the end... make sure the automation
  are checking what each TS is supposed to produce" — they had been combined
  into one spec/scenario, which conflated two different requirements):
  - **TS17** purchases JomCheck via UCD for a freshly-generated vehicle no.
    (`HXA<4-digit>A`), then asserts BO's listing has no blank/`N/A`/`null`
    values in Odometer Reading/Type of Claim/Parts Approved, for however many
    claims the vehicle returns — unconditionally assertable, any claim count.
    **Still live and unchanged.**
  - **TS05** — ⚠ **the version described here no longer exists.** It used to
    purchase its own freshly-generated vehicle no., count the claims the
    listing returned, assert the 3 columns rendered as a SINGLE line with no
    `1. ` numbering when that count was exactly 1, and `test.skip()` with the
    actual count otherwise — deliberately NOT driving eSim (Faizuddin,
    2026-10-01, chose "use an existing/fresh vehicle no."), so the outcome
    was random per run. **Both halves of that were reversed later:**
    Faizuddin, 2026-10-03, asked for TS05-TS19 to be rebuilt via eSim so the
    claim count is guaranteed rather than hoped for; and the 01.10.2026 QA
    review plus Faizuddin, 2026-10-04 ("For now, make it so that it will
    show numbered '1. ...'") flipped the expectation to the NUMBERED form.
    TS05 now lives in `esim-claim-boundaries.spec.ts`, sets exactly 1 claim
    record on a dedicated eSim prefix, and asserts `1. ` numbering —
    pending OQ-13, which is what actually settles the format. See §7i.
  - TS17 reports the claim count it found as a `test.step()` ("Count the
    claims this vehicle returned") — Faizuddin, 2026-10-02, asked whether
    the terminal pass/fail alone showed this; it didn't, so the step list now
    makes it visible without needing to read raw output.
  - Each has its OWN vehicle-no. env var (`JOMCHECK_TS05_VEHICLE_NO` /
    `JOMCHECK_TS17_VEHICLE_NO`) so selecting both in one dashboard run doesn't
    collide on one vehicle — the dashboard hands each a consecutive value off
    the same running counter. See the "distinct vehicle env var per scenario"
    pattern in `.claude/skills/eauto-automation-scaffold/SKILL.md`.
- Needs a **UCD account** in addition to BO's (`data/users.ts` `ucd` role,
  username `faizuddin` — Faizuddin, 2026-10-01) since TS05 and TS17 each span
  both portals in one test (one browser context per test, UCD login then BO
  login, not two separate contexts).
- **TS35 — only the UI-visible subset is automated, by design.** Faizuddin,
  2026-10-03: "for TS35, only check what the automation can do. if the
  details require me to check with dev, then ignore that part only." The
  workbook's own TS35 has 3 steps, the last of which is "Request for raw API
  response from dev" — not automatable — and 2 of its 7 expected fields
  (claim-level Possible Total Loss / claim-level Possible BER) are ONLY
  visible in that raw response. The BO listing only ever renders the
  VEHICLE-level rollup of Possible Total Loss/BER (Field Reference sheet
  #4/#5: "Vehicle-level Yes if any claim is ICAP code 16"), with no
  per-claim breakout in the UI — so those 2 fields are structurally outside
  what this automation can check, not just skipped for convenience. The test
  purchases a fresh vehicle (own env var `JOMCHECK_TS35_VEHICLE_NO`, same
  `purchaseAndOpenListing()` helper as TS05/TS17) and asserts the other 5
  fields (MileageRange → Odometer Reading, ClaimsType → Type of Claim,
  TotalPartsChanged → Total No. of Parts Approved, and the two
  vehicle-level Possible Total Loss/BER columns) are populated, reporting
  each as a `DETAIL:` line.
- **TS27** (section E, "BACKOFFICE — JOMCHECK TRANSACTION DETAILS") —
  Faizuddin's revised wording, 2026-10-03, adds a step ("Using the same VN,
  crosscheck the details with Jomcheck Report Listing") beyond what the
  workbook file on disk currently shows — built to the revised text.
  **Since 2026-10-01 TS27 first buys a fresh JomCheck report in UCD through
  the real JomCheck API** (Faizuddin: "make the automation create new
  jomcheck through JomCheck API, and crosscheck that pdf with report
  listing"; own env var `JOMCHECK_TS27_VEHICLE_NO`, HXA counter). The
  paragraph below describes the older version that reused HXJ0001 — the BO
  half (Enquiry → Details → PDF → Listing crosscheck) is unchanged. Old
  version: TS27 never touched UCD: it logged straight into BackOffice,
  searched the JomCheck **Transaction** Enquiry (new
  `BoJomCheckTransactionEnquiryPage`, `/view/jomcheck/enquiry`, link text
  "Jomcheck Transaction" on BO home) for the known multi-claim vehicle
  (`JOMCHECK_MULTI_CLAIM_VEHICLE_NO`, default `HXJ0001` — same one TS16/
  TS18/TS19 use; no "create new transaction" step exists in TS27 to drive a
  fresh one), opens its Transaction Details (new
  `BoJomCheckTransactionDetailsPage`), confirms the Invoice/e-Invoice/Report
  buttons are present ("no layout change"), downloads the Report PDF, then
  crosschecks it against the JomCheck Report **Listing** for the same
  vehicle — same `pdf-parse` pattern and the same "only assert on non-blank
  listing values" rule as TS02.
  **⚠ The real "View" link opens in a new tab (`target="_blank"`)** — opening
  it for real would split the recording across two video files, so
  `BoJomCheckTransactionEnquiryPage.openResult()` instead reads the link's
  own `href` out of the DOM and `page.goto()`s it on the SAME page, landing
  on the details screen without ever opening a second tab.

**TS05-TS15/TS18/TS19 are now automated via eSim** (2026-10-03/04) — see §7i.
TS16/TS17 were already correctly automated before this (claim-count-agnostic
by design). **Still blocked without further input**: TS20-TS26, TS28-TS31 (no
automation attempted); TS32-TS34 (Wholesale, chatbot-driven, explicitly out of
scope for this UI); TS36-TS37 (Regression, no automation attempted yet).

**TS02, TS27 and TS35 are flagged yellow in the dashboard** — Faizuddin,
2026-10-03: "make the selection in the dashboard yellow, to signal that
these TS require staging to connect to JomCheck API." All three's own
preconditions/Golden Rules only hold in that mode (`Scenario.
needsApiConnection`, `app/eauto/jomcheck/page.tsx`) — an eSim-connected run
returns a dummy PDF or a random, uncheckable result instead.

## 7e. Reusing a fixed vehicle/chassis no. means the listing search returns
MORE THAN ONE row, and that's correct

Confirmed live, 2026-10-03: TS02's 3rd run against the same fixed vehicle no.
(auto-advance toggled off, so the same real registered vehicle gets reused
run after run) failed asserting `getResultCount()` `toBe(1)` — it correctly
found **3** rows, one per past purchase against that vehicle. This is not a
bug: a reused vehicle/chassis no. necessarily accumulates one JomCheck
Report Listing row per run that purchased against it. **TS02 and TS03 now
assert `toBeGreaterThan(0)` instead of `toBe(1)`** — TS03 was always at this
same risk even before anyone touched the auto-advance toggle, since chassis
no. has no counter to auto-advance at all (it's always a fixed, manually
typed value). The crosscheck steps still read row 0, on the assumption that
the listing sorts newest-first (matching every other listing captured in
this app) — i.e. row 0 is the transaction THIS run just created. **TS01 and
TS04 still assert `toBe(1)`**, since they default to an auto-generated fresh
vehicle no. each run and are not known to have hit this — but they would,
the same way, if their auto-advance toggle were ever turned off and the
field reused.

**A second, broader reason multiple rows is normal — not just this suite's
own reruns.** Faizuddin, 2026-10-03: "since the data used is real Vehicles,
its possible that the listing will show multiple rows, transactions made by
other users." TS02/TS03 purchase against REAL, shared vehicles — any other
tester's (or system's) transaction against the same vehicle shows up in the
same listing search, independent of anything this automation does. Also
confirmed same day: "values returned from JomCheck API is random and cannot
be set. so only crosscheck the details from the PDF and the JomCheck Report
Listing" — none of TS02/TS03/TS27/TS35 assert a fixed EXPECTED value for any
field; every assertion is PDF-vs-Listing agreement or presence, by design.

**⚠ Open, unverified assumption: row 0 is OUR transaction.** The crosscheck
reads row 0 assuming the listing sorts newest-first AND that our own
just-completed purchase is therefore the newest row. That second half is
genuinely at risk now that multiple rows can come from OTHER real testers'
systems, not just our own reruns — if another transaction against the same
vehicle lands between our purchase and our listing search, row 0 might not
be ours. Not fixed yet: doing so needs a reliable per-row match key (e.g. a
Transaction/reference number readable from either the downloaded PDF's text
or a screen this flow already visits) that hasn't been confirmed to exist in
a form this automation can read — don't invent one without seeing it live.
Flagged here rather than silently assumed correct; ask before building a
more precise row-selection mechanism.

## 7f. Evidence now persists across runs, not just the latest

Faizuddin, 2026-10-03, after confirming the existing rule pruned every
earlier run on each new one: "Yes, do that" (keep history instead). A
JomCheck API download (a report PDF) is a limited, precious resource — the
old behaviour could silently delete an EARLIER run's downloaded report the
moment ANY later run finished, API-related or not, defeating the entire
point of the TS02/TS27/TS35 evidence-persistence work in §7d.

- `app/api/eauto-jomcheck/run/route.ts`'s `publishEvidence()` no longer
  wipes every other run's folder on each new run. It writes a `meta.json`
  (runLabel, timestamp, scenario titles) into each run's own
  `public/qa-artifacts/eauto-jomcheck/<runId>/` folder, and only prunes once
  `HISTORY_LIMIT` (30, override via `EAUTO_JOMCHECK_HISTORY_LIMIT`) is
  exceeded — oldest first, by each folder's own `meta.json` timestamp (not
  OS mtime, which can get refreshed on unrelated access).
- New `GET /api/eauto-jomcheck/history` route lists every still-present run
  (newest first) with its evidence files, reading each folder's `meta.json`
  + directory listing — no separate growing manifest file to keep in sync,
  each run folder is self-describing.
- The dashboard's new **"Past runs"** section (collapsed by default,
  lazy-loads on first expand, refetches whenever the current run finishes)
  lists them, each expandable to its own file list with the same individual
  `Download` links, plus a "Download All" (reusing `downloadEvidence()`,
  now parameterised by an optional `{ runId, runLabel }` target instead of
  always assuming the current run).
- `app/api/eauto-jomcheck/download-all/route.ts` needed **no changes** — it
  already took an arbitrary `runId`/`runLabel` rather than assuming "the
  latest run", so it already worked against any still-present folder.

## 7g. Recorded video was pixelated despite a correct 1920x1080 viewport

Faizuddin, 2026-10-03: "even though my viewport is 1920x1080, the recording
is pixelated." Cause: `playwright.config.ts`'s `video` option was passed as
a bare `'on'`/`'off'` string, which lets Playwright pick its OWN recording
size — defaulting to the viewport **scaled down to fit an 800x800 box**
(1920x1080 → ~800x450) regardless of the real viewport. This is a DIFFERENT
bug from the already-documented viewport trap in §... (the
`devices['Desktop Chrome']` override) — the viewport itself was genuinely
1920x1080 here; it was only the VIDEO's own internal size that silently
downscaled.

Fixed by passing the object form with an explicit `size` matching the real
viewport instead of a bare string:
```ts
video: videoOn ? { mode: 'on', size: { width: 1920, height: 1080 } } : 'off',
```

**This exact bug exists in every other eauto-* project's
`playwright.config.ts`** at the time of this fix (`eauto-e2e`,
`eauto-edereg-precheck`, `eauto-estm`, `eauto-estm-legacy`,
`eauto-quotation-reminder`, `secarang-insurance`, `eauto-duitnow-qr`, and the
benchmark itself, `tests/service-hub`) — all still use the bare-string form
and are producing downscaled, pixelated recordings. **Not fixed in this
pass** — only `eauto-jomcheck` was in scope for this ticket; fixing the
others is a separate decision for whoever owns them. Full writeup (including
"any new scaffold must use the object form from the start") is in
`.claude/skills/eauto-automation-scaffold/SKILL.md`.

## 7h. BO JomCheck Transaction Enquiry's From/To date fields are READONLY —
`.fill()` doesn't work on them

Confirmed live, 2026-10-03, TS27: `searchByVehicleNo()` timed out 30s inside
`.fill()` on `#fromDate` — `"element is not editable"` — and never reached
the Search click, exactly the symptom Faizuddin reported ("after filling in
the vehicle number, automation did not click 'Search'"). Cause: `#fromDate`/
`#toDate` are `readonly` inputs driven by a jQuery UI datepicker
(`class="hasDatepicker"`), and Playwright's `.fill()` refuses to act on a
readonly element at all — it isn't a timing issue, it structurally cannot
type into this field.

**The exact same situation was already solved elsewhere in this codebase**
— `scripts/eauto-edereg-precheck/pages/BoDeregTransactionListingPage.ts`
(EAINT-9306): click the readonly field to open `#ui-datepicker-div`, then
click `.ui-datepicker-today a` (jQuery UI always marks the CURRENT calendar
day with that class, regardless of which month the widget happens to be
showing — reliable without knowing today's date in advance).
`BoJomCheckTransactionEnquiryPage.searchByVehicleNo()` now does the same for
BOTH From and To.

**⚠ That today-only fix was itself wrong, and is now removed (2026-10-01).**
Pinning From=To=today made the search return **zero rows** for any vehicle
whose transaction predates today — confirmed live: `HXJ0001` with
From=To=01/10/2026 gave "0 record(s) in total". The page was then captured
on load (`_reference/html/eauto/bo-jomcheck-transaction-enquiry-datepicker.html`)
and settled it: **both date fields are EMPTY on load and are optional
filters.** An empty range searches all time, which is exactly what a
search-by-vehicle-no. wants, so `searchByVehicleNo()` now sets no dates at
all. The "a date is required before Search" belief was imported wholesale
from `BoDeregTransactionListingPage` (EAINT-9306), where it IS true — it was
never verified on THIS page. Same capture also shows the widget has real
`.ui-datepicker-month` / `.ui-datepicker-year` `<select>`s (2016-2026) plus
`.ui-datepicker-prev`, so a bounded range is implementable without hacking
the readonly attribute if a future TS needs one.

## 7i. TS05-TS15/TS18/TS19 — eSim drives exact claim records (2026-10-03/04)

Faizuddin: "can you create the automation for TS05 - TS19. not that for
these ones, it will need to use eSim, not jomcheck API. since it needs
specific details, which will be inserted through the eSim" — these TS assert
EXACT boundary values (e.g. mileage 9,999/10,000/10,001 km either side of a
bucket edge, parts-changed 10/11/20/21, claim code 11 vs. blank, a 2-claim
vehicle with one Total-Loss=Yes/one No) that purchasing against the real,
random JomCheck API can never reliably reproduce (Golden Rule #3). Only eSim
can set these deterministically — via its JomCheck Report entity's dynamic
"Claim Records" sub-form (`.claim-record` blocks, `+ Add Claim Record`/
`Remove Record`, captured in
`_reference/html/esim/jomcheck-report-edit.html`).

**What was built:**
- `scripts/eauto-esim/pages/EsimPages.ts`'s `EntityEditPage` gained
  `removeAllClaimRecords()` and `addClaimRecords(records)`. Claim-record
  labels carry NO `for` attribute (unlike every other eSim field this repo
  drives) — they resolve via the sibling input inside the SAME
  `.form-group`, scoped to one `.claim-record` block, not by `for`/`id`.
- `scripts/eauto-esim/data/config.ts` gained `ESIM_CLAIM_RECORDS` (JSON array
  of label→value maps) and `ESIM_CLEAR_CLAIM_RECORDS` env vars, wired into
  `tests/esim-edit.spec.ts`'s write-mode flow (clear, then add, same save).
- `scripts/eauto-jomcheck/utils/esim.ts` (new) wraps that as
  `setJomCheckClaims()`/`clearJomCheckClaims()`/`setJomCheckEnquiryResult()`
  — same spawn-as-child-process pattern as the quotation-reminder/edereg-
  precheck eSim wrappers.
- `scripts/eauto-jomcheck/tests/esim-claim-boundaries.spec.ts` (new) — TS05
  through TS15, TS18, TS19 (11 tests), each: clear+set its own claim records
  on a DEDICATED prefix, purchase via UCD, check the BO listing, then
  `test.afterEach` always clears that prefix's claims again (same
  always-restore pattern as TS06/knowledge/esim.md).
- The OLD TS05 (random vehicle + `test.skip()` when the live claim count
  wasn't exactly 1) was removed from `ucd-purchase-to-bo-listing.spec.ts`.
  The OLD TS18/TS19 (against the shared "known multi-claim vehicle"
  `HXJ0001`, with no control over its exact claim values — only provable
  "claims stay aligned", never the SPECIFIC values the workbook asks for)
  was removed from `bo-report-listing.spec.ts`, which now only covers TS16.
- `app/eauto/jomcheck/page.tsx` gained `Scenario.needsEsimClaimPrefix` +
  `esimVehicleSuffix`, a violet checklist highlight (parallel to the amber
  `needsApiConnection` one), and a required "eSim claim prefix" field. These
  scenarios' purchased vehicle no. is `<typed prefix><scenario's own fixed
  suffix>` (e.g. `ZC0007`) — deliberately NOT the HXA auto-advance counter,
  since the vehicle no. must start with the eSim prefix for its claim data to
  apply.

**Prefix is HX (Faizuddin, 2026-10-01: "always use HX").** This replaces
the "dedicated prefix" rule below. Because HX is shared, the spec saves HX's
claim records and Enquiry Result in `beforeAll` (`readJomCheckState()`,
backed by the new `EntityEditPage.readClaimRecords()` and a `claimRecords`
key in eSim read-mode output) and writes them back in `afterAll`
(`restoreJomCheckState()`). It no longer wipes HX to zero claims. A killed
run leaves HX changed; the log line `[esim] HX snapshot:` holds the values
to put back. The dashboard's prefix field is now read-only "HX".
Superseded rule: `JOMCHECK_ESIM_CLAIM_PREFIX` had no
default on purpose — eSim prefixes are a shared namespace (knowledge/esim.md:
"ask before claiming a prefix"). Reusing the shared "HX" prefix here would
corrupt TS01/02/03/04/17/27/35's own random/live-API assumptions, since this
work repeatedly clears and overwrites one eSim record's claim data.

**Raw number vs. pre-bucketed string — RESOLVED, 2026-10-04.** The 01.10.2026
QA review of the TS05-TS19 workbook confirmed via its Remarks column that
eAuto does NOT compute the Odometer Reading/Total No. of Parts Approved
bucket — it shows MileageRange/TotalPartsChanged exactly as given (the
banding happens upstream, in the real API's ezAuto side). Faizuddin, same
day: "the view will always show range in text." TS07-TS10/TS18 now set the
FINAL bucketed string straight into eSim's "Mileage Range"/"Total Parts
Changed" fields (confirmed plain `<input>` text fields in
`_reference/html/esim/jomcheck-report-edit.html`, not dropdowns) and assert
the Listing shows that exact string back — these are pass-through-fidelity
checks, not banding-algorithm checks, since eAuto has no banding algorithm to
test. Band wording (e.g. `"0 to 10,000 km"`, `"1 to 10 parts"`) is taken
verbatim from
`_reference/tickets/EAINT-12339/Mockup_EAINT-12339_JomCheck_Report_Listing_20260928.html`'s
own sample data, not invented. **TS08's 300,000km boundary was also
corrected** in that same review: 300,000 itself still falls in the preceding
band (`"290,001 to 300,000 km"`); only 300,001 and above show `"More than
300,000 km"` — the original draft had 300,000 itself showing "More than
300,000 km", now fixed.

**TS05's single-claim display format — working assumption, OQ-13 still
open.** Workbook Remarks: "Single-claim display format ('1. <value>' or
'<value>') to be confirmed - OQ-13." Faizuddin, 2026-10-04: "For now, make it
so that it will show numbered '1. ...'" — TS05 now asserts the NUMBERED
form. Flip this back to bare-form if OQ-13 settles the other way.

**TS11/TS19's null-ClaimsType "-" on a MIXED claim list — still open,
OQ-04.** Workbook Remarks (both TS): "ON HOLD - OQ-04. SRD only confirms '-'
for a vehicle with no claim history." TS14's zero-claims case IS confirmed;
a null ClaimsType on ONE claim within an otherwise-populated list (TS11/
TS19's case) is a reasonable extrapolation, not the same confirmed fact.
Checked `Mockup_EAINT-12339_JomCheck_Report_Listing_20260928.html` to see if
it settles this (Faizuddin, 2026-10-04: "i believe this can check based on
the html mockup") — it does NOT: the mockup's own sample data hardcodes
`typ:["Own Damage (OD)","Own Damage (OD)"]` for every row and claim, with no
null-code example anywhere. TS11/TS19 still assert "-" as a working
assumption; both tests now carry a code comment pointing at OQ-04 explicitly.

**TS12/TS13's claim codes corrected to match the reviewed workbook exactly**
— TS12 now uses ICAP 16 (OD-ATL)/15 (OD-CTL) instead of 16/11; TS13 now uses
ICAP 1 (OD) for both claims instead of 11/12. Same Yes/No rollup logic either
way; this was a traceability fix, not a logic fix.

**TS15's "no sum insured" mechanism** — the captured claim form has no
separate "Sum Insured" field, so TS15 leaves "Severity" blank on a Windscreen
(code 11) claim as the best available proxy. Confirm this actually produces
the "NOT RELEVANT / NO SUM INSURED PROVIDED" text (§8 already confirms that
exact wording is correct per Tech Spec 2.0 p.9) before trusting the
mechanism, not just the wording. Not addressed by the 01.10.2026 review.

TS14's PDF-side advisory message (shown instead of claim rows when there's no
claim history) is logged for manual review, not asserted on — its exact
wording hasn't been confirmed against a live PDF.

**OQ-01 through OQ-15 are NOT in Jira — they're the "Open Questions" sheet of
`_reference/tickets/EAINT-12339/Azila Review - EAINT-12339 - eAuto-JomCheck
Upgrade JomCheck Gateway API Integration from v1.9 to v2.0_Reviewed_20261001.xlsx`**,
one row per OQ with columns OQ No./Related TS/Question/Why It Matters/Source/
Raise To/Status/Answer/Answered By/Date. Checked EAINT-12339's Jira
description and comments first (`mcp__claude_ai_Atlassian`, 2026-10-04) — no
comments, no remote links, description only has the General Info/SRD tables —
then found this sheet in the reviewed workbook itself. All 15 are **Status:
Open, Answer: blank** as of 2026-10-04 — nothing is actually resolved yet,
only precisely scoped. Read directly off that sheet rather than paraphrasing,
since the exact wording matters for what each TS can assume:
- **OQ-01** (TS07-TS10/TS18): "How does eSim produce MileageRange and
  TotalPartsChanged - do we enter the band text... or a raw number that eSim
  converts? Also confirm with ezAuto that 300,000 km returns '290,001 to
  300,000 km'." Why it matters: "eAuto only passes the text through. If eSim
  takes the band text directly, boundary tests test nothing in eAuto and
  must be rewritten as pass-through display checks." — this is exactly what
  esim-claim-boundaries.spec.ts now does (§7i above), per Faizuddin's
  2026-10-04 confirmation ("the view will always show range in text").
- **OQ-02** (TS35, TS43): which Search endpoint version eAuto actually calls
  post-CR, and whether RetailPrice/TradePrice are confirmed populated.
- **OQ-03** (TS20-TS24, TS38, TS45): how eAuto decides a transaction is "new"
  vs. pre-push, and how failed/pending transactions are treated after
  deployment.
- **OQ-04** (TS11, TS19, TS39): Type of Claim's display for (a) a null
  ClaimsType among coded claims and (b) a ClaimsType not in SRD 2.2.5 (e.g.
  0, 20, 99) — "-" is confirmed ONLY for a vehicle with zero claim history.
- **OQ-05** (TS15, TS46-TS48): which Service Portal severity counter (if
  any) counts a "NOT RELEVANT / NO SUM INSURED PROVIDED" claim.
- **OQ-06** (TS14): what Odometer Reading/Parts/Possible Total Loss/Possible
  BER display for a vehicle with zero claim history.
- **OQ-07** (TS46-TS48, TS29): Service Portal counter order — SRD and mockup
  contradict each other (Severe/Critical/Catastrophic/High/Medium/Low vs.
  Severe/High/Medium/Low/Critical/Catastrophic).
- **OQ-08** (TS48): do Critical/Catastrophic counters show "0" for reports
  shared before deployment?
- **OQ-09** (TS25): does the BO export include "(UPDATED)"/"(NEW)" header
  suffixes and colour fills, or only plain labels?
- **OQ-10** (TS49): deployment order/timing between eAuto and ezAuto on
  05.10.2026; who runs production verification, with which account.
- **OQ-11** (TS43): do "Accident Record"/"Last Mileage Recorded" read
  AccidentType or ClaimInfoExtra.LatestMileage?
- **OQ-12** (TS27, TS32-TS34): are Wholesale/Chatbot and BO Transaction
  Details actually in scope, or regression-only?
- **OQ-13** (TS05): does a single-claim vehicle show "1. <value>" or
  "<value>" today? TS05 currently assumes numbered (Faizuddin, 2026-10-04).
- **OQ-14** (TS42): can eSim set vehicle-level PossibleTotalLoss/PossibleBER
  independently of the claim-level flags?
- **OQ-15** (TS44): which audit log page records JomCheck Report Listing
  exports?

**13 new TS rows from the 01.10.2026 QA review aren't automated yet** —
reorganized into the dashboard's "Not automated yet" footer AND into
SCENARIOS itself (as disabled, correctly-positioned rows, `notBuilt: true`)
so the checklist's ordering matches the reviewed workbook 1:1, by the
workbook's own section letters (A-I): TS38 (section A, pre-push UCD
report-button check); TS39-TS43 + TS28 (**all section B**, not scattered —
confirmed directly from the reviewed workbook's row order, correcting an
earlier draft of this file that had filed TS43 under section H by mistake:
ICAP code sweep, Total-Loss/BER swap-detection ×2, vehicle-level flag
independence [OQ-14], a dev-response column check [same structural gap as
TS35], and severity pass-through, in that row order); TS44/TS45 (section D,
audit log [OQ-15] + pre-push export); TS46-TS48 (section F, Service Portal
severity counters, need the sharing feature + eSim); TS49 (section I,
production verification after the 05.10.2026 deployment — not something to
automate against production).

**The dashboard checklist is now sectioned like the workbook, collapsed by
default** (2026-10-04, Faizuddin: "i want you to make the TS into their own
collapsable sections, just like based on the excel. make the TS section
closed by default. user will click to expand it"). `app/eauto/jomcheck/page.tsx`
gained a `TS_SECTIONS` constant carrying the reviewed workbook's nine section
headings (A-I) verbatim and in its order, a `Scenario.section` tag, and one
`Section` box per letter — each starting collapsed, with its own Select
all/Clear, a `built/total automated` count, a selected-count badge, and its
own blocking note (`TS_SECTION_NOTES`) in place of the single shared "Not
automated yet" footer. Expand all / Collapse all sit above the group.

**All 49 TS now have a row**, not just the 21 with specs behind them — the 28
unbuilt ones render disabled/greyed with a "Not built" badge and a one-line
reason (mostly an OQ id), and are excluded from Select-all, the automated
count and `VALID_SCENARIO_IDS`. Verified by script, 2026-10-04: 49 rows, zero
missing `section` tags (a missing tag silently drops the row from the UI
rather than erroring), no duplicate `order` within a section, and per-section
membership matching the sheet — A 4/5, B 15/21, C 0/5, D 0/4, E 1/1, F 0/6,
G 0/3, H 1/1, I 0/3. Note that section B's own order puts TS39-TS43 and TS28
AFTER TS19, which is why those carry decimal `order` values (19.1-19.6)
rather than sorting by their numbers.

**VPN: warning text only, by choice.** Faizuddin, 2026-10-01: "thats what i
want actually. the warning text" — no blocking `vpnAsk` confirmation step
(the quotation-reminder pattern) on this dashboard. Don't add one.
**Superseded later the same day:** "if at least one TS that requires VPN is
selected, when i click the Run button, it will pop up a reminder message" — Run
now opens a "Is your VPN connected?" popup (Cancel / Confirmed VPN Connected)
when any eSim TS is selected; the warning text stays. Stop also asks first
("a popup for confirmation will show up first, instead of automatically
stopping it"), noting a stopped eSim TS gets no restore step.

## 7j. TS27's PDF-vs-Listing crosscheck is invalid for 2 of its 5 columns

Confirmed 2026-10-01 by saving the actual report PDF for `HXJ0001` —
preserved as
`_reference/tickets/EAINT-12339/EAINT-12339-TS27-report-HXJ0001-uat1-20261001.pdf`
(a JomCheck API download is rate-limited, so the artefact is kept rather
than re-fetched). Extracted text shows the PDF's claim table prints:

```
DATE OF LOSS | DATE OF AUTHORIZED | TYPE OF CLAIM | TYPE OF ACCIDENT | MILEAGE ** | TOTAL PARTS APPROVED FOR CHANGE | SEVERITY
22 NOV 2019  | 26 NOV 2019        | OWN DAMAGE (OD) | COLLISION      | 0          | 3                               | MEDIUM
22 AUG 2021  | 17 SEP 2021        | OWN DAMAGE (OD) | COLLISION      | 226825     | 8                               | SEVERE
** MILEAGE DISPLAYED ABOVE IS AS PER RECORDED AT TIME OF CLAIM
```

So, for this transaction:
- **"OWN DAMAGE (OD)" IS in the PDF, verbatim** — Type of Claim genuinely is
  crosscheckable by substring.
- **The band strings are NOT.** "0 TO 10,000 KM" → absent. "1 TO 10 PARTS" →
  absent. The PDF carries the **raw figure at time of claim** (`0`, `226825`,
  `3`, `8`); the Listing carries the **v2.0 band** (MileageRange,
  TotalPartsChanged). They are different representations of the same datum
  **by design**, so `pdfText.includes(listingValue)` can never pass for
  Odometer Reading or Total No. of Parts Approved on a PDF of this shape.

**This inverts what the 2026-10-01 failure log appeared to show** (odometer
`inPdf:true`, Type of Claim `inPdf:false`). That run read a DIFFERENT
transaction — 9 claim lines, against this PDF's 2 — because the enquiry (which
picks the transaction to download) and the Report Listing (which picks the row
to compare) are two independent searches, each taking row 0. Whether a
post-push, v2.0-era PDF prints bands instead of raw figures is **not yet
confirmed** and is the thing to check next; it would explain the inversion.
Either way the current assertion is wrong for at least one era of PDF.
**Decision 2026-10-01:** TS27 now buys a fresh report through the JomCheck
API each run (§7d), so its PDF is post-push and both searches find the same
single transaction. The first such run settles whether a v2.0 PDF prints
ranges; if Odometer/Parts still fail there, the PDF prints raw figures and
those 2 columns need a new decision. Previous note: **Not changed unilaterally** — narrowing TS27's crosscheck to the columns that
are genuinely comparable changes what the TS proves, so it needs a decision.

**Second data point, 2026-10-01 — a fresh API purchase with ZERO claims.**
TS27 run against `VML4392` (uat1, transaction `J600008387`), PDF saved as
`_reference/tickets/EAINT-12339/EAINT-12339-TS27-report-VML4392-uat1-20261001.pdf`.
`[verified: PDF text + Playwright error-context, 2026-10-01]`
- The PDF's claim table header has changed from the HXJ0001 PDF: it now reads
  "Date of Loss | Date of Authorized | Odometer Reading ** | Filling Category |
  Total No of Parts Approved for Change | State in Malaysia | Incidents
  Severity Scale" (was "MILEAGE **" / "TYPE OF CLAIM" / "SEVERITY"). Whether
  the values print as ranges is still unknown — this vehicle has no claims.
- With zero claims the PDF prints no claim rows, only: "There are no
  previously approved history recorded by the Jom Check Vehicle System for the
  entered vehicle registration number VML4392." The Listing shows "-" in all 7
  claim columns. The crosscheck counts "-" as a real value, so it fails on
  Odometer Reading. Test logic, not an eAuto defect. TS02 has the same logic.
- "No" (Possible Total Loss / Possible BER) passes only by coincidence —
  "NO" appears elsewhere in the PDF ("NO RECORD FOUND").
- Not checked by TS27, observed only: Listing "Last Mileage Recorded" = "0"
  and "Accident Record" = "0" where the PDF says "NO RECORD FOUND"; Listing
  "Incidents Severity Scale" = "-" where the PDF says "MAX. SEVERITY: NOT
  RELEVANT / NO SUM INSURED PROVIDED". Unconfirmed whether these differ by design.
- **Fixed same day** (Faizuddin: "yes"): TS02 and TS27 now share
  `scripts/eauto-jomcheck/utils/pdfCrosscheck.ts`. "-" in every claim column
  is checked against the no-history sentence; Total Loss History (Actual)/(BER)
  are checked against the PDF's own "ACTUAL:"/"BER:" lines; Possible Total
  Loss/BER are logged only, since the PDF does not print them. Verified
  offline against the VML4392 PDF: passes as-is, and fails when Actual is
  changed to "YES".

**Also found, same session:** the BO account in `data/users.ts`'s fallback has
**no "JomCheck Report Listing" entry under Settings (Hub Admin)** — the menu is
permission-gated, and that account's category lists only the JPJ XML Logs,
batch invoice, Estm permission log, Change Director Log and Customize Display
Message. `BoJomCheckReportListingPage.goto()` now throws a named error saying
so instead of sitting in a 30s click timeout that reads like a bad locator
(`knowledge/quirks.md`: rule out tester setup before blaming code). Runs that
need the Report Listing must supply a BO account that has the permission, via
the dashboard's BO username/password fields.

## 7k. TS21-TS23, TS25, TS26 automated (2026-10-01)

Faizuddin: "with whatever we have, can you create automation for TS20-26,
note that this will use eSim". Built from what exists; supersedes "not run live yet": these TS (old numbers) passed by 2026-10-05, "ts34 deprio, all the other passed" (Faizuddin, 2026-10-05 17:12; not verified by a pasted log) `[from handoff 2026-10-05 EAINT-12339]`.

- **Pre-push fixture.** The only pre-push transaction with recorded values is
  **J690008380** (HXJ0001, 2 claims, 30-09-2026 14:20), from
  `_reference/html/eauto/bo-jomcheck-report-listing.html` state 2. Stored
  values: Odometer `0`/`226825`, Type `Own Damage (OD)` x2, Parts `3`/`8`,
  Possible Total Loss/BER `N/A`. Kept in
  `scripts/eauto-jomcheck/data/prePushTransaction.ts`. Specs find it by
  Transaction Number (`findRowIndexByTransactionNo()`), never row 0.
- **TS21/TS22** — `tests/bo-pre-push-listing.spec.ts`, BO only, no eSim.
- **TS23/TS25/TS26** — `tests/esim-listing-export.spec.ts`, new transaction via
  eSim on HX (vehicles HX0023/HX0025/HX0026), HX state saved/restored by
  `utils/esimPurchase.ts` (a copy of the TS05-TS19 flow; that spec untouched).
  TS23's "unaffected columns match" is automated as: filled in for both
  transactions, and listing = export for each — the two vehicles' values
  cannot be equal.
- **Export format is unconfirmed.** `utils/exportReader.ts` assumes the SRD
  mock-up's shape (.xlsx, 1 header row, multi-claim in 1 cell) and fails with
  the file's first bytes otherwise. The export is saved as run evidence.
  Capture a real one on the first run. OQ-09 header suffixes are logged only.
- **Not built:** TS20 (no recorded 1-claim pre-push transaction) and TS24 (no
  known pre-push failed transaction; OQ-03).
- **Vehicle no. for every eSim scenario (TS05-TS15, TS18, TS19, TS23, TS25,
  TS26) now comes from the shared field** — running counter (`HXA####A`) or a
  fixed typed value (Faizuddin, 2026-10-01: "allow running numbers, and allow
  specific numbers"). Replaces the fixed `HX` + 4-digit suffix (`HX0005` …)
  described in §7i. Run is refused if a fixed value does not start with `HX`.
  eSim prefixes are always 2 characters (Faizuddin, 2026-10-01), so every
  `HXA####A` counter number falls under the `HX` record.
- **No separate prefix field.** The dashboard's "eSim claim prefix" field is
  removed; the eSim prefix is the first 2 characters of the "Fresh vehicle
  no." value (Faizuddin, 2026-10-01: "it will always use any prefix that is
  set in the 'fresh vehicle number' field"). Supersedes "always use HX" in
  §7i — HX is simply what the running counter (`HXA####A`) produces.
- **eSim now runs in the test's own page** (Faizuddin, 2026-10-01: "the
  eSim must also be open in the same browser as the main testing, so that
  user can know how the eSim is set up when rewatching the test evidence").
  `pages/EsimJomCheckPage.ts` + `utils/esimPurchase.ts`: each test opens
  eSim, saves the prefix's Enquiry Result and claim records, sets its own,
  purchases, and `afterEach` writes the saved state back on the same page —
  all in the video. Replaces the child-process `utils/esim.ts` (deleted) and
  the file-level beforeAll/afterAll snapshot described in §7i. Both eSim specs
  (TS05-TS19 and TS23/TS25/TS26) use it. `ignoreHTTPSErrors: true` added to
  the suite config.

## 7l. TS RENUMBERED 2026-10-01 — Azila's order, ascending numbers

**Every TS number in §1–§7k above (and in older handoffs) is the OLD number.**
Faizuddin, 2026-10-01: "keep azila's order, but change the numbers so that the
order is from lowest to highest. i dont want to change the position of the TS".
Rows keep their position in Azila's reviewed workbook; numbers now run TS01–TS49
top to bottom. Automation titles, dashboard ids, `JOMCHECK_TSnn_VEHICLE_NO` env
vars and evidence labels all use the NEW numbers.

Renumbered workbook copy (Azila's file untouched), with a "Renumber Map" sheet:
`_reference/tickets/EAINT-12339/N-EAINT-12339 - [eAuto-JomCheck] Upgrade JomCheck Gateway API Integration from v1.9 to v2.0 (Azila review, renumbered).xlsx`.
Saved reference PDFs keep their old-number filenames (`...-TS27-report-...pdf` = new TS36).

| Section | Old → New |
|---|---|
| A | 01–04 same, 38→05 |
| B | 05→06 … 19→20 (+1), 39→21, 40→22, 41→23, 42→24, 43→25, 28→26 |
| C | 20→27, 21→28, 22→29, 23→30, 24→31 |
| D | 25→32, 26→33, 44→34, 45→35 |
| E | 27→36 |
| F | 29→37, 30→38, 31→39, 46→40, 47→41, 48→42 |
| G | 32→43, 33→44, 34→45 |
| H | 35→46 |
| I | 36→47, 37→48, 49 same |

**Azila's updates applied to existing automation (new numbers):**
- TS02: Report PDF must contain no "N/A" (expected result #3).
- TS06: Type of Claim = exact "Windscreen (WS)". TS07: band text, all 3 columns numbered.
- TS12/TS20: exact "Windscreen (WS)", not "contains".
- TS13/TS14: claim-level and vehicle-level flags exactly as the workbook; position + single-value checks.
- TS15: vehicle-level flags No.
- TS18: export check of the 3 columns + only valid v2.0 values.
- TS19: Date of Loss and Incidents Severity Scale also compared line by line.
- TS46: title per the workbook; the new items (deprecated fields, endpoint) need the raw response — not automatable.

**New automation:** TS21 (ICAP 1–19/30/31 sweep, one vehicle with 21 claims —
if eSim caps claim records the line count fails first), TS22/TS23 (swap
detection), TS24 (vehicle-level flags; eSim has separate top-level "Possible
Total Loss"/"Possible BER" selects, so OQ-14's precondition holds), TS25 (API:
prices and Total Loss History vs the Report PDF, State = "-"; raw-response
compare not automatable), TS26 (6 severities), TS35 (pre-push export).
eSim set-up now also saves/restores the Report's vehicle-level flags.

**Still not built** (TS05, TS27, TS31, TS47, TS48 since built — §7q): TS05 (no report saved before the push), TS27 (no recorded
1-claim pre-push transaction), TS31 (no pre-push failed transaction; OQ-03),
TS34 (audit log page unknown; OQ-15), TS37–TS42 (Service Portal sharing flow
not captured), TS43–TS45 (Wholesale chatbot), TS47–TS48 (not attempted),
TS49 (production).

**Chassis no. now has a running counter too** (Faizuddin, 2026-10-01: "the
logic for chassis number should also be the same as VN, where the prefix is
HX, and the rest is running numbers"), then "make a mix of letters also":
`HX` + `A##J##C##K##` + `MTA` — the 8-digit running number split into pairs
between letters, e.g. 1 → `HXA00J00C00K01MTA` (17 characters, standard chassis length, no I/O/Q; counter key
`eauto_jomcheck_cn_counter`). It follows the same auto-advance toggle as the
vehicle no. (toggle shown beside both fields); off = the typed value is used
as-is. Replaces "no auto-generation — type a real chassis no." in §7d.
`[unconfirmed]` on eSim, a chassis lookup matches the record's "Cn Start
With" — the HX record's value has not been checked.

The dashboard's saved checklist key moved to `eauto_jomcheck_ui_state_v2` so an
old selection does not tick different scenarios after the renumber.

## 7l-i. EAINT-12339 automation rules set 2026-10-01 (new TS numbers)

1. **Rows are found by Transaction No., never by position.** [source: Faizuddin, 2026-10-01: "match it by transaction no."]
   1. After payment, the UCD purchase form's hidden `transactionId` (a UUID) identifies the purchase.
   2. The UCD JomCheck Transaction Listing links each row to `view.do?id=<UUID>` with `title="to view <Transaction No>"`. Matching the link gives the "J69…" number. [verified: `_reference/html/eauto/ucd-jomcheck-transaction-listing.html`]
   3. Code: `utils/transactionLookup.ts` (`lookUpTransactionNo`). The BO Report Listing readers accept a Transaction No. (`RowRef`). The BO Enquiry is searched with `#refNo` (`searchByTransactionNo`).
2. **TS30 uses the same vehicle as the existing transaction.** [source: Faizuddin, 2026-10-01: "the same VN with existing JomCheck, create a new Jomcheck, make sure the details are correct"]
   1. The new purchase is made on `PRE_PUSH.vehicleNo` (HXJ0001). A dashboard vehicle no. for TS30 is ignored.
   2. The vehicle-detail columns (Vehicle Number to Approx. New Car Price) must be identical between the two transactions.
   3. Claim-driven columns can differ by design.
3. **eSim "Simulator Details Only (No Default)" is set on every run.** It is `Yes` for TS12, TS15 and TS20, so blank fields stay blank, and `No` for all others. See `knowledge/esim.md`. [source: Faizuddin, 2026-10-01]
4. The renumbered workbook was updated the same day. Change Log rows 84–89 cover TS30, TS12/TS15/TS20, the Field Reference "TS42"→"TS46" fix, and OQ-14 answered.

## 7m. Evidence and results per TS (2026-10-01)

A multi-TS run used to keep ONE video (the newest .webm, named after the whole
run) and show one combined evidence box. Now every TS gets its own video
(`12339_TSnn.webm`), failure screenshot, downloads (spec labels now
`12339_TSnn-report-...` / `-export-...`), DETAIL lines, steps and zip, in
its own dashboard card. Standing rule: `knowledge/automation-testing.md`
§ "evidence and results per TS".

## 7m-i. Open points carried over from the study (to 2026-09-30)

- The JomCheck-report sharing window is 30 days as of the latest SRD revisions
  seen for EAINT-10089/10937, but this has changed once already — reconfirm if
  it ever matters to a new CR.
- Severity edge case (windscreen claim / no sum insured) — not in the SRD, but
  resolved via Azfar's draft: displays **"NOT RELEVANT / NO SUM INSURED PROVIDED"**
  verbatim (sourced from ezAuto spec 1.9 sample, current/existing behaviour).
  Corrects an earlier guess in this file's history that it showed "-". See
  `_reference/tickets/EAINT-12339/` TS26 remark.
- Wholesale mechanics (§2) — confirmed in scope, and the chatbot/match-card/
  payment-page flow is now confirmed via the parallel price-change CR's test
  scenarios (2026-09-30). Still open: how the JomCheck report is downloaded
  after purchase, and whether Wholesale reads the re-sourced/deprecated API
  fields directly. See TS32/33/34 in `_reference/tickets/EAINT-12339/`.

## 7n. Bulk run = queue, one TS per run (2026-10-01)

The 17-TS bulk runs at 17:05 and 17:12 both ended at exactly 10:00 — the run
route's `TIMEOUT_MS` killed the single combined Playwright call, so no per-TS
results or videos survived (only a fallback combined .webm). The dashboard now
queues the selected TS and runs each as its own call, like 9306 (standing rule
in `knowledge/automation-testing.md`). The route itself is unchanged.

## 7o. ezAuto Technical Spec 2.0 — now in the repo (2026-10-01)

Downloaded from the EAINT-12339 Jira attachment ("ezAuto Technical Spec 2.0.pdf",
attached 2026-09-14 by Chee Mei Jia) to
`_reference/tickets/EAINT-12339/EAINT-12339-ezAuto-Technical-Spec-2.0.pdf` (22 pages).
The workbook's "Tech Spec 2.0 p.9" citations point here. Verbatim, page 9 unless noted:
- **Severity:** "Returns "NOT RELEVANT / NO SUM INSURED PROVIDED" where the vehicle
  has no sum insured, and for windscreen claims." Bands: "LOW 1% to 5%; MEDIUM 6% to
  15%; HIGH 16% to 30%; SEVERE 31% to 50%; CRITICAL 51% to 70%; CATASTROPHIC above
  70%. Each band covers everything up to and including its stated top." → TS16 can
  set that exact text in eSim's claim Severity (eAuto passes Severity through, SRD
  REQ-006); a blank Severity is not what the API sends.
- **MileageRange:** "Odometer reading as a 10,000 km band … "Not Specified" when no
  reading was recorded; "More than 300,000 km" above 300,000 km." **TotalPartsChanged:**
  "The exact count is not disclosed." → the banding is ezAuto's; eAuto only shows
  the text (TS08–TS11 = pass-through checks, OQ-01).
- **PossibleTotalLoss / PossibleBER:** "Returned on each claim, and at vehicle level
  where it is true if any claim on the vehicle is an Actual Total Loss" (BER: "a
  Constructive Total Loss"). → In the real API the vehicle-level flag always follows
  the claims; TS24 (and any "reverse" case) is an eSim-only inconsistent state that
  only proves eAuto reads the vehicle-level field.
- **ClaimsType:** "Returns null where the source recorded no claim type … an uncoded
  claim returns null rather than a best-effort code." Claim Type List (p.10) matches
  SRD 2.2.5 / TS21 character for character.
- **Endpoint (p.8):** "/api/ThirdParty/{Version}/Search … Available Version V1.8 /
  V2.0. The unversioned /api/ThirdParty/Search is also available." p.10: "V2.0
  returns RetailPrice and TradePrice in BasicInfo; V1.8 returns MarketValue,
  NewNetSellingPrice and NewCarPrice instead." (OQ-02 context — which one eAuto calls
  is still open.)
- **Input limits (p.8):** "Chassis No only allowed alphanumeric characters and not
  more than 17 characters - Vehicle Number is not more than 13 characters." Our
  counters (`HXA####A`, `HXA##J##C##K##MTA`) fit.
- **Sample response (p.11–20):** `"LossDate" : "19 Dec 2019"`; vehicle level
  `ClaimInfoExtra.LatestMileage` "Not Specified" and `AccidentCount` 8 (OQ-11 context).
- **Not covered by the spec:** what any field shows for an EMPTY ClaimList (OQ-06),
  and anything eAuto-side (pre-push handling, row identity, eSim `useDbReport`).

## 7p. Findings from the 2026-10-01 queued bulk run (TS01–TS19, uat1, eSim)

`[verified: run log pasted by Faizuddin, 2026-10-01, transactions J600008402–J600008418]`
- **Claim line order is NOT the order the claims were saved in eSim.** Saved
  A,B,C showed C,A,B (TS09) and C,B,A (TS11); 4 claims showed B,D,A,C (TS10); 2
  dated claims (01 Jan 2024, 15 Mar 2024) showed the later one first (TS19).
  Tests now compare claim lines as a set, or tag each claim with its own mileage
  band and pair lines back by that tag.
- **A claim with every field blank does not come back at all** — TS12 set 2
  claims (code 11 + blank code) and got 1 line. The blank-code claim now carries
  a mileage tag.
- **eSim restore failed on every eSim TS**: the snapshot saved claim labels via
  `innerText`, which applies the label's CSS uppercase ("CLAIMS TYPE (ICAP
  CODE)"), so writing them back found no field. Fixed (`textContent`) in
  `pages/EsimJomCheckPage.ts`. **Consequence: the HX eSim record was left with
  the last test's claims; its original pre-session claim set is unknown** (the
  first snapshot in the run was already leftover test data).
- **Single claim shows numbered "1. …"** (TS06 passed its numbered-line check; TS16
  showed "1. -") — live evidence for OQ-13, still to be confirmed by the BA.
- **Blank eSim Severity shows "-"**, not "NOT RELEVANT / NO SUM INSURED
  PROVIDED" (TS16). TS16 now sets that exact text, per Tech Spec 2.0 p.9 (§7o).
- **e-Invoice button appears only after approval**, a few minutes after
  payment — TS04 failed on it. Per Faizuddin ("for all TS, ignore the
  e-invoice button for now"), both Transaction Details page objects now check
  only Invoice + Report, and TS04 no longer downloads the e-Invoice.
- Only TS04 failed because of the e-Invoice. TS06–TS16 and TS19 failed on
  claim order, the dropped blank claim, the blank Severity, and the restore.

## 7q. TS05, TS27, TS31, TS47, TS48 automated (2026-10-04)

Supersedes the TS05/TS27/TS31/TS47/TS48 entries in §7l "Still not built". [source: Faizuddin, 2026-10-04: "do automation for the ones that can be automated now"; "TS05: Allow user to input vehicle number for the automation to check / TS27: SAME AS 05 / ts31: also allow user to input"]

1. **TS05, TS27, TS31 take a vehicle no. typed in the dashboard.** Each scenario has `Scenario.userVehicleNo` in `app/eauto/jomcheck/page.tsx`. Its field appears in Run configuration when the TS is ticked, is required, and is never auto-generated. Env vars: `JOMCHECK_TS05_VEHICLE_NO`, `JOMCHECK_TS27_VEHICLE_NO`, `JOMCHECK_TS31_VEHICLE_NO`. Spec: `scripts/eauto-jomcheck/tests/pre-push-user-vehicle.spec.ts`.
2. **TS05** (UCD only). Picks the transaction named in `PRE_PUSH_REPORTS` (`data/prePushTransaction.ts`), otherwise the OLDEST "Approved" row. Clicks Report and saves the PDF as `12339_TS05-report-<VN>.pdf`. Checks:
   1. The report downloads as a PDF and the Invoice/Report buttons are still shown.
   2. HXJ0001 only: the text equals the saved copy `_reference/tickets/EAINT-12339/EAINT-12339-TS27-report-HXJ0001-uat1-20261001.pdf`.
   3. Every vehicle: the PDF still prints the pre-CR claim table ("MILEAGE **"), not the v2.0 one ("FILLING CATEGORY" / "INCIDENTS SEVERITY SCALE" / "ODOMETER READING **", §7j). Skipped with a DETAIL note when the report has no claims.
   `[unconfirmed]` "oldest Approved = pre-push" is an assumption for vehicles with no saved report. The push date to staging is not recorded.
3. **TS27** (BO only). The pre-push row is the first row with Possible Total Loss "N/A" (TS29's pre-push marker) and no "1." numbering. Asserts each of the 3 claim columns is one bare, non-blank value, and Odometer/Parts are raw figures, not v2.0 bands. No stored values exist to compare against, so they are printed as DETAIL lines for a manual check.
4. **TS31** (UCD + BO). Finds the OLDEST row with Payment "OK" and Tx Status "Failed", records it by its View-link UUID, and confirms its details page has no Report button. Buys a new report for the same vehicle (no eSim set-up), then asserts:
   1. The failed row is unchanged in every column.
   2. It still has no Report button.
   3. The new transaction's 5 columns are not blank and not "N/A".
   Whether the failed transaction appears in the BO listing is printed only, not asserted (OQ-03).
5. **TS47** (eSim, VPN). Spec: `tests/esim-latest-report.spec.ts`. Buys twice on one vehicle no. First purchase: claim 11, "10,001 to 20,000 km", "1 to 10 parts", flags No/No. Second purchase: claim 16, "50,001 to 60,000 km", "11 to 20 parts", flags Yes/Yes. Asserts the second row shows the new values and the first row keeps its own. `setClaimsAndPurchase()` now keeps the FIRST eSim snapshot when one test buys twice on the same prefix, so the restore puts back the state from before the test.
6. **TS48** (BO only). Spec: `tests/bo-report-listing.spec.ts`. Searches by Vehicle No., then asserts Chassis No. is `disabled`; resets, searches by Chassis No., then asserts Vehicle No. is `disabled`. A no-match search (`NOREC#####`) must show the table row "No records found. Please ensure there are existing JomCheck report purchase records." — NOT "0 record(s) in total": on this page `#result-summary` stays empty and hidden (`data-count="0"`) when there are no rows [verified: live run 2026-10-05, TS45 failed on the old wording]. The "0 record(s)" wording was an unverified carry-over from Azfar's 2026-09-29 draft (TS39 there, sourced to the EAINT-8638 study); the counter only ever showed for searches WITH results (`_reference/html/eauto/bo-jomcheck-report-listing.html`). Faizuddin, 2026-10-05: "it should be 'No records found. Please ensure there are existing JomCheck report purchase records.'" — spec and TS wording changed to match. Second live run (2026-10-05, 13:xx) still failed: the locator `table tbody tr td` *containing* the text matched the OUTER layout cell (the BO page nests the listing table in a layout table), whose innerText was the whole listing. Now an exact `getByText(...)` match. The page itself showed the message correctly both times. "Greys out" is the workbook wording (TS48 Test Steps: "confirm the other greys out"). [verified: live HTML from uat1, 2026-10-04, `_reference/html/eauto/bo-jomcheck-report-listing-vehicle-filter-active.html` — `#chassisNo` carries `disabled=""` after a Vehicle No. search]. The reverse also holds (Vehicle No. is disabled after a Chassis No. search), and `disabled` is applied only after clicking SEARCH, not while typing. [source: Faizuddin, 2026-10-04: "yes, also disabled vice versa" / "only after clicking search"]
7. Live runs, 2026-10-04 night: TS47 passed (J600008446 / J600008447). TS05, TS27, TS31 and TS48 not run yet. [source: Faizuddin's pasted run log, 2026-10-04]

## 7r. TS37-TS39 automated without credit-company sharing (2026-10-04)

[source: Faizuddin, 2026-10-04: "REMOVE EVERYTHING ABOUT CREDIT COMPANY. NO NEED TO DO FOR THIS RUN"; then chose "Build TS37-42, skip sharing"]

1. **Spec:** `scripts/eauto-jomcheck/tests/service-portal-listing.spec.ts`. No purchase and no sharing. Each test reads reports ALREADY on the Service Portal listing, searched over the widest Shared Date range (earliest year in the widget → today).
2. **TS37:** Export XLSX. Asserts the "Count(s) of Incidents Severity Scale" column exists and carries all 6 bands. Asserts its counts match the listing row by row, matched by vehicle no. + purchase date (by position if those columns are missing). Asserts there is no Possible Total Loss / Possible BER column. Bulk-downloads the first 3 rows and asserts the ZIP holds 3 readable PDFs. Whether each vehicle no. is printed in a PDF is logged only, because eSim PDFs are dummies.
3. **TS38:** Uses the superadmin account (data/users.ts default). Picks the first report with counters, searches it by vehicle no., and asserts the same 6 bands and counts. The "same counts as the credit company user" check is dropped.
4. **TS39:** Asserts no Possible Total Loss, Possible BER, Type of Claim, Odometer Reading or Total No. of Parts Approved column. Asserts Total Loss History is still shown and filled.
5. **Counter order is never asserted** (OQ-07). Only band names and counts are checked.
6. **TS40-TS42 are removed for this run** [source: Faizuddin, 2026-10-04: "okay, remove it"]. Every expected result is a Service Portal counter, and stopping before sharing leaves nothing to check (BO severity pass-through is TS26). They buy a new report and look it up on the Service Portal. That listing shows only SHARED reports: Shared Date From/To is required and there is a "JomCheck Report Sharing Date" column (`_reference/html/eauto/service-portal-home-and-jomcheck-listing.html`). Without sharing, the new report never appears.
7. **Service Portal Shared Date widget**, captured open 2026-10-05: `_reference/html/eauto/service-portal-jomcheck-listing-datepicker-open.html`. It has Prev/Next arrows, a month select (Jan to the current month) and a year select (2016-2026). Clicking through it failed live, and it stayed on Jan 2026 [source: Faizuddin, 2026-10-05: "it was unable to pick a date in this page. the automation did not do anything"]. The 2026-10-05 error log gives two causes. (a) From: after the year was switched to 2016, `selectOption("0")` on the month failed with "did not find some options". So Jan is not offered for 2016; the widget's earliest date is later in that year (likely a min date about 10 years back) `[unconfirmed: exact min date]`. (b) To: `.ui-datepicker-today a` was not found, because the To calendar does not open on the current month. (Superseded by §7t item 7 and §7u item 5: `setDate()` now picks year, month and a real day click, and the window is at most one month.) It throws if the field stays empty. The old `.fill()` could never work on these readonly fields.
8. **Service Portal login URL is `https://staging.eauto.my/uat1/bank/login/`** [source: Faizuddin, 2026-10-05]. The old guess `/banker/login` returns 404 ("URL not found"). The new URL returns 200 with `name="name"` / `name="pass"` fields [verified: curl, 2026-10-05]. The 2026-10-05 TS37 failure came from that 404: `ServicePortalLoginPage.login()` saw no login form, treated it as "already logged in", skipped login, then timed out on the missing "JomCheck Report Listing" link. `login()` now throws when there is no form and no Service Portal home, and when the form is still shown after submitting. The header of `_reference/html/eauto/service-portal-login.html` still guesses `/banker/login` or `/public/login`; both are superseded by `/<env>/bank/login/` (`scripts/eauto-jomcheck/data/config.ts:36-41`). `[verified: config.ts:36-43]`
9. `[unconfirmed]` The Service Portal export format has not been captured. `readExport()` now takes a header marker (`"Count(s) of Incidents Severity Scale"` here; it defaults to "Transaction Number" for BackOffice).
10. None of these 3 has had a live run.

## 7s. Second renumber: official TS now has 46 rows (2026-10-05)

[source: Faizuddin, 2026-10-05, pasted the current TS sheet and confirmed: "1. yes / 2. follow the pasted version / 3. no, no need for remarks and OQ references"]

1. The official TS is the version Faizuddin pasted on 2026-10-05. It replaces the `N-EAINT-12339 … (Azila review, renumbered).xlsx` file in this folder, which is out of date (49 rows, last saved 2026-10-01 20:11). The pasted version is not saved in the repo as a file.
2. The Service Portal counter TS (TS40–TS42 in §7l numbering) are deleted, not marked N/A.
3. Every later row moved up by 3. Automation, dashboard ids, env vars and evidence labels now use these numbers:

| Now | Before (§7l numbering) | Area |
|---|---|---|
| TS40–TS42 | TS43–TS45 | Wholesale (not automated) |
| TS43 | TS46 | API (`JOMCHECK_TS43_VEHICLE_NO`) |
| TS44 | TS47 | Latest report, eSim (`JOMCHECK_TS44_VEHICLE_NO`) |
| TS45 | TS48 | BO filters and no-match message |
| TS46 | TS49 | Production verification (not automated) |

4. TS01–TS39 keep their numbers. §7q and §7r use the old TS47/TS48 numbers; read them as TS44/TS45.
5. The pasted version has no Remarks and no "OQ-xx" references. Faizuddin chose not to put them back. The open questions themselves are still open.
6. TS45 step 1 now reads: "Filter by Vehicle No. and click Search, confirm Chassis No. is disabled. Reset. Filter by Chassis No. and click Search, confirm Vehicle No. is disabled." The automation already does this.
7. The vehicle-number counter seed in the TS44 spec stays `'0047'`. `'0040'`–`'0042'` are already used by TS22–TS24.

## 7t. Service Portal Shared Date: range must not exceed one month (2026-10-05)

[verified: live run 2026-10-05, TS37 failure screenshot `public/qa-artifacts/eauto-jomcheck/1791165031656/12339_TS37-failed.png`]

1. Searching the Service Portal JomCheck Report Listing with Shared Date From = 05/10/2016 and To = 05/10/2026 does not run the search. The page shows a red message above the table: "Shared Date range must not exceed one month." and the table body reads "No shared JomCheck transactions are currently available."
2. So the "widest range the widget allows" approach in `ServicePortalJomCheckListingPage.search()` (§7r item 7) cannot work. The widget's year list goes back to 2016, but the SEARCH only accepts a window of at most one month.
3. The widget clamps "1 Jan 2016" to 05/10/2016 — exactly 10 years before today. Its min date is today minus 10 years, not a fixed date `[verified: field value after setDate, 2026-10-05]`.
4. The 2026-09-30 capture with 7 records (`_reference/html/eauto/service-portal-home-and-jomcheck-listing.html`) does not record which From/To dates were used. `[unconfirmed: which one-month window holds shared reports on uat1]`
5. The one-month rule is not in the SRD. It is the eAuto DEFAULT for every From/To date filter in every module unless stated otherwise [source: Faizuddin, 2026-10-05: "it should be 1 month only between the to and from. THIS IS A DEFAULT RULE FOR ALL MODULES UNLESS STATED OTHERWISE"]. Also in `knowledge/quirks.md` → Dates.
6. Fix applied 2026-10-05: `search()` now sets From = 1 Jan, To = 31 Jan of the current year [source: Faizuddin, 2026-10-05: "january window", after "because the previous month does not have any transactions" — the shared reports on uat1 are from January 2026]. TS37-TS39 therefore only see reports shared in January; the step is named "Search with Shared Date 1 Jan to 31 Jan this year". Change the window here if the data moves.
7. **The To picker only opens up after the From picker's own onSelect runs.** With From set through `datepicker('setDate')` (no onSelect), the To calendar allowed ONLY today: min = max = today, every other day disabled, Prev/Next disabled, month select "Oct" only, year select "2026" only. So To = 31 Jan was clamped to 05/10/2026 and the search was again rejected (From 01/01/2026, To 05/10/2026). [verified: pasted HTML `_reference/html/eauto/service-portal-jomcheck-listing-one-month-error.html` + TS37 failure screenshot, 2026-10-05]. Fix: `setDate()` now picks through the widget UI — year select, month select, real click on the day — so onSelect fires and To is re-ranged from From. The one-month limit is therefore also enforced by the widget itself (To range = From → From + 1 month), not only by the Search validation `[unconfirmed: exact To max once From is picked]`.

## 7u. TS37-TS39 now buy and share their own report (2026-10-05)

[source: Faizuddin, 2026-10-05: "new update for TS 37-39, user will need to do Jomcheck purchase, and at this step: <UCD purchase page HTML> Automation will need to select 'X STAR TECHNOLOGY MALAYSIA SDN BHD'. only after that can it make payment"]

Supersedes §7r (no purchase, no sharing) and the January-window search in §7t item 6.

1. **Flow per test:** eSim sets 2 claims on the vehicle no.'s prefix (CATASTROPHIC + MEDIUM, ICAP code 1) → UCD "Get JomCheck Reports", submit the vehicle no. → tick "X STAR TECHNOLOGY MALAYSIA SDN BHD" under "Share Report with Financial Institution (Bank and Credit Company)" → Pay Now → log out of UCD → Service Portal login (superadmin `jasons` by default) → JomCheck Report Listing → search the vehicle no. with Shared Date From = To = today → read the row for that vehicle no.
2. **Share list on uat1** (UCD purchase page, pre-payment checkboxes `input.share-cc-pay`, value = company id): mfxstar; X STAR TECHNOLOGY MALAYSIA SDN BHD (`0e501860-7f3b-4748-a5f5-da36ce2a9fa4`); YI LINK TEST SDN BHD. Capture: `_reference/html/eauto/ucd-jomcheck-purchase-share-list-vehicle-found.html` (HXB0001, "Vehicle number found.", Pay Now visible). The company name is `CONFIG.shareCompany` (`JOMCHECK_SHARE_COMPANY`), default "X STAR TECHNOLOGY MALAYSIA SDN BHD".
3. **Code:** `utils/esimPurchase.ts` now has `setClaimsAndBuy()` (eSim + UCD purchase, optional `shareWith`, no BackOffice) and `setClaimsAndPurchase()` calls it then continues to the BO listing as before. `UcdJomCheckPurchasePage.isSharedWithBeforePayment()` confirms the tick before Pay Now. `tests/service-portal-listing.spec.ts` registers the eSim restore hook. Dashboard: TS37-TS39 now need UCD + Service Portal logins, a fresh vehicle no. (`JOMCHECK_TS37/38/39_VEHICLE_NO`) and the VPN (eSim).
4. **Expected counters** for the new report: Catastrophic 1, Medium 1, Critical/High/Low/Severe 0. TS38 asserts exactly this. TS37 compares the export row for the vehicle no. with the listing row and bulk-downloads that one row. TS39 checks headers and the new row's Total Loss History.
5. `ServicePortalJomCheckListingPage.search()` defaults to Shared Date From = To = today, picked through the widget (year select, month select, real day click — §7t item 7). `from`/`to` can be passed for another window, at most one month apart.
6. Passed by 2026-10-05 (supersedes "not yet run live"): "ts34 deprio, all the other passed" (Faizuddin, 2026-10-05 17:12; not verified by a pasted log) `[from handoff 2026-10-05 EAINT-12339]`. The two points below were not checked on their own: `[unconfirmed: that the superadmin account lists a report shared only to X STAR; that the sharing date is today's date in the listing's own time zone]`

## 7v. TS34 (audit log) deprioritised (2026-10-05)

[source: Faizuddin, 2026-10-05: "for ts34, we will deprio in the meantime"]

1. TS34 comes from SRD v1.0 §2.2.6 REQ-007 Example 2: "User selects Export // a. Audit log records UserID, file type and date and time of the export, following existing behaviour." Azfar's 2026-09-29 draft (then TS11) marked it "backend-only, needs Dev (8638 pattern)".
2. No BackOffice page for that log is known (OQ-15 still open). The exported Excel is not the audit log: it has no UserID or export time.
3. Status: not built, not run, deprioritised. Dashboard row stays greyed out with the reason. Pick it up only if dev names a page or agrees to show one entry after a manual export.

## 7w. TS31 finds its own failed transaction in BackOffice (2026-10-05)

[source: Faizuddin, 2026-10-05: "i want the automation to go to BO, filter the transactions to before September with transcation failed, and will do it until it gets a transaction. after that, it will use the transactions details to run the actual test. all of this flow is in the same automation script/flow"]

1. **Flow:** log in to BO → Transaction Enquiry (`/view/jomcheck/enquiry`) → Created At From/To = one calendar month, Transaction Status = "Failed" → search → first row with Payment "OK" and Tx Status "Failed" and a real vehicle no. wins. Starts with August 2026 (the month before September) and goes back one month per search, up to 12 months. Then log out of BO and continue the existing TS31 flow in UCD with that vehicle no.
2. **Dashboard field is optional.** A typed `JOMCHECK_TS31_VEHICLE_NO` skips the BO search and is used as-is.
3. **Dates are picked in the widget** (year select, month select, real day click) — `BoJomCheckTransactionEnquiryPage.pickDate()`. Same reason as the Service Portal (§7t item 7): `.fill()` cannot type into these readonly fields. One month per window because of the eAuto date-range rule (`knowledge/quirks.md` → Dates). `[unconfirmed: whether this page itself rejects a wider range]`
4. **Status filter:** `select#to-filter`, option value "Failed" (`_reference/html/eauto/bo-jomcheck-transaction-enquiry.html` lines 35-40). Row columns read: Vehicle (4th), Transaction No. (6th), Created At (7th), Payment (9th), Tx Status (10th).
5. Run live 2026-10-05 (items 8 and 10 record the first live runs; supersedes "not run live yet"). The month windows and which row was picked are printed as DETAIL lines.
6. **TS27 does the same** [source: Faizuddin, 2026-10-05: "can you do the same thing like TS31, where the automation will search for an existing transaction before the set date i told you"]. Transaction Enquiry with Transaction Status = "Approved", same month windows (August 2026 backwards, 12 months max). For every approved vehicle no. in a window it opens the Report Listing, searches that vehicle and looks for the pre-push 1-claim row (Possible Total Loss "N/A", no "1." numbering, Odometer not "-"). First hit wins; the typed `JOMCHECK_TS27_VEHICLE_NO` skips the search. Only the first 2 approved vehicles of each month are checked [source: Faizuddin, 2026-10-05: "2 is enough"]; vehicles already checked are not re-checked in older months. Shared code: `monthWindowsBefore()`, `findPrePushOneClaimRow()`, `BoJomCheckTransactionEnquiryPage.searchByStatusBetween()`. Run live 2026-10-05 (item 8).
7. **Older months only when a month is empty** [source: Faizuddin, 2026-10-05: "when i said check for the previous month, i only mean to check IF there are no transactions. if automation finds transactions, then use that transaction. no need to go through all"]. Both TS27 and TS31 search August 2026 first. They move to July (and so on, 12 months max) only when the month's search returns NO rows. If the month has rows but none of the ones looked at qualifies (TS31: first 2 Failed rows without Payment OK; TS27: first 2 approved vehicles without a 1-claim pre-push row), the test stops with a message naming the month and the rows/vehicles looked at, so the person can type a vehicle no. instead.
8. **TS27 checks every vehicle of the month, across result pages** [source: Faizuddin, 2026-10-05, after the first live run — August 2026 had 14 approved vehicles, the first 2 (WSR3175, TBR9110) had only 2+-claim pre-push rows and the test stopped: "make the automation go through the pages it needed to make sure it has the needed data"]. The 2-vehicle cap is gone for TS27; it collects every approved vehicle on every page of the month's Enquiry results (`BoJomCheckTransactionEnquiryPage.nextResultsPage()`), checks each in the Report Listing, and moves to the older month only when none in the whole month has a 1-claim pre-push row. TS31 keeps its 2-row cap, because its condition (Payment OK) is visible on the Enquiry page itself. `[unconfirmed: the Enquiry pager markup — not in the 2026-09-30 capture; capture it the first time a month shows more than one page]`
9. **Discovery runs fast** [source: Faizuddin, 2026-10-05: "make it fast. only slow down for the part where the VN is confirmed to have the numbers"]. `BasePage.fastDiscovery = true` while TS27/TS31 hunt (no demo pauses or highlights on any page), set back to false the moment the record is found; TS27 then re-reads the found listing row in demo mode so it is highlighted in the recording, TS31 highlights the Enquiry row. Rule recorded in `knowledge/automation-playbook.md` → "Searching for existing data" item 4b.
10. **BO finds transactions of EVERY company; UCD sees only its own.** First live TS31 run, 2026-10-05: the Enquiry pick was NH4566 / J680008308 (Payment OK, Tx Failed, 12-08-2026), but the UCD listing for NH4566 showed "No record found. Try again." — the transaction belongs to another UCD company. Fix: `EnquiryRow.companyName` (Company Name column) and TS31 only considers rows whose company is `CONFIG.ucdCompanyName` (`EAUTO_UCD_COMPANY`, default "FAIZUDDIN AUTO TEST" — the UCD login's company [source: Faizuddin, 2026-10-05: "the company name is correct"]). A month with failed rows only from other companies counts as empty, so the older month is tried. `UcdJomCheckTransactionListingPage.readRows()` now skips the "No record found. Try again." message row instead of returning it as a blank transaction.
11. **Reverted: TS27 and TS31 take a typed vehicle no. again; the search is a separate "Find data" button** [source: Faizuddin, 2026-10-05: "the TS27 and 32 [sic — TS31] is taking too long. can you make for these both TS to have a button in their row, where it will check for available data headless and fast in the background. after finishing, it will display the data to be used, so i can copy and paste in the main handling up top in the dashboard" / "so revert the TS27 and 31 to accept value, and run the checking"]. Items 6-10 above describe the search logic, which now lives in `utils/prePushFinder.ts` (`findOneClaimPrePushVehicle`, `findFailedPrePushVehicle`) and runs as `tests/find-pre-push-data.spec.ts` (`12339_FIND_TS27`, `12339_FIND_TS31` — not TS, never selectable in the checklist). Dashboard: "Find data" on the TS27/TS31 rows → `POST /api/eauto-jomcheck/find-data` → headless, no video, no demo pauses, own `test-results/_find` folder, separate from the main run → the row shows the vehicle no. (Copy / "Use in the field above"), transaction, company, month found in, and the extra columns; on no match it shows the finder's message and every month/vehicle it looked at. The TS vehicle fields are required again. Finder rule kept: company filter, one month per search, older month only when the month has nothing usable, TS27 checks every approved vehicle across result pages (headless, so speed is fine). TS27 and TS31 passed by 2026-10-05: "ts34 deprio, all the other passed" (Faizuddin, 2026-10-05 17:12; not verified by a pasted log) `[from handoff 2026-10-05 EAINT-12339]`. Whether the passing runs used the Find data finder is not recorded `[unconfirmed]`.
12. **Finders run in parallel** [source: Faizuddin, 2026-10-05: "i can run to find both data simultaniously right? and since its checking, make it open 10 tabs at once, but of course, headless so that i cant see it"]. TS27 and TS31 finders can be clicked together: each is its own Playwright process with its own output folder (`test-results/_find-ts27`, `_find-ts31`). The TS27 finder checks vehicles `CONFIG.findConcurrency` (default 20 since the same day — "increase to 20 tabs. its taking too long also"; `JOMCHECK_FIND_CONCURRENCY`) at a time, each in a new headless tab of the one BO login (`page.context().newPage()`), closing the tab after. The month searches on the Enquiry page stay sequential. `[unconfirmed: that BO serves 20 concurrent Report Listing searches on one session without throttling — first live run will show]`
13. **Finders consider ALL companies** [source: Faizuddin, 2026-10-05: "for TS31, can you make the data checker does not check for my company only. it will check for all available company. same goes for TS27 checker"]. The company filter from item 10 is removed from both finders; the company is shown in each result (row and DETAIL lines). Caveat stands: TS31's UCD half only sees the UCD login's own company, so a TS31 result from another company needs that company's UCD login in the dashboard, or UCD shows "No record found. Try again." TS27 is BO-only and unaffected. `CONFIG.ucdCompanyName` stays as a reference value.

## 7x. Evidence: one video per tab, one row per file (2026-10-05)

[verified: dashboard console error "two children with the same key, /qa-artifacts/eauto-jomcheck/1791172634957/12339_TS05.webm", 2026-10-05]

1. Playwright records one video PER TAB. A test that opens a second tab — the PDF viewer in TS02/TS03/TS05/TS36/TS43 (`BasePage` `context().newPage()`), the TS44 double purchase — ends with two "video" attachments. `app/api/eauto-jomcheck/run/route.ts` published both as `<TS>.webm`: the second overwrote the first on disk and the card listed the same URL twice.
2. Fix: the first video attachment is published as `<TS>.webm` (the main tab), later ones as `<TS>-tab2.webm`, `-tab3.webm`. `publish()` also refuses to list the same URL twice from any path. The dashboard de-duplicates evidence by URL when drawing a card, so results saved by the older code still render without the warning.
3. Earlier the same day the run-level fallback video had the same duplicate (TS37); that path was fixed separately at the time.

## 7y. TS31 creates its own failed transaction with eSim Result = Failed (2026-10-05)

[source: Faizuddin, 2026-10-05: "instead of searching a transaction, you can make it being changing the result to 'Failed' in the eSim. the field is literally called 'Result'"; "its a dropdown, either Passed or Failed"; "after clicking pay, it will show an error message, something like 'unable to generate report'. but after that, if we go to the listing page from UCD side, it will show payment okay, but transaction failed"]

Supersedes §7w for TS31 (the BO search and the "Find data" button are TS27-only now).

1. **The Result that fails a purchase is on the JomCheck REPORT record**, `select#result` with options **Success / Failed** (value = label) — `_reference/html/esim/jomcheck-report-edit-2026-10-05.html`, pasted by Faizuddin 2026-10-05 (the same field is already in the 2026-09-30 capture `jomcheck-report-edit.html`). It is NOT the Enquiry record's Result (Yes / No = vehicle found, `jomcheck-enquiry-edit.html`), which the first draft of this flow wrongly targeted. `EsimJomCheckPage.setReportResult(prefix, 'Failed')` sets it alone and saves. "Result" is now in `REPORT_VEHICLE_FIELDS`, so the snapshot records it and the afterEach restore puts it back; `setClaimsAndBuy()` sets it to "Success" on every purchase.
2. **Flow:** snapshot eSim → Report Result = Failed → UCD purchase on a fresh HX vehicle no.: Submit, "Vehicle number found", Pay Now, confirm → error instead of Download Report (`UcdJomCheckPurchasePage.payNowExpectingFailure()` waits for `#custom-dialog`/any jQuery UI dialog/red `#result`, logs the text, closes it) → UCD Transaction Listing shows the row as Payment OK / Tx Failed → open it, no Report button → `setClaimsAndBuy()` (Report Result = Success + 1 claim) buys again on the same vehicle → old row unchanged (same UUID, same fields), still no report → BO listing has the new transaction with the 5 re-sourced columns; whether the failed one is listed is printed only (OQ-03). eSim restored by the afterEach hook.
3. **Dashboard:** TS31 is now an eSim test (violet, VPN, fresh vehicle no. `JOMCHECK_TS31_VEHICLE_NO`). No typed pre-push vehicle, no Find data. `12339_FIND_TS31` removed.
4. `[unconfirmed: the exact UCD error text and element after a failed Pay Now — never seen live; the first run prints it as DETAIL "UCD error after Pay Now". Capture the page then.]`
5. Passed by 2026-10-05 (supersedes "not run live yet"): "ts34 deprio, all the other passed" (Faizuddin, 2026-10-05 17:12; not verified by a pasted log) `[from handoff 2026-10-05 EAINT-12339]`.

## 7z. TS31 variant for an EXISTING failed transaction, checked from BackOffice (2026-10-05)

[source: Faizuddin, 2026-10-05: "for TS31, can you just make it check whatever we can check through my current UCD and BO side. because i dont have the creds for the original account that made the failed transaction"; then "okay do that" to building it in addition to the eSim version]

1. Dashboard row "TS31 (existing failed transaction)" under section C (id `ts31x`), spec test `12339_TS31 (existing failed transaction): …` in `tests/pre-push-user-vehicle.spec.ts`. The eSim TS31 (§7y) stays as the main one.
2. **Flow:** BO login → Transaction Enquiry, search the typed vehicle no. → oldest row with Payment OK / Tx Failed (any company; recorded with company, transaction no., created at) → open it → BO Transaction Details has no REPORT button (`BoJomCheckTransactionDetailsPage.isReportButtonVisible()`) → log out → OUR UCD buys a new report on the same vehicle (no eSim set-up; whatever staging is connected to) → log out → BO Enquiry again: the old row is unchanged field by field and still has no REPORT button; the new transaction is listed → BO Report Listing: the new transaction has the 5 re-sourced columns, not blank, not "N/A"; whether the old failed one is listed is printed only (OQ-03).
3. **Why BO, not UCD, for the old row:** a UCD login sees only its own company's transactions (§7w item 10). BackOffice sees all. The UCD-side "no Report button" check from the workbook therefore moves to BO for this variant.
4. **Find data** on this row (`12339_FIND_TS31`, `findFailedPrePushVehicle`) lists failed transactions of every company, August 2026 first, older month only when none; the company is shown so the person knows it is not theirs.
5. Env var `JOMCHECK_TS31X_VEHICLE_NO` (required). Covered by "ts34 deprio, all the other passed" (Faizuddin, 2026-10-05 17:12; not verified by a pasted log) `[from handoff 2026-10-05 EAINT-12339]`; whether that included this variant row is not stated `[unconfirmed]`.

## 9. EAINT-12412 — invoice / e-Invoice split into 2 line items (studied 2026-10-01)

Raw sources: `_reference/tickets/EAINT-12412/` (SRD v1.0 PDF, 30 Sep samples,
`NOTES.md` with the Teams thread and the dev analysis doc quoted verbatim).

1. **What changes:** only the invoice PDF (UCD and BO `#to-print-invoice`) and
   the e-Invoice (`#to-print-e-invoice` + the LHDN submission). The single
   RM20.00 line becomes RM18.00 + RM2.00. Each line has 8% SST: RM1.44 + RM0.16.
   [source: SRD v1.0 §2.2.2 item 2]
2. **Totals stay the same:** Subtotal RM20.00, Tax Amount RM1.60, Total
   Payable RM21.60. [source: SRD v1.0 REQ-004]
3. **Cut-off is the approval date and time, not the creation date.** "Transaction
   created before deployment but approved after deployment / a. Invoice and
   e-Invoice show 2 line items". [source: SRD v1.0 REQ-001 Example 3] Old
   invoices downloaded again after deployment still show 1 line, and the
   e-Invoice is not resubmitted. [source: REQ-001 Example 2]
4. **Not changing:** the screen price ("RM20.00 + 8% Service Tax"), the
   revenue split (eAuto RM6 / ezAUTO Asia RM14) in the revenue, SST and
   e-Invoice reports, and the purchase price. [source: SRD v1.0 §2.1.2 items
   2–4; BA answers Q1 and Q6 in the dev analysis doc]
   For QA: the invoice's RM2.00 eAuto line and the reports' eAuto RM6 are
   meant to differ. That is by design, not a defect.
5. **UCD and BO invoices must match** for the same transaction. [source: REQ-005]
6. **Dev says** the e-Invoice code already sends multi-line e-Invoices
   (Service Hub), and other products sharing that code (eSTM, insurance, APT)
   do not change. JomCheck cancellations are untouched. Invoices from before
   July 2025 keep their old layout. [source: Teams, Goh Kai Jiaeh dev analysis
   doc, 2026-09-28] [unconfirmed]
7. **Line item names — SETTLED 2026-10-15 (see §9e).** Line 1 "JomCheck
   report" (RM18), line 2 "JomCheck service charge" (RM2). The first v1.0 PDF
   (read 2026-10-01) still said "JomCheck service charge" + "eAuto service
   charge" because it was not regenerated after v0.3; the PDF re-uploaded on
   2026-10-09 carries the renamed lines. [source: re-uploaded SRD v1.0, REQ-002/003]
8. **e-Invoice classification code — SETTLED 2026-10-15 (see §9e).** "Both
   line items use classification code 022." [source: re-uploaded SRD v1.0 REQ-006]
9. **Existing automation:** `scripts/eauto-jomcheck` downloads the invoice and
   e-Invoice (TS04, `tests/ucd-purchase-flow-checks.spec.ts`), but nothing parses
   the PDF amounts. To automate this CR, add a PDF text check on the downloaded
   invoice.
10. **Testing environment:** not stated in the ticket, the SRD or Teams, as of
    2026-10-01. `scripts/eauto-jomcheck/data/config.ts:5` defaults to
    `https://staging.eauto.my/uat1`. [unconfirmed for this CR]

### 9a. People and sources

| Role | Person | Source |
|---|---|---|
| BA, assignee, reporter, SRD author | Chee Mei Jia | Jira fields; SRD §1.3 |
| Dev (analysis doc) | Goh Kai Jiaeh (KJ) | Teams, 28/09/2026 11:44 |
| Also tagged for advice | Jin Siang Boo | Teams, 28/09/2026 09:13 |
| Finance contact for the classification code | Marie | Teams, 29/09/2026 16:01 |
| Updates Finance on RM18 + RM2 | Nurul | BA answer Q2 |
| Related tickets | CCB-994 (cross-department), EAUTO-1070 (source) | SRD §1.5 |

### 9b. BA answers (dev analysis doc, verbatim)

Doc: `https://claude.ai/artifact/EZMpdafNRnYRXHY8Wm7ZbC` ("JomCheck invoice split
(EAINT-12412): points to confirm", KJ, 2026-09-28). The answer table was posted
to Teams by Chee Mei Jia, 29/09/2026 15:32.

| # | Question | Status | BA answer |
|---|---|---|---|
| 1 | Option A (invoice wording only) or Option B (revenue split changes)? | Agreed | "Option A. Invoice wording only. Revenue split stays eAuto RM6 / ezAUTO Asia RM14." |
| 2 | Finance sign-off | Agreed | "Nurul will update Marie that invoice will show RM18 + RM2." |
| 3 | Exact wording of the two lines | Agreed | "Line 1 "JomCheck service charge", line 2 "eAuto service charge"." |
| 4 | Same e-Invoice classification as today? | Open | "Pending." |
| 5 | Cutover: paid before go-live, approved after | Agreed | "Yes. Approval date decides. Approved after go-live gets 2 lines, even if paid before go-live." |
| 6 | Should UCD or BackOffice screens also show the breakdown? | Agreed | "No. Only invoice and e-Invoice change. Screens stay as today." |

Dev background from the same doc: "each RM20 JomCheck fee is recorded as RM6
for eAuto and RM14 for ezAUTO Asia. This is what our revenue and SST reports
use. It became RM6 after the September price increase (EAINT-10089); before
that it was RM4 + RM14 = RM18." Under Option B, the reports that would have
changed are the "SST payment report, finance revenue report, e-Invoice reports,
dashboard". With Option A, none of these change.

### 9c. Teams timeline (CR group chat named after the ticket)

1. 28/09 09:08: Chee Mei Jia opens the CR group.
2. 28/09 11:44: KJ, "ya true. einvoice submission will be changed also."
3. 29/09 15:32: BA answer table posted.
4. 29/09 16:01: "SRD v0.2 & Samples are ready in jira ya" / "now pending
   confirmation with Marie on the e-invoice classification code ya".
5. 30/09 15:53: "SRD v0.3 & SRD v1.0 + samples are ready yaa."
6. 01/10 14:27: "also to update that requestor given green light for SRD v1.0 ya".
7. 01/10 14:32: no one joined the briefing; "we reschedule it to next Monday
   11am" (Mon 05/10/2026 11:00).

### 9d. Sample invoice and e-Invoice layout (30 Sep samples)

1. **Invoice header fields:** Document Code (`EA-IV-1026-0000001`), Date,
   Payment Reference No. (`JOM261015000001-ABC1234`, so a `JOM<yymmdd><seq>-<vehicle no>` shape),
   Supplier (EAUTO SDN BHD, SST Reg `W10-1808-3101-4293`, Reg `200401038456`), Buyer, Vehicle No.
2. **Invoice line columns:** Description | Quantity # | Unit Price RM |
   Subtotal RM | Tax Amount RM | Total Price (including tax) RM.
3. **Invoice totals block:** Total Net Amount, Total Excluding Tax, Tax Amount,
   Total Including Tax, Total Payable Amount; then a tax summary of Tax Type
   "Service Tax", Tax Rate "8%", Tax Amount.
4. **e-Invoice extra header fields:** e-Invoice Type `01-Invoice`, e-Invoice
   Version `1.1`, Unique Identifier No., Submission Date, Validation Date,
   Currency Code `MYR`, Original e-Invoice UIN "Not Applicable", Supplier TIN
   `C21450560100`, MSIC Code `62099`, Business Activity Description "Other
   information technology service activities n.e.c.".
5. **e-Invoice line columns:** Classification | Description | Quantity # |
   Unit Price RM | Amount RM | Tax Type | Tax Amount RM | Total Price (including tax) RM.
   Both sample lines show classification `022`.
6. The sample values (buyer, UIN, dates) are dummy data. Only the layout and
   amounts are the spec.


### 9e. Status 2026-10-15 — names and code settled, dev ETA passed, release 20/21 Oct

1. **SRD v1.0 PDF re-uploaded 2026-10-09** (Jira attachment 159431; Mei Jia Chee
   in the CR chat, 09/10 09:41: "sorry yaaa. i reupload the PDF version for SRD
   v1.0"). Saved as
   `_reference/tickets/EAINT-12412/EAINT-12412-SRD-v1.0-20260930-reupload-20261009.pdf`.
   It adds the v0.3 revision row "Updated Section 2.1, 2.2.2, 2.2.5 and 2.2.6;
   Renamed Both Invoice Line Items and Confirmed e-Invoice Classification Code"
   and changes §2.1.1, §2.2.2, REQ-002/003 and REQ-006 accordingly. The first
   PDF (`...-20260930.pdf`) is the un-regenerated copy; do not cite it for the
   line names. [verified: diff of both PDF texts, 2026-10-15]
2. **Line item names (settles item 7 above):** line 1 **"JomCheck report"**
   RM18.00 + SST RM1.44 = RM19.44; line 2 **"JomCheck service charge"** RM2.00 +
   SST RM0.16 = RM2.16. [source: re-uploaded SRD v1.0 §2.1.1, §2.2.2 item 2,
   REQ-002, REQ-003]. The Jira summary ("JomCheck Service Charge and eAuto
   Service Charge") and BA answer Q3 are stale.
3. **Classification code (settles item 8 above):** "Both line items use
   classification code 022." Transactions approved before deployment: "e-Invoice
   remains as submitted, no resubmission". [source: re-uploaded SRD v1.0 REQ-006]
4. **Dev:** PIC Sia Zhong Tai (added to the chat by Tan Yi Fung 06/10). Mei Jia
   Chee 06/10 11:03 asked for an ETA; Sia Zhong Tai 07/10 09:42: "will be done
   on Fri before EOD" (Fri 09/10); 10:37 confirmed code review is included.
   Jira still **Ready For Development** on 2026-10-15 (last updated 2026-10-12),
   QA field empty. `(source: Teams, EAINT-12412 chat)`
5. **Briefing** held 05/10 11:01–11:09, recorded, transcript in the chat.
6. **Release:** fix version "S34.X-20261020/21 🌞 TBC", release date 2026-10-20.
   May Chin Mei Theng, "eAuto QAs" 15/10 10:11: "EAINT-12412 - 1 + 1 = 2 days",
   deploy "on 20th or 21st Oct next week". `(source: Teams, 2026-10-15)`
7. **Testing environment:** still not stated anywhere. `[unconfirmed]`
8. **Data to prepare before the CR reaches staging:** at least one JomCheck
   transaction approved before the deploy (REQ-001 Example 2) and one created
   before but approved after (Example 3). These cannot be made after the fact.

9. **QA Portal task** (`http://10.30.10.214/tasks/12917a6c-e007-4d11-b2a5-2301be1cf8ba`,
   last updated by May Chin 2026-10-09, read 2026-10-15 without changes): no Dev
   PIC, no QA PIC, Own staging, UAT skipped, Est. 2 days, **Dev ETA for testing
   2026-10-12** (synced from Jira 09/10). Its High-Level Test Scope is wider than
   the SRD. Verbatim extras beyond the SRD's invoice/e-Invoice pages:
   "SST Payment Report - ensure Revenue Split remains unchanged (eAuto RM6 &
   ezAUTO Asia RM14)"; "Wholesale / Make payment + Jomcheck Report > verify
   Invoice & e-Invoice in UCD and BO Jomcheck Details page / Wholesale chatbot
   - ask chatbot the current price of Jomcheck should RM20 only, no need to
   split"; "MyInvois / Ensure the Line Items show correctly with 2-lines (same
   as e-Invoice)". Scenarios: "TS1: Create Jomcheck Transaction from UCD portal
   > verify in UCD & BO Jomcheck Details page > Invoice & e-Invoice display fee
   in 2-lines > verify MyInvois"; "TS2: Create Jomcheck Transaction from
   Wholesale > ..."; "TS3: Before deployment: Create Jomcheck Transaction >
   Transaction Failed > After deployment > Resubmit from BO > ... 2-line >
   verify MyInvois"; "[Regression] TS4: Approved before deployment > ... 1-line
   > verify MyInvois". The portal still says "Classification Code - pending
   confirmation from Finance / Jomcheck Service Charge - 022-Others / eAuto
   Service Charge - 022-Others"; that text predates the 09/10 SRD re-upload
   (item 3 above) and the name "eAuto Service Charge" there is stale.

### 9f. EAINT-12412 automation (built 2026-10-15, not run live yet)

[source: Faizuddin, 2026-10-15: "i will give the environment later. put this in the automation" / "3 and 4, start making automation"]

1. **Where:** specs `scripts/eauto-jomcheck/tests/invoice-split-12412.spec.ts` (TS01, TS03, TS06, TS07) and `invoice-split-12412-setup.spec.ts` (`12412_SETUP_APPROVED`, `12412_SETUP_FAILED`); shared checks in `utils/invoicePdf.ts`; new methods on `UcdJomCheckTransactionDetailsPage` / `BoJomCheckTransactionDetailsPage` (`downloadInvoiceAsText`, `downloadEInvoiceAsText`, `waitForEInvoiceButton`, `getLhdnResponseStatus`, BO `getStatusText`; the BO details-page `resubmit`/`waitForStatus` were later removed — Resubmit lives on the Enquiry listing, item 6 and §9g). Dashboard `app/eauto/12412/page.tsx`; routes `app/api/eauto-12412/{run,download-all,history}` (copies of the jomcheck routes: own evidence folder `public/qa-artifacts/eauto-12412`, 35-minute per-TS limit). Catalogued in `lib/ticketAutomations.ts`.
2. **Setups run BEFORE the dev push** (REQ-001 cut-off is the approval date): SETUP_APPROVED buys on a fresh HXA####A vehicle and saves the 1-line Invoice/e-Invoice PDFs as the "before" copies; SETUP_FAILED uses eSim Report Result = Failed (same as 12339_TS31, §7y; VPN; restored after). Vehicle counter is shared with the 12339 page (`eauto_jomcheck_vn_counter`).
   **Setups are not tied to a TS** [source: Faizuddin, 2026-10-15: "for every test data preparation, it will not automatically connect it to any TS ... so if the first run failed, i have multiple test data i can choose from to run it again"]. Each setup has a "How many" count (1-10); every passed run adds a record to the dashboard's **Test data pool** (localStorage `eauto_12412_test_data_pool`): "Approved, before deployment" (SETUP_APPROVED), "Failed, before deployment" (SETUP_FAILED), "New purchase, after deployment" (a passed TS01). TS03 / TS06 / TS07 each have a picker of the matching kind plus a free-text field; every TS run is logged on the record it used. Rule recorded in `knowledge/automation-testing.md` and the eauto-automation-scaffold skill (§5 rule 15).
3. **Checks are on the parsed PDF text** (pdf-parse, uppercase): 2-line = "JOMCHECK REPORT" + "JOMCHECK SERVICE CHARGE" + all of 18.00/1.44/19.44/2.00/0.16/2.16/20.00/1.60/21.60; 1-line = "JOMCHECK SERVICE CHARGE" only, 20.00/1.60/21.60, none of the split-only amounts; e-Invoice code 022 counted per line; UCD-vs-BO = same document code, payment reference, line names and the full sorted list of printed amounts.
4. **e-Invoice button wait:** the button only exists after LHDN validation (§ UCD details page comment, 2026-10-01). The details page is reloaded every 15 s up to `CONFIG.eInvoiceApprovalTimeout` (10 min, `JOMCHECK_EINVOICE_TIMEOUT_MIN`). Setup / TS01 / TS03 / TS07 wait; TS06 expects it present already.
5. **Invoice / e-Invoice buttons download the PDF directly** [source: Faizuddin, 2026-10-15: "it will download"]. `downloadPdfViaButton()` keeps its new-tab branches only as a safety net; a "delivered via popup-…" DETAIL line would mean the page changed.
6. **BackOffice "Resubmit" is on the Transaction Enquiry LISTING, not on the details page** [source: Faizuddin, 2026-10-15: "the resubmit button is here, not after BO user click 'View'"; capture `_reference/html/eauto/bo-jomcheck-transaction-enquiry-failed-resubmit.html`]. See §9g. TS07 now: BO login → Transaction Enquiry → search the picked vehicle no. → the Failed row with a Resubmit link → `BoJomCheckTransactionEnquiryPage.resubmitRow()` → search again every 15 s (up to `CONFIG.resubmitProcessingTimeout`, 5 min) until the SAME transaction no. reads Approved → View → Invoice / e-Invoice → UCD copies. The earlier details-page guess (`BoJomCheckTransactionDetailsPage.resubmit()` / `waitForStatus()`) is removed. `[unconfirmed]` what follows the click — `resubmitRow()` accepts a native confirm, clicks Yes on a jQuery UI confirm, clicks OK on a message dialog, and logs each as the DETAIL line "Prompts after Resubmit"; and whether the resubmitted row keeps its transaction no. (assumed) or a new row appears.
7. **Not automated:** TS02 (Wholesale chatbot, no UI flow), TS04 (SST Payment Report — page never captured; needs the BO navigation and HTML), TS05 (MyInvois — no sandbox login known; TS06/TS07 print the e-Invoice UIN and Submission Date to speed the manual check).
8. `[unconfirmed]` pdf-parse may place "JOMCHECK REPORT" elsewhere on the invoice (e.g. a heading) — the 1-line assertion `not.toContain(LINE_1)` would then fail wrongly on TS06. Check the first TS06 PDF text in the log.
9. **Highlighted PDF evidence (2026-10-15)** [source: Faizuddin asked "the automation script also check with the downloaded PDF, and included the screenshot into the downloadable test evidence?", then "yes" to adding it]. Every Invoice / e-Invoice download (`downloadPdfViaButton()`) now also saves `<label>-checked.png`: the PDF drawn by pdf.js with red boxes on every checked item — "JomCheck report", "JomCheck service charge", the nine amounts, code 022 (e-Invoice only), document code and payment reference. The caption lists what was found and, in bold, what is "Not on the PDF" (expected for a 1-line TS06 invoice: "JomCheck report" and the split-only amounts). Taken before any assertion so a failed check still has its picture; the file name carries the TS label, so it joins that TS's evidence and zip. DETAIL line "<label> — highlighted screenshot" reports found/total. Code: `scripts/eauto-jomcheck/utils/pdfHighlight.ts`. [verified: run on the SRD sample invoice and e-Invoice, 2026-10-15 — 13/13 and 14/14 items, boxes on the right words]

### 9g. BackOffice JomCheck "Resubmit" — where it is and who sees it (2026-10-15)

[source: Faizuddin, 2026-10-15, pasted page: "the resubmit button is here, not after BO user click 'View'". Capture: `_reference/html/eauto/bo-jomcheck-transaction-enquiry-failed-resubmit.html`]

1. **Location:** BackOffice → Jomcheck Transaction (Transaction Enquiry, `/view/jomcheck/enquiry`) → result table → **Action** column, after "View": `| <a href="#" class="to-resubmit" txid="<transaction uuid>" title="to resubmit <Transaction No.>">Resubmit</a>`. It is NOT on the Transaction Details page that "View" opens.
2. **Which rows:** only rows with Payment "OK", Tx Status "Failed", LHDN Response Status "-" and Remarks "Failed to retrieve report" (rows 6-10 of the capture: HXA0253A-HXA0249A, J600008508-J600008504, created 15-10-2026 15:53-15:57). Approved rows show only "View".
3. **It is existing BackOffice behaviour, not part of EAINT-12412.** The SRD's affected pages are the UCD invoice, BO invoice and the LHDN e-Invoice only (SRD §2.2.3). TS07 uses it because the QA Portal scope (§9e item 9, TS3) needs a pre-deployment transaction approved after deployment (SRD REQ-001 Example 3).
4. **Who sees it:** the capture is a **HubAdmin** login ("Ong Hong Kee"; page script `var _userRole = "HubAdmin"`). Whether other BackOffice roles see or can use it is `[unconfirmed]` — ask dev (Sia Zhong Tai) or Mei Jia.
5. **After the click:** not captured `[unconfirmed]`. The first TS07 run logs every prompt as the DETAIL line "Prompts after Resubmit" and saves screenshots before and after the click; capture the page then if a dialog or message appears.
6. **Environment of the capture:** links use context path `/eauto` (earlier captures used `/uat1`). The base URL was not stated `[unconfirmed]`.

### 9h. First live runs of 12412_TS01 (2026-10-19)

1. **Environment: 12412 is on `uat1`, not on `/eauto`.** `[verified: live run, 2026-10-19]`
   - `https://staging.eauto.my/eauto` — J600008536 / HXA0280A, Approved, paid
     19 Oct: invoice and e-Invoice still **1 line** "JomCheck service charge"
     20.00 / 1.60 / 21.60. Faizuddin: wrong environment, not changed before the run.
   - `https://staging.eauto.my/uat1` — J600008537 / HXA0281A, Approved, LHDN
     OK: invoice and e-Invoice **2 lines** — "JomCheck report" 18.00 / 1.44 /
     19.44 and "JomCheck service charge" 2.00 / 0.16 / 2.16, totals 20.00 /
     1.60 / 21.60; highlighted screenshots found 13/13 (invoice) and 14/14
     (e-Invoice). e-Invoice UIN EA-IV-1026-0001109. The e-Invoice button
     appeared without waiting on uat1; on `/eauto` it took 8 reloads.
2. **Live e-Invoice text as pdf-parse reads it** (uat1, 2026-10-19): headers
   `CLASSIFICATION DESCRIPTION QUANTITY # UNIT PRICE RM AMOUNT RM TAX TYPE TAX AMOUNT RM TOTAL PRICE (INCLUDING TAX) RM`,
   rows `022JOMCHECK REPORT118.0018.00SERVICE TAX1.4419.44` and
   `022JOMCHECK SERVICE CHARGE12.002.00SERVICE TAX0.162.16`, then
   `SUBTOTAL20.001.6021.60 TOTAL EXCLUDING TAX20.00 TAX AMOUNT1.60 TOTAL INCLUDING TAX21.60 TOTAL PAYABLE AMOUNT21.60`.
   The e-Invoice has no "Total Net Amount"; its first total row is "Subtotal"
   with three values (net, tax, total).
3. **Trap — pdf-parse glues cells together.** No space between a cell and the
   next one ("022JOMCHECK", "118.0018.00"). A `\b022\b` count found 0 codes
   and failed TS01 although both lines carry 022. `utils/invoicePdf.ts` now
   counts `(?<!\d)022(?!\d)` — 2 on that e-Invoice, 0 on its invoice. Any new
   PDF check must not rely on word boundaries between cells; check for the
   value as a substring, or bound it by "not a digit" only.
4. **Recording trap — fixed in the 12412 run route.** The Invoice and e-Invoice
   clicks each open a blank tab for ~1 s; Playwright lists those two videos
   (`video-1`, `video-2`) before the main `video.webm`, and the route took
   the first one as the TS video, so the dashboard showed a 1-second clip
   (Faizuddin: "only records 1 second"; 22 MB main vs two 5 KB clips). The
   route now publishes the **largest** video as `<TS>.webm`; the 12339 and
   12107 run routes got the same fix the same day.

5. **Third run (uat1, J600008538 / HXA0282A, 2026-10-19):** 022 counted 2, then
   failed comparing Invoice with e-Invoice as one document (document code
   "EA-IV-1026-0001110" vs "E-INVOICE", payment reference read as "19" vs
   "ORIGINAL"). Fixed: (a) Invoice vs e-Invoice now compares line items only
   (`expectSameLines`) — they are different documents; (b) payment reference
   is matched as `JOM\d{6,}-<vehicle>` (the label is followed by the date on
   the live invoice) — reads `JOM261019000003-HXA0282A` on both PDFs; (c) the
   022 check is now PER LINE: each line must read "022" immediately followed
   by its own description (`022JOMCHECK REPORT`, `022JOMCHECK SERVICE CHARGE`),
   SRD REQ-006 c. Faizuddin first said to drop 022, then: "if its from the SRD,
   include it in the checking, but make sure the automation is able to check it
   properly". `expectClassificationCodes(text, 1 | 2)` in `utils/invoicePdf.ts`;
   used on the e-Invoice in TS01, TS03, TS06 (1 line), TS07.
   [verified: run on 5 saved PDFs, 2026-10-19 — passes both uat1 2-line
   e-Invoices and the /eauto 1-line e-Invoice as 1 line; fails that 1-line
   e-Invoice as 2 lines and fails the invoice, which carries no codes]


6. **Evidence screenshot colours (2026-10-19)** — Faizuddin: "if it pass, the box
   is green. but if its incorrect, the incorrect details will have red boxes".
   `utils/pdfHighlight.ts` now takes a spec (expected / forbidden / anchors /
   per-line code) built by `buildHighlightSpec()` in `utils/invoicePdf.ts`:
   green = expected item found; red = a forbidden item found (a pre-push
   document carrying "JomCheck report" or a split amount), a line without its
   022, or the ROW where a missing amount belongs; items with nowhere to box are
   listed in red in the caption. The caller says which layout to expect:
   `downloadInvoiceAsText(label, 'one-line')` for TS06 and SETUP_APPROVED,
   two-line otherwise. Document code is now read as `EA-XX-MMYY-n` (the
   e-Invoice's "e-INVOICE" heading was being read as its code).
   [verified: rendered on 5 saved PDFs, 2026-10-19 — correct uat1 invoice /
   e-Invoice all green (13 / 14); /eauto 1-line e-Invoice as 2-line: service-
   charge row red, report line listed missing; same as 1-line: all green;
   uat1 2-line e-Invoice as 1-line: "JomCheck report" and the split amounts red]


7. **TS07 live run (uat1, 2026-10-19) — Invoice and e-Invoice disagree.**
   J600008505 / HXA0250A, paid 15 Oct (before the push, payment ref
   JOM261015000003-HXA0250A), Failed, resubmitted from BackOffice today
   (prompts: confirm "Sure to resubmit?", alert "Succesfully resubmit.") →
   Approved. **e-Invoice: 2 lines** (022 + "JomCheck report" 18.00/1.44/19.44,
   022 + "JomCheck service charge" 2.00/0.16/2.16). **Invoice: still 1 line**
   ("JomCheck service charge" 20.00/1.60/21.60). Both carry document code
   EA-IV-1026-0000857. SRD REQ-001 Example 3 ("created before deployment but
   approved after") expects 2 lines on BOTH. Matches the system chatbot's
   reading of prod code: the Invoice follows the PAYMENT date, the e-Invoice is
   built at approval. Not an automation fault — raise with dev / BA.
   `[verified: PDFs from the run, 2026-10-19]`


8. **TS renumbered ascending (2026-10-19).** The workbook, automation titles,
   env vars and `/eauto/12412` now use sheet-order numbers: old TS03 → TS05,
   TS04 → TS06, TS05 → TS07, TS06 → TS08, TS07 → TS09, TS08 → TS10, TS09 → TS11,
   TS10 → TS03, TS11 → TS04 (TS01, TS02, TS12 unchanged). Items 1–7 above use
   the OLD numbers (TS07 there = TS09 now). Map: ticket NOTES.md.


9. **Invalid TIN → no e-Invoice at all (2026-10-19).** A JomCheck bought by a
   UCD whose company has an invalid TIN gets the Invoice only — no e-Invoice is
   generated. Faizuddin: "if the account has invalid TIN, it will not generate
   any e-Invoice". TS03 (invalid TIN) now expects "e-Invoice -> Not generated";
   the automation reloads the details page until LHDN Response Status reads a
   failure (or the 10-minute LHDN window ends) and fails if the [e-Invoice]
   button ever appears. Matches EAINT-8550 / 8686 (business-rules §8 item 1,
   §5 item 9). `[user, 2026-10-19]`
10. **TS04 makes its own Failed transaction (2026-10-19).** Faizuddin: "shouldnt
   the automation change the settings in the eSim and create a failed
   transaction?" — TS04 now sets eSim Report Result = Failed for the fresh
   vehicle no.'s prefix, buys (pays, report fails), checks the Invoice of that
   Payment OK / Tx Failed transaction, and restores eSim (needs the VPN). Only
   the optional Cancelled half takes a typed vehicle no. Rule for any TS whose
   data the automation can create itself (eSim): create it in the TS, do not
   ask for a typed vehicle no. The pre-push setups stay a pool because their
   data cannot be made after the push.


11. **A Failed JomCheck gets no e-Invoice, even with a valid TIN (2026-10-19).**
    The e-Invoice is only created when the transaction turns Approved. Evidence:
    BackOffice Transaction Enquiry Failed rows show LHDN Response Status "-"
    (capture 15 Oct, §9g item 2); 12412_TS09 run 19 Oct — J600008505 read
    "OK / Failed · LHDN -" before Resubmit and only got an e-Invoice after it
    became Approved; system chatbot (prod code): "Transaction ends Failed or the
    report fails — no e-Invoice is submitted, but an Invoice may still exist if
    payment went through." So TS04 (paid, then Failed) checks the Invoice only.
    Faizuddin, 2026-10-19: no TS row and no automation check needed for the
    missing e-Invoice. `[verified: staging uat1 + capture; chatbot for the rule]`
12. **A JomCheck transaction is never Cancelled (settled 2026-10-19).** System
    chatbot (prod code, eauto origin/prod/master, 15 Oct 2026), asked by
    Faizuddin: a JomCheck transaction only ever moves through **New** (created) →
    **Pending** (payment submitted, RHB direct debit in flight) → **Approved**
    (report returned) or **Failed** (empty report, JomCheck API timeout, or fund
    transfer failed). Nothing sets it to Cancelled; the "Cancelled" branch in the
    Invoice-button rule is shared with modules that do cancel (BMK, OTH, LKM,
    eSTM) and is dead code for JomCheck. A Cancelled JomCheck could only exist
    if set directly in the data.
    - **The only JomCheck "cancel" is on the invoice:** BackOffice → JomCheck
      SST Payment Report → Invoice Detail popup → **Cancel Invoice**. It adds a
      separate reversal row (negative amounts, same invoice no., cancellation
      date, refund type, remarks, text "Cancelled"); the transaction keeps its
      status (normally Approved). Finance-flagged BackOffice users only (others
      get access denied). The report has a filter that **hides cancelled rows**,
      so a cancelled invoice can look like it vanished.
    - **"Paid but not Approved" = Failed:** payment succeeds, the report step
      fails → Tx Failed, Payment Paid; Invoice button shown, e-Invoice button not
      (it needs Approved-or-Failed AND LHDN status OK). On a simulator env this is
      driven by `settings.eauto.jomcheck.connection.mode` and the simulator's
      answer — eSim Report Result = Failed (§7y), what 12412_TS04 does.
    - 12412_TS04 therefore covers paid-then-Failed only; its title, steps,
      automation and dashboard dropped "Cancelled" on 2026-10-19.
    `[from system chatbot, prod code, 2026-10-19 — staging not checked separately]`
13. **Finance report pages for 12412 TS06 / TS10 / TS11 (2026-10-19).**
    - **SST Payment Report (JomCheck)**: BackOffice, Reports column →
      "SST Payment Report (JomCheck)", `/view/jomcheck/sst-payment-report`.
      Filters: Created Date from/to (readonly datepickers, `input[name=fromDate]`
      / `[name=toDate]`), Transaction No (`transactionRefNo`), Vehicle No
      (`vehicleRegNo`), Payment To (default "eAuto"), Transaction Type JomCheck
      (ticked), Hide Cancel Transaction (default No). Details appear only after
      **Generate »** (`#generate-summary`). One row per transaction: Amount 20.00,
      Total Service Tax 1.60, Total 21.60, EAUTO 6.00, SST 0.48, EZAUTO ASIA
      14.00, SST 1.12, plus a tfoot Grand Total. Each row has "Cancel »"
      (Cancel Invoice) — never click it.
      `[verified: live HTML from uat1, 2026-10-19 — _reference/html/eauto/bo-sst-payment-report-jomcheck-generated.html]`
    - **e-Invoice / Consolidated e-Invoice Listing**: BackOffice, "Proforma
      Invoice / e-Invoice" column, `/view/einvoice/enquiry/`. Filters: Company
      Name, Type (JomCheck = `JCK`), LHDN e-Invoice Status, Payment Date From/To
      (required, readonly datepickers, future days disabled), Consolidated dates
      and status. **No Vehicle / Document Code / Transaction No filter**: find
      the row by Company Name + Type + Payment Date, then match the Vehicle or
      Document Code column. 50 rows per page. JomCheck rows show 20.00 / 1.60 /
      21.60 ("Total Including Tax (RM)").
      `[verified: live HTML from uat1, 2026-10-19 — _reference/html/eauto/bo-einvoice-consolidated-listing-search-results.html]`
    - Both links sit on the BO home menu of the "eAuto Account" (HubAdmin) login
      `[_reference/html/eauto/bo-home-hub-admin-eauto-account-2026-10-19.html]`.
    - **Payment Breakdown Report** and **Download Payment Document** are **UCD
      portal** pages: top bar REPORTS (`/view/ucd/report/view.do`) → buttons
      "PAYMENT BREAKDOWN REPORT" (`/view/ucd/report/e-statement`, "Payment
      breakdown details in PDF") and "DOWNLOAD PAYMENT DOCUMENT"
      (`/view/ucd/report/download-payment-document`, "Download Payment zip file
      here"). Payment Breakdown: form `#summary-form`, readonly `#startDate` /
      `#endDate`, select `#transactionType` (JomCheck = `JCK`), buttons
      `#download` (PDF) and `#to-export` (Excel). Download Payment Document: form
      `#search-form`, `transactionType` checkboxes in groups `.grp-a` / `.grp-b`.
      `[verified: live uat1 UCD menu and page DOM read in Chrome, 2026-10-19]`
      Menu and Download Payment Document now captured:
      `_reference/html/eauto/ucd-reports-menu.html`,
      `_reference/html/eauto/ucd-download-payment-document.html` (before / after
      Generate), `_reference/html/eauto/ucd-payment-breakdown-report.html`
      (blank state: Payment Date From/To empty, no default). Only the opened
      calendar widget is still uncaptured (the automation handles both shapes).
    - **Download Payment Document flow:** Payment Month `#month` + Year, open
      `#txn-dropdown-trigger`, tick JomCheck (value `JCK`, eAuto Plus group —
      ticking it disables eAuto Core and Service Hub), **Generate**
      (`#to-generate`). One row per week of the month: Period, Total
      Transaction, Action. Only **ended** weeks have a Download link (on 19 Oct
      the 18-24 Oct row had none). The zip
      `payment_documents_<companyId>_<start>_to_<end>.zip` holds
      `<companyId>/<Document Code>_JomCheck_Invoice.pdf` and `..._e-Invoice.pdf`
      (e-Invoice only where one exists: sample 1-3 Oct = 61 Invoice + 60
      e-Invoice). `[verified: live HTML + sample zip, 2026-10-19]`
    - **Payment Breakdown Report PDF** ("E-PAYMENT RUMUSAN NOTIS MAKLUMAT
      PEMBAYARAN MELALUI ELECTRONIC FUND TRANSFER (EFT)"): one row per
      transaction — dates, payment ref, transaction no., document code,
      vehicle, "JomCheck", "RHB Direct Debit", JPJ "-", FIS "-", eAuto 20.00,
      Service Tax 1.60; footer "Jumlah". There is no per-row 21.60. pdf-parse
      can split a row's text out of order (row 142 of the sample), so match a
      row by its transaction no. (`J6########`), not by the payment ref.
      `[verified: _reference/tickets/EAINT-12412/paymentbreakdownreport_example.pdf]`
    - Automated 2026-10-19 as 12412_TS06 / TS10 / TS11 (not yet run live).
14. **Insurance has no e-Invoice (2026-10-19).** System chatbot, asked by
    Faizuddin: an insurance purchase gives one document, "Print Invoice"
    (older payments; "Invoice" for Lonpac) or "Receipt" (newer payments, an
    Official Receipt fetched from the insurance service). It shows only when
    the insurance status is SUCCESS and a cover note number exists, and a
    pre-check runs before download. There is no e-Invoice button and no LHDN
    submission for an insurance purchase. Only **Insurance Cancellation** (the
    cancellation service fee) has an e-Invoice. So 12412_TS12 checks Insurance
    on its Invoice/Receipt only. `[from system chatbot, 2026-10-19]`
    - eSTM baseline for TS12: `_reference/tickets/EAINT-12412/ESTM_Invoice (3).pdf`
      and `ESTM_e-Invoice.pdf` (28 Sep 2026, before the push), one line each:
      'eSerahan Tukar Milik ("eSTM") service charge' 35.00 + 2.80 = 37.80, and
      'e-Lesen Kenderaan Motor ("eLKM") service charge' 2.75 + 0.22 = 2.97;
      e-Invoice classification 022. `[verified: sample PDFs]`

## 10. Code map and reference data — `scripts/eauto-jomcheck` (gap-fill 2026-10-16)

Distilled from a full read of the suite, its routes and dashboards on
2026-10-16. Every line `[verified: <file:line>]` as cited. TS numbers are the
current ones (§7s). The suite is edited often; re-grep a line number before
relying on it.

### 10a. EAINT-12339 SRD requirement map (v1.0 = v0.3 content)

`[verified: SRD extract of SRD_EAINT-12339_v0.3, §2.0-2.2.8 and the REQ traceability table]`

| REQ | Requirement (SRD wording) | Surface |
|---|---|---|
| REQ-001 | Odometer Reading sourced from MileageRange | BO Report Listing |
| REQ-002 | Type of Claim sourced from ClaimsType | BO Report Listing |
| REQ-003 | Total No. of Parts Approved for Change sourced from TotalPartsChanged | BO Report Listing |
| REQ-004 | New column Possible Total Loss | BO only |
| REQ-005 | New column Possible BER | BO only |
| REQ-006 | Incidents Severity Scale band definitions | BO |
| REQ-007 | Export file content | BO export (§2.2.6) |
| REQ-008 | Service Portal Count(s) of Incidents Severity Scale expanded to 6 counters | Service Portal |
| REQ-009 | Possible Total Loss and Possible BER not displayed on Service Portal | Service Portal |
| REQ-010 | Service Portal export | Service Portal |
| REQ-011 | UCD JomCheck report button | UCD Transaction Details (§2.2.8) |

SRD section map: §2.1.1 Assumptions, §2.1.2 Out-of-Scope, §2.2.1 Background,
§2.2.2 Existing Issue & Expected Behaviour, §2.2.3 Affected Pages, §2.2.4 BO
JomCheck Report Listing, §2.2.5 Claim Type Code List, §2.2.6 BO Export, §2.2.7
Service Portal listing ("has no Type of Claim, Odometer Reading or Total No. of
Parts Approved for Change column, so EAINT-12339-REQ-001 to EAINT-12339-REQ-003
do not apply to this portal"), §2.2.8 UCD Transaction Details.

SRD §2.1.1 assumptions, verbatim:
1. "Field definitions, value formats and the claim type code list follow ezAuto Technical Spec 2.0."
2. "Deprecated fields ClaimType, ApprovedParts and Mileage remain present in the response and always return "N/A", or null for Mileage."
3. "ezAuto staging environment remains available on v2.0 using the existing credentials throughout development and testing."
4. "JomCheck Report Listing filters, validation and restricted user access remain as defined in EAINT-8638."
5. "No change is required to JomCheck pricing, purchase flow or e-Invoice submission."

### 10b. Configuration knobs (`data/config.ts`, `data/users.ts`, `playwright.config.ts`)

| Knob | Env var | Default | Line |
|---|---|---|---|
| Base URL | `EAUTO_BASE_URL` | `https://staging.eauto.my/uat1` | config.ts:5 |
| Service Portal base | `EAUTO_SP_BASE_URL` | same as base | :9 |
| UCD/BO login page | — | `<base>/public/login` | :13 |
| Logout | — | `<base>/user/logout.do` loaded directly (skips the native "Sure to logout?" `confirm()`); used to switch UCD→BO in ONE page so one video covers both | :17; `pages/LoginPage.ts:69-75` |
| UCD paths (documentation only — reached by clicks) | — | home `/view/ucd/home.do`, menu `/view/ucd/jomcheck/view.do`, purchase `/view/ucd/jomcheck/transaction/`, listing `/view/ucd/jomcheck/enquiry/` | :23-26 |
| BO paths | — | home `/home/`, enquiry `/view/jomcheck/enquiry`, report listing `/view/jomcheck/report-listing/index.do` | :33-35 |
| Service Portal | — | login `<spBase>/bank/login/`, home `/credit/home/`, listing `/credit/home/jomcheck-report-listing/main.do` | :40-43 |
| Timeouts | — | navigation 60 s, after-load 2 s, after-search 1.5 s, poll 500 ms, general wait 20 s | :50-54 |
| Real payment wait | — | `paymentProcessingTimeout` 5 min | :61 |
| e-Invoice wait | `JOMCHECK_EINVOICE_TIMEOUT_MIN` | 10 min, reload every 15 s | :68-69 |
| Invoice download | — | 60 s | :72 |
| Resubmit wait | — | 5 min | :75 |
| Share company | `JOMCHECK_SHARE_COMPANY` | `X STAR TECHNOLOGY MALAYSIA SDN BHD` | :83 |
| UCD company | `EAUTO_UCD_COMPANY` | `FAIZUDDIN AUTO TEST` | :91 |
| Worker pages | `JOMCHECK_CONCURRENCY` | 4 | :95 |
| Finder tabs | `JOMCHECK_FIND_CONCURRENCY` | 20 | :101 |
| eSim login | `ESIM_USER` / `ESIM_PASS` | blank → `admin`/`admin` | :105-106 |
| BO user | `EAUTO_USERNAME` / `EAUTO_PASSWORD` | `faizuddinBO1` (lacks the Report Listing menu — §7j) | users.ts:15-19 |
| UCD user | `EAUTO_UCD_USERNAME` / `EAUTO_UCD_PASSWORD` | `faizuddin` | users.ts:22-26 |
| Service Portal user | `EAUTO_SP_USERNAME` / `EAUTO_SP_PASSWORD` | `jasons` (superadmin, display name "Jason Seah") | users.ts:30-34 |
| Demo / video / headed | `PW_DETAILED`, `PW_DETAILED_DELAY` (1400 ms), `PW_VIDEO`, `PW_HEADED` | set by the dashboard | playwright.config.ts:6-8; `pages/BasePage.ts:31-53` |
| Reports / evidence | `PW_JSON_REPORT`, `PW_STEP_REPORT`, `PW_EVIDENCE_DIR`, `PW_OUTPUT_DIR` | set by the route | playwright.config.ts:32-39 |

Playwright: test timeout 480 s detailed / 420 s otherwise, `workers: 1`,
`retries: 0`, viewport 1920×1080 forced AFTER the `devices['Desktop Chrome']`
spread, `ignoreHTTPSErrors: true` (eSim), `trace: 'retain-on-failure'`,
video object form with `size` 1920×1080, reporters `list` + `json` +
`./reporters/step-reporter.ts`. `[verified: playwright.config.ts:20-71]`

Per-TS vehicle env vars (dashboard → route `vehicleEnvVars`):
`JOMCHECK_TS01/02/04/06…/26/31/32/33/36/37/38/39/43/44_VEHICLE_NO`,
`JOMCHECK_TS03_CHASSIS_NO`, `JOMCHECK_FRESH_VEHICLE_NO`,
`JOMCHECK_MULTI_CLAIM_VEHICLE_NO` (default `HXJ0001`), 12412:
`JOMCHECK_12412_TS01/03/06/07_VEHICLE_NO`,
`JOMCHECK_12412_SETUP_APPROVED_VEHICLE_NO`, `JOMCHECK_12412_SETUP_FAILED_VEHICLE_NO`.
`[verified: grep of process.env in tests/, 2026-10-16]`

### 10c. Page-object handles

| Page object | Handle | Selector | Source |
|---|---|---|---|
| `LoginPage` (UCD/BO) | username / password / submit | `input[name="username"], input[placeholder="Username"]` / `input[name="password"], input[placeholder="Password"]` / `button:has-text("Login"), input[type="submit"], button[type="submit"]`; retries once if still on `/login` | `pages/LoginPage.ts:8-10,35-56` |
| `UcdJomCheckPurchasePage` | home tile | `#jomcheck` (`button.dashboard-menu-item-btn`) | `:22` |
| | menu → purchase | `#create-tx` "PURCHASE JOMCHECK REPORT" | `:25` |
| | radios / inputs / submit | `#vehicleNoRadio`, `#chassisNoRadio`, `#vehicleRegNo`, `#vehicleChassisNo`, `#to-check-vehicle` | `:27-31` |
| | pay / after pay | `#to-pay`, `#to-view-report` (completion signal), `#to-search-new-vehicle` | `:32-34` |
| | result text | `#result`; full prompt = parent `<p>` of `#result` (+ `#desc`) | `:35,211-215` |
| | share checkbox by company | `div:has(> .share-cc-pay):has-text("<company>") .share-cc-pay` | `:108-109` |
| | transaction UUID | `input[name="transactionId"]` | `:220-222` |
| | failure after Pay Now | `#custom-dialog:visible #custom-field, .ui-dialog:visible .ui-dialog-content`, or `#result` matching `/fail|unable|error|not generated/i`; throws if `#to-view-report` appears | `:163-189` |
| `UcdJomCheckTransactionListingPage` | menu button | role button `JOMCHECK TRANSACTION LISTING`; breadcrumb `.breadcrumb a:has-text("JomCheck Report")` | `:32,36` |
| | filters | `#vehicleNo`, `#chassisNo`, `#refNo`, `#to-search` | `:39-42` |
| | rows | `table tbody tr.odd, table tbody tr.even`; columns # / Vehicle / Chassis No / Transaction No / Created At / Payment / Tx Status / e-Invoice Status / Remarks / Action | `:5-7,43` |
| | no-match row | text "No record found. Try again." (skipped by `readRows()`) | `:143-145` |
| | Transaction No. for a UUID | `table tbody a[href*="id=<uuid>"]` → row `td:nth(3)` | `:117-124` |
| `UcdJomCheckTransactionDetailsPage` | status / buttons | `.trx-details-status`, `#to-print-invoice`, `#to-print-e-invoice`, `#to-print-report` | `:17-20` |
| | LHDN status | `h6:has-text("LHDN Response Status")` → `following-sibling::h6[1]` | `:141-146` |
| `BoJomCheckReportListingPage` | menu link | role link `JomCheck Report Listing` — guarded on **visibility**, not `count()` (link is in the DOM but hidden when arriving from Transaction Details) | `:59,83` |
| | filters | `#vehicleNo`, `#chassisNo`, `#to-search`, `#to-export`, `#to-reset`, `#result-summary` | `:61-64,134-135` |
| | headers / rows | `table thead tr.header th, table tr.header th` / `table tbody tr.odd, table tbody tr.even` | `:65-66` |
| | no-match | exact text "No records found. Please ensure there are existing JomCheck report purchase records." | `:198` |
| | filter typing | `pressSequentially(value, { delay: 40 })` so the greying script fires | `:139-145` |
| `BoJomCheckTransactionEnquiryPage` | link | role link `Jomcheck Transaction` | `:35` |
| | filters | `#vehicleNo`, `#chassisNo`, `#refNo`, `#to-search`, `#fromDate`, `#toDate` (readonly datepickers, empty = all time), `select#to-filter` (New / Pending / Approved / Failed), `#ui-datepicker-div` with `select.ui-datepicker-year` / `select.ui-datepicker-month` (0-11) | `:37-41,123-126` |
| | rows | cells: 1 Company Name, 3 Vehicle, 5 Transaction No., 6 Created At, 8 Payment, 9 Tx Status, 10 LHDN, 11 Remarks; `canResubmit` = `a.to-resubmit` present | `:170-185` |
| | resubmit | `a.to-resubmit` in the row; native dialogs accepted; jQuery UI `.confirm-dialog-btn` or OK/Close clicked; messages returned | `:194,204-238` |
| | View | reads `href` and `goto()`s it in the same tab (real link is `target="_blank"`) | `:274-285` |
| `BoJomCheckTransactionDetailsPage` | buttons | `#to-print-invoice`, `#to-print-e-invoice`, `#to-print-report` | `:20-22` |
| | status word | `td.title1` → `following-sibling::td[1]` (e.g. `<span class="approved">Approved</span>`) | `:92-97` |
| | LHDN | `td:has-text("LHDN Response Status")` → next `td` | `:129-134` |
| `ServicePortalLoginPage` | fields | `input[name="name"]`, `input[name="pass"]`, `input.to-login, input[type="submit"]`; throws when no form and no home, or when the form survives submit | `pages/ServicePortalLoginPage.ts:16-18,42-63` |
| `ServicePortalJomCheckListingPage` | filters | `#vehicleNo`, `#chassisNo`, `#sharedDateFrom`, `#sharedDateTo`, `#to-search`, `#to-export`, `#jc-bulk-dl` | `:26-32` |
| | per-row download box | `.jc-dl` | `:198` |
| | severity counters | row `td:nth(15)` ("Count(s) of Incidents Severity Scale"), lines `"<Band> - <n>"`, `"-"` → none | `:189-219` |
| `EsimJomCheckPage` | see knowledge/esim.md § JomCheck automation in the test page | | |

Shared `BasePage` helpers (`pages/BasePage.ts`): `fastDiscovery` static
switch (`:29`), `suppressDemo()` (`:41-48`), `demoHighlight()` colours amber
`#f59e0b` / green `#22c55e` / red `#ef4444` (`:68-103`), `waitForDialog()` =
`.ui-dialog` visible 5 s, `acceptConfirmDialog()` = `.confirm-dialog-btn`,
`dismissConfirmDialog()` = `.cancel-dialog-btn` (`:147-158`),
`dismissBanners(8)` (`:166-240`), `captureEvidence()`,
`saveDownloadAsEvidence()`, `captureHighlightedPdfEvidence()` (`:263-361`).

### 10d. BackOffice JomCheck Report Listing — the 29 columns, in order

`[verified: pages/BoJomCheckReportListingPage.ts:19-49]`

1 `#` · 2 `Date & Time` · 3 `Vehicle Number` · 4 `Chassis Number` ·
5 `Transaction Number` · 6 `Total Loss History (Actual)` · 7 `Possible Total
Loss` · 8 `Total Loss History (BER)` · 9 `Possible BER` · 10 `Make / Brand` ·
11 `Model` · 12 `Year Make` · 13 `Variant` · 14 `Engine CC` · 15
`Transmission` · 16 `Avg. Market Value / Avg. Retail Price` · 17 `Approx. New
Car Price / Recommended Trade Price` · 18 `Flood History` · 19 `Windscreen
Claim` · 20 `Multiple Registration of Car Plate / Chassis No.` · 21 `Last
Mileage Recorded` · 22 `Accident Record` · 23 `Date of Loss` · 24 `Date of
Authorized` · 25 `Odometer Reading` · 26 `Type of Claim` · 27 `Total No. of
Parts Approved for Change` · 28 `State in Malaysia` · 29 `Incidents Severity Scale`.

TS17 asserts this exact order; TS13/TS14/TS22-TS24 assert Possible Total
Loss sits between columns 6 and 8 and Possible BER between 8 and 10
(`tests/esim-claim-boundaries.spec.ts:15-34`). BO Transaction Enquiry
columns: # · Company Name · Company ROC · Vehicle · Chassis No ·
Transaction No. · Created At · Method · Payment · Tx Status · LHDN Response
Status · Remarks · Special Remarks · Action.

### 10e. Claim Type (ICAP) → displayed text (SRD §2.2.5)

`[verified: data/icapCodes.ts:4-26]` 1 Own Damage (OD) · 2 Own Damage - KFK
(OD-KFK) · 3 Own Damage - Theft from Vehicle (OD-TFV) · 4 Own Damage - Theft
Recovered (OD-TFR) · 5 Third Party - KFK (TP-KFK) · 6 ODKFK/Third Party -
Uninsured Losses (TP-UL) · 7 Third Party - Vehicle Damage (TP-VD) · 8 Third
Party Property Damage (TP-PD) · 9 Third Party Bodily Injury (TP-BI) · 10
Third Party - Subrogation (TP-SB) · 11 Windscreen (WS) · 12 Extended Warranty
(EXW) · 13 Lost-of-Use (LOU) · 14 Theft of Vehicle (TOV) · 15 Own Damage -
Constructive Total Loss (OD-CTL) · 16 Own Damage - Actual Total Loss (OD-ATL)
· 17 Own Damage - Contract Repairs (OD-CR) · 18 Own Damage - Marine Transit
(OD-MNT) · 19 Own Damage - Garage (OD-GRG) · 30 and 31 Unspecified (Possible
3rd Party Claim). No codes 20-29. Null/blank → "-" (OQ-04 for mixed lists).

### 10f. Fixed reference data

- `PRE_PUSH` = vehicle `HXJ0001`, transaction `J690008380`, captured
  `30-09-2026 14:20`, claims Odometer `0`/`226825`, Type `Own Damage (OD)` ×2,
  Parts `3`/`8` (`data/prePushTransaction.ts:10-19`); `PRE_PUSH_REPORTS.HXJ0001`
  → the saved pre-CR PDF (`:27-32`). Pre-push status is inferred, not proven
  (audit 2026-10-01: the capture already shows the 29-column layout; OQ-03).
- Pre-push finder: windows end before `PRE_PUSH_SEARCH_BEFORE` = 1 Sep 2026,
  12 months back max, one calendar month per search
  (`utils/prePushFinder.ts:29-43`); TS27 hit = Possible Total Loss `N/A`, no
  `1.` numbering, Odometer not `-`.
- Running counters: vehicle `HXA####A` (localStorage `eauto_jomcheck_vn_counter`,
  shared with the 12412 page), chassis `HXA##J##C##K##MTA`
  (`eauto_jomcheck_cn_counter`). Other keys: `eauto_jomcheck_ui_state_v2`,
  `eauto_jomcheck_creds`, `eauto_jomcheck_queue_state`, 12412
  `eauto_12412_test_data_pool`. `[verified: app/eauto/jomcheck/page.tsx:788,865,883,907,919; app/eauto/12412/page.tsx:104]`
- Band strings the eSim TS type (verbatim): see knowledge/esim.md § JomCheck
  Report — full form.

### 10g. Shared utilities — exact behaviour

- `utils/transactionLookup.ts` `lookUpTransactionNo()`: reads the purchase
  form's `transactionId`, opens the UCD Transaction Listing, searches by
  vehicle or chassis, returns `td:nth(3)` of the row linking to that UUID,
  asserts `/^J\d+$/`, prints `DETAIL` "Transaction No.".
- `utils/pdfCrosscheck.ts` (TS02, TS25, TS36): asserts the PDF contains the
  vehicle no.; if every claim cell is `-`, asserts the PDF contains
  `THERE ARE NO PREVIOUSLY APPROVED HISTORY RECORDED`; else each meaningful
  listing value (not blank/`N/A`/`NULL`) must appear in the PDF text; Total Loss
  History is matched against the labelled line with the regex
  `(?<![A-Z])ACTUAL:\s*<v>(?![A-Z0-9])` / `BER:` — both-side guards added after
  `BER: NO` matched "CHASSIS NUMBER: NOT AVAILABLE" and `ACTUAL: NO` matched "NO
  RECORD FOUND"; Possible Total Loss/BER only logged. `[verified: pdfCrosscheck.ts:21-80]`
- `utils/exportReader.ts`: refuses a non-`.xlsx` file (first bytes ≠ `PK`) and
  prints the first 16 bytes; header row = first of rows 1-10 containing the
  marker (`Transaction Number` for BO, `Count(s) of Incidents Severity Scale`
  for Service Portal); `baseHeader()` strips `(UPDATED)`/`(NEW)` (OQ-09);
  `claimLines()` splits `1. …` numbering; cell type kept so TS33 can prove band
  text was not auto-converted to a number.
- `utils/invoicePdf.ts` (EAINT-12412): `TWO_LINE_AMOUNTS` 18.00 1.44 19.44 2.00
  0.16 2.16 20.00 1.60 21.60; `ONE_LINE_AMOUNTS` 20.00 1.60 21.60;
  `SPLIT_ONLY_AMOUNTS` 18.00 1.44 19.44 0.16 2.16; `LINE_1` `JOMCHECK REPORT`,
  `LINE_2` `JOMCHECK SERVICE CHARGE`, code `022`; a download that is not
  `%PDF` throws; `extractInvoiceFacts()` regexes `DOCUMENT CODE`, `PAYMENT
  REFERENCE NO.`; `logEInvoiceHeader()` prints `UNIQUE IDENTIFIER NO.`,
  `SUBMISSION DATE`, `DOCUMENT CODE`. `[verified: invoicePdf.ts:20-185]`
- `utils/pdfHighlight.ts`: the highlighted `<label>-checked.png` evidence (§9f item 9).

### 10h. Spec file → TS map (current numbering)

| Spec | Tests (title prefix, line) |
|---|---|
| `tests/ucd-purchase-flow-checks.spec.ts` | 12339_TS01 (:32), TS02 (:131), TS03 (:210), TS04 (:295) |
| `tests/pre-push-user-vehicle.spec.ts` | TS05 (:56), TS27 (:149), TS31 eSim (:222), "TS31 (existing failed transaction)" (:326) |
| `tests/esim-claim-boundaries.spec.ts` | TS06 (:98), TS07 (:126), TS08 (:161), TS09 (:183), TS10 (:200), TS11 (:218), TS12 (:245), TS13 (:266), TS14 (:278), TS15 (:289), TS16 (:320), TS19 (:342), TS20 (:394), TS21 (:428), TS22 (:448), TS23 (:459), TS24 (:473), TS26 (:485) |
| `tests/ucd-purchase-to-bo-listing.spec.ts` | TS18 (:109), TS43 (:179), TS25 (:220) |
| `tests/bo-report-listing.spec.ts` | TS17 (:27), TS45 (:64) |
| `tests/bo-pre-push-listing.spec.ts` | TS28 (:46), TS29 (:60), TS35 (:92) |
| `tests/esim-listing-export.spec.ts` | TS30 (:71), TS32 (:141), TS33 (:189) |
| `tests/bo-transaction-details.spec.ts` | TS36 (:27) |
| `tests/service-portal-listing.spec.ts` | TS37 (:85), TS38 (:141), TS39 (:155) |
| `tests/esim-latest-report.spec.ts` | TS44 (:52) |
| `tests/find-pre-push-data.spec.ts` | 12339_FIND_TS27 (:22), 12339_FIND_TS31 (:28) — finders, never in the checklist |
| `tests/ucd-create-purchase.spec.ts` | 12339_PURCHASE (:19) — plain purchase utility |
| `tests/invoice-split-12412.spec.ts` | 12412_TS01 (:90), TS03 (:140), TS06 (:174), TS07 (:214) |
| `tests/invoice-split-12412-setup.spec.ts` | 12412_SETUP_APPROVED (:31), 12412_SETUP_FAILED (:90) |

The dashboard greps by exact test title, so a title edit in a spec must be
mirrored in `app/eauto/jomcheck/page.tsx` / `app/eauto/12412/page.tsx`.

### 10i. Run routes

- `POST /api/eauto-jomcheck/run`: 10-minute kill per call (`TIMEOUT_MS`,
  route:17) — hence the per-TS queue (§7n); refuses without
  `scripts/eauto-jomcheck/node_modules`; resets `test-results/_run/{report.json,steps.json,evidence}`
  each call; `runId = Date.now()`; maps body → env `EAUTO_BASE_URL`,
  `EAUTO_USERNAME/PASSWORD`, `EAUTO_UCD_USERNAME/PASSWORD`,
  `EAUTO_SP_USERNAME/PASSWORD`, `JOMCHECK_MULTI_CLAIM_VEHICLE_NO`,
  `JOMCHECK_FRESH_VEHICLE_NO` plus `vehicleEnvVars`; `PW_HEADED` = not headless
  (headless default true), `PW_VIDEO`, `PW_DETAILED`. **Windows grep trap:** the
  `--grep` pattern is wrapped in double quotes on win32 and every `"` in a title
  becomes `.` — without the quoting, 2+ selected scenarios died in cmd.exe on
  the unquoted `|` ("load for a bit, and then nothing happens", 2026-10-01).
  `[verified: app/api/eauto-jomcheck/run/route.ts:436-526]`
- `POST /api/eauto-jomcheck/find-data`: 20-minute kill, always headless, no
  video, no demo; own `PW_OUTPUT_DIR`; passes `EAUTO_UCD_COMPANY`.
  `[verified: find-data/route.ts:17-64]`
- `app/api/eauto-12412/run`: 35-minute kill (5 min payment + 10 min LHDN wait
  per TS), evidence `public/qa-artifacts/eauto-12412`, history limit
  `EAUTO_12412_HISTORY_LIMIT`; same script dir env `EAUTO_JOMCHECK_SCRIPT_DIR`.
  `[verified: app/api/eauto-12412/run/route.ts:9-21,291]`

### 10j. EAINT-12412 TS workbook (on disk)

`_reference/tickets/EAINT-12412/EAINT-12412 - [eAuto-UCD & BackOffice] JomCheck - Split Invoice & e-Invoice Charge into JomCheck Service Charge and eAuto Service Charge.xlsx`,
one sheet "Test Scenarios", columns TS No. / Test Objective / Test Steps /
Expected Result / QA / Test Result / Remarks, 7 TS in 4 sections:
A UCD — JomCheck Invoice & e-Invoice (12412_TS01 UCD new transaction, TS02
Wholesale chatbot); B BackOffice — Invoice, e-Invoice & SST Report (TS03
BO = UCD copies, TS04 SST Payment Report eAuto RM6.00 / ezAUTO Asia RM14.00);
C LHDN — MyInvois (TS05: 2 lines, RM21.60, code 022); D Existing transactions
— approval date cut-off (TS06 approved before push keeps 1 line, TS07 failed
before push, Resubmit from BO, gets 2 lines). TS01 expected result 1:
"JomCheck Details page -> Price still shows "RM20.00 + 8% Service Tax"".
The dashboard mirrors these section letters and titles
(`app/eauto/12412/page.tsx` `TS_SECTIONS`). `[verified: xlsx read with xlsx, 2026-10-16]`

### 10k. Automation-vs-TS audit, 2026-10-01 (summary)

Source: `_reference/tickets/EAINT-12339/EAINT-12339-automation-audit-2026-10-01.md`
(read-only audit against the 49-row renumbering; numbers below are that
file's, i.e. pre-§7s). Verdicts then: 8 satisfies, 19 partial, 6 do not
satisfy (TS08-TS11, TS16, TS46), 16 not built. Findings that still describe
how to read a green run:

1. Band TS (now TS08-TS11) type the band text into eSim and assert it back —
   pass-through checks by design after OQ-01 (§7i), not banding tests.
2. TS01/TS03 log the 5 re-sourced fields as DETAIL lines; they do not assert
   them non-blank (that is TS18/TS17's job).
3. Severity comparisons in TS19/TS26 were case-insensitive in the audited code.
4. Weak spots fixed since: `pdfCrosscheck.ts` word-boundary guards (§10g),
   evidence file-name regex (now `/[^\w.-]+/g`), rows pinned by Transaction No.
   instead of row 0 (§7l-i rules), `useDbReport` now set on every eSim run.
5. Still open from the audit: TS24 covers only the Total Loss direction; TS30
   Type of Claim uses `toContain('Own Damage')`; TS36 spends one of the 20
   daily API reports on an extra purchase.

### 10l. Traps added by this pass

1. **`faizuddinBO1` cannot reach the Report Listing** (permission-gated menu);
   the page object throws a named error instead of timing out
   (`BoJomCheckReportListingPage.ts:99-106`). Supply a permitted BO login.
2. **BO Report Listing menu link is in the DOM but hidden** after visiting
   Transaction Details — guard on `isVisible()`, not `count()`
   (`BoJomCheckReportListingPage.ts:78-90`).
3. **Every UCD/BO "View" opened in a new tab splits the video**; the suite
   reads `href` and navigates in place. Playwright still records one video per
   tab when a test opens a PDF tab (§7x).
4. **The Resubmit capture uses context path `/eauto`** while every other
   capture uses `/uat1`; never hardcode the env segment into a selector or
   href match.
5. **12412 and 12339 share the vehicle counter** — running both dashboards on
   one environment is collision-free only because of that.

### 10m. Not covered by this code map

UCD purchase by chassis "Chassis number found." state (still uncaptured);
Service Portal export file (format unconfirmed); BO SST Payment Report page;
Wholesale chatbot; MyInvois; what follows a BackOffice Resubmit click; the
Enquiry pager markup.


## Additions from the 2026-10-23 flows study

Source: lib/eautoFlows/modules/*.ts (data mirror for /eauto/flows). Only facts not already in this file.

- Monthly consolidated e-Invoice job (EAINT-9845) resubmits LHDN-failed e-Invoices as a consolidated e-Invoice; testing needs a Dev trigger or month-end wait. JomCheck-specific cronjob unknown. [azfar: cr/EAINT-12022/01-research/study.md]
- Credit-company partners are provisioned by an admin console user. [ts: EAINT-11757 TC-00f] [azfar: cr/EAINT-11757/LEDGER.md]
- The API is not changed by EAINT-12339. [azfar: knowledge/_core/jomcheck.md]

## Update 2026-10-27 from Charmain repo

Source: read-only clone `_reference/codebases/eauto-qa-charmain/`, folder
`intake/` (commit `0ab45d1`). Inventory: `script-inventory-team.md`.

1. **No colleague has JomCheck CR automation** in the inventoried sources
   (Charmain, Azfar). Ours (`scripts/eauto-jomcheck`) is the only one.
2. **Legacy shared repo covers the JomCheck listings** (P1 search-and-filter):
   a. "BO JomCheck Transaction" — `JOMBOSF_TS1-13`: Company Name, Vehicle No.,
      Transaction No., Created Date, Filter by, Company ROC, Payment Method, "LHDN
      Response Status", Payment Date, multi-filter with Export, View Transaction
      Details Page. `[charmain-repo: intake/reports/legacy-shared.json:5273-5287]`
      `[charmain-repo: intake/reports/legacy-shared.md:105]`
   b. UCD "UCD_JomCheck-TransactionListing" (8 tests). `[charmain-repo: intake/reports/legacy-shared.md:120]`
   c. Staging "SstPaymentReportJomCheck" (14 tests) under `boFinanceLogin()` —
      `SPRBOSF_TS1-14`: Created Date, ROC No, Transaction No, UCD GST No, Vehicle No.,
      Payment Mode, Vehicle Type, Payment To, Association, State, Transaction Type, "Hide Cancel Transaction", multi-filter with Export.
      `[charmain-repo: intake/reports/legacy-shared.json:6865-6883]` `[charmain-repo: intake/reports/legacy-shared.md:129]`
   These are the regression list for any JomCheck invoice / SST change (e.g.
   EAINT-12412 split lines must still filter and export here).
3. **LHDN side:** Charmain's EAINT-12126 scripts reach LHDN preprod MyInvois; see
   `flow-payments-fees.md` § "Update 2026-10-27 from Charmain repo" item 2.

## 11. EAINT-12386 — chassis special characters + cron resubmit on empty report (SRD v0.4 draft, studied 2026-10-27)

Source: `_reference/tickets/Studying/EAINT-12386/` (Jira capture 2026-10-27,
SRD v0.4 text copy dated "26.10.2026 (Monday)"). `[source: pipeline EAINT-12386, Scout study, 2026-10-27]`
**SRD is still a draft** (§1.3: "until it reaches Version 1.0, at which point it is
finalized"). Sections 11b–11c are **planned** behaviour, not live. §5a item 1.2 and
status rule item 12 above stay the current behaviour until it deploys.

### 11a. Current behaviour learned from this ticket (live today)

1. **Two JomCheck API calls, two names.** `[from ticket EAINT-12386, SRD v0.4 §1.4]`
   1. "JomCheck Precheck API" = "JomCheck API called before payment to check the Chassis No or Vehicle No. Also referred to as enquiry API."
   2. "JomCheck Submission API" = "JomCheck API called to request the report after payment is made."
2. **Precheck by chassis gives no availability, only invalid.** `[from ticket EAINT-12386, SRD v0.4 §2.2.2 row 1 items 7–8]`
   "JomCheck precheck API returns whether a report is available only when the enquiry is made with Vehicle No. Report availability is not returned when the enquiry is made with Chassis No." and "When precheck is done with Chassis No, JomCheck precheck API is still able to return whether the Chassis No is invalid."
3. **Invalid chassis is blocked before payment** (the EAINT-12339 hotfix, see §4 row EAINT-12339). `[from ticket EAINT-12386, SRD v0.4 §2.2.2 row 1 item 6]` "System detects the "Invalid Chassis No." response from JomCheck precheck API and blocks UCD directly from proceeding to payment."
   Before the hotfix UCD could pay and the get-report API then also returned Invalid Chassis No. Teams quotes: `teams-decisions-by-ticket.md` § "EAINT-12386, EAINT-12406, EAINT-12424" items 4–5.
4. **ezAuto rule:** `[from ticket EAINT-12386, SRD v0.4 §2.1.1 Assumption 1]` "JomCheck precheck API accepts alphanumeric only, with a maximum of 17 characters, as advised by ezAuto." Matches §7o "Input limits (p.8)".
5. **Why reports come back empty:** `[from ticket EAINT-12386, Jira description row 4]` "User keys in 21 characters including "-". System responds with empty report."

### 11b. Planned — chassis input and backend trim (REQ-001 to REQ-004)

1. **REQ-001 — Chassis No field: screen unchanged.** `[from ticket EAINT-12386, SRD v0.4 REQ-001]` "Field accepts alphanumeric and special characters, with a maximum of 30 characters." "No trimming is done at frontend."
2. **REQ-002 — backend strips every special character** before **both** APIs. "Backend removes all special characters from the Chassis No before submitting the request to JomCheck." "Trimming applies to both the JomCheck precheck API call and the submission API call." Screen keeps the typed value: "Value displayed on the UCD screen remains as keyed in, including the special characters. Trimming is not visible to UCD." `[from ticket EAINT-12386, SRD v0.4 REQ-002]`
3. **REQ-003 — 17-character check after trim, before payment.** "More than 17 characters: backend does not submit to JomCheck precheck API, displays the message below, and UCD is unable to proceed to payment." Message: "Invalid Chassis Number." Example: "JTD-123456-7890123456 becomes JTD1234567890123456 (19 characters)". `[from ticket EAINT-12386, SRD v0.4 REQ-003]`
4. **REQ-004 — JomCheck "Invalid Chassis No." still blocks**; screen message "Invalid Chassis Number." `[from ticket EAINT-12386, SRD v0.4 REQ-004]`
5. **Old reports untouched:** "Report remains as purchased, with no resubmission and no change." `[from ticket EAINT-12386, SRD v0.4 REQ-002 Example 3]`

### 11c. Planned — cron resubmit and payment-done note (REQ-005, REQ-006)

1. **REQ-005 — cron resubmits empty reports**, except Invalid Chassis Number cases. "Cron job retries the request every 1 minute, up to a maximum of 5 attempts. Interval and number of attempts are pending confirmation with developer." After the last attempt: "system performs no further action. Refund is handled manually by Ops team." `[from ticket EAINT-12386, SRD v0.4 REQ-005]`
2. **REQ-006 — note on the JomCheck payment done page** when the report is empty: "Please try again to download report 10 mins later." Shown "together with the existing payment done content". `[from ticket EAINT-12386, SRD v0.4 REQ-006]`
3. **Not in the SRD** [unconfirmed]: the "empty report code" value; transaction status during and after retries; how this meets BO "Resubmit" (§9g); whether vehicle-number purchases are retried; which chassis value (typed or trimmed) is stored in listings and the PDF.
4. **eSim cannot make an empty report today** — JomCheck Report `Result` is only "Success" / "Failed". `[source: pipeline EAINT-12386, Scribe related history, 2026-10-27, from _reference/html/esim/jomcheck-report-edit-2026-10-05.html lines 96-99]`

### 11d. Lineage row (adds to §4)

| Ticket | Portal | What it delivered | Status |
|---|---|---|---|
| EAINT-12386 | UCD & Cron Job | Backend strip of all chassis special characters before precheck + submission APIs; 17-char check after trim ("Invalid Chassis Number."); cron resubmit on empty report; payment done note | SRD v0.4 draft 2026-10-26, no fix version `[from ticket EAINT-12386, Jira capture 2026-10-27]` |

Source tickets: "EAUTO-1067 — JOMCHECK ENHANCEMENT" and "CCB-987". `[from ticket EAINT-12386, SRD v0.4 §1.5]`

### 11e. Past QA-Issues on chassis handling (regression watch list)

Chassis handling has broken before. Titles copied verbatim from the Jira sub-task lists. `[source: pipeline EAINT-12386, Scribe related history, 2026-10-27, "## Past QA-Issues mentioned"]`

1. **EAINT-6475 — chassis search at purchase** `[EAINT-6475-jira.md, item 9]`:
   1. "EAINT-6992 [QA] Chinese chars is not automatically removed from Chassis Number field and can click [Submit], then retrieve with chinese chars".
   2. "EAINT-7006 [QA] Small letters, special chars and Chinese chars are not auto-capitalize/auto-trim/auto-remove when copy & paste and cut & paste using right-click mouse method".
   3. "EAINT-10110 [eAuto - JomCheck] Incorrect Chassis not found message".
   4. "EAINT-10123 [eAuto - JomCheck] Chassis No - Click 'Submit' second time when API down will clear & reset fields to default".
2. **EAINT-8638 — BO JomCheck Report Listing** `[EAINT-8638-jira.md, item 9]`: "EAINT-10505 [eAuto - BO] - JomCheck Report Listing - Unable to search for chassis numbers that contain special character".
3. **EAINT-10937 — Service Portal listing** `[EAINT-10937-jira.md, item 9]`: "EAINT-11753 [eAuto - Service Portal] Search & Filter - Incorrect validation for Chassis No. filter"; "EAINT-11766 [eAuto - Service Portal] View Hyperlink - Dummy Report is displayed for JomCheck Report purchased using Chassis Number"; "EAINT-11773 [eAuto - Service Portal] Download - Incorrect file naming for JomCheck Report purchased using Chassis No.".
4. **EAINT-12412 — invoice split** `[EAINT-12412-jira.md, item 9]`: "EAINT-12554 [eAuto - BO] JomCheck Invoice still shows 1 line after resubmitting an old failed transaction". Any resubmit path (BO Resubmit, a future cron) is worth checking for this [unconfirmed].

### 11f. The 30-character chassis stop was never tested

The EAINT-6475 sheet planned the check but did not run it: "To verify maximum character limit allowed in Chassis Number field" — Remark: "Deprioritised as no limit set for Chassis Number" `[from SharePoint TS #050 EAINT-6475, sheet Functional TS, R22]` `[source: pipeline EAINT-12386, Scribe related history, 2026-10-27]`. So the "blocks further input after 30 characters" rule in §5a item 1.2 is a planned expectation, not a seen result [unconfirmed whether the field stops at 30 today].

### 11g. Past TS that cover cron and resubmit (reuse for any JomCheck cron CR)

`[source: pipeline EAINT-12386, Scribe related history, 2026-10-27, "Reusable scenarios" + "Known traps"]`

1. **The only past JomCheck cronjob TS** is **Reset Payment Cronjob** in EAINT-10937 — Service Portal listing (E2E sheet, TS10–TS14, R31-R45). Each runs a before/after-deployment check per Tx state (Approved, Enquiry Failed, Pending, Failed).
2. **10937_E2E_TS14 — failed retrieve across deployment:** "Reset Payment Cronjob ⏎ BEFORE Deployment, Failed to Retrieve Report" (E2E, R43-R45): "Tx Status should remain as Failed, with payment history"; "Resubmit and do Payment > Proceed until Tx status = Approved". (⏎ = line break in the copy.)
3. **12412_TS09 — old Failed resubmitted from BO** (R15) was never run: "Not Started"; Remarks "Deprio - Ops wont resubmit". So documents after a resubmit (Invoice / e-Invoice) have no executed TS on record.
