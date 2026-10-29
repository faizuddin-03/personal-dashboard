# Flow: eAuto insurance enquiry, listing, report and dashboard — navigation

`[from a code-reading chatbot with access to eauto, prod, origin/prod/master, 2026-09-25 —
navigation only, not yet verified against a live UI. Treat as a lead, re-confirm with a live
capture before trusting a selector built off it.]` — **except** the two sections tagged
`[verified: …]` below (UCD Insurance Transaction Listing DOM, from a 2026-08-18 capture; the
BackOffice Insurance Quote Enquiry, from `scripts/eauto-insurance`), added 2026-10-15.

Written while scoping EAINT-12175 (Lonpac insurer name standardisation). Covers **how to reach**
the Insurance Company filter/result-table screens across BackOffice, UCD and the separate Insurance
Dashboard portal — the enquiry/listing/report surfaces, not the quotation→purchase flow (that's
[flow-insurance-purchase.md](flow-insurance-purchase.md)).

EAINT-12175 state as of 2026-09-25: fix version S34.X-20261002, assignee Shane, status In
Development; the Secarang half (REQ-001–005) has been live since 2026-08-11.
`[from NOTES.md EAINT-12175]` `[from SRD EAINT-12175 v1.1 §1.3]`

## Why this file exists

Coverage check for EAINT-12175 found no flow document at all for the BackOffice Insurance Enquiry
screen, and no navigation path recorded for the Insurance Dashboard portal — see
`_reference/tickets/EAINT-12175/NOTES.md`. This is the first written record.

## BackOffice — Insurance Transaction Listing

Login to BackOffice → Insurance menu section → **Insurance Transaction Listing**.

- Insurance Company filter dropdown sits in the search filters at the top of the screen.
- Run a search (blank filters also work) to render the results table — Insurance Company is one
  of its columns.
- Click into any row to open that transaction's **Policy Detail view**.

## UCD portal — Transaction Listing (Motor Insurance)

Login to the dealer/UCD portal → **Motor Insurance** → **Transaction Listing** tile.

- The Insurance Company filter dropdown appears in **both** the basic and the advanced filter
  areas on this screen — check both when automating it, not just the first one found.
- Run a search to render the results table with the Insurance Company column.
- Click into any row to open that transaction's **Policy Detail view**.

### Verified DOM — UCD Insurance Transaction Listing

`[verified: _reference/html/eauto/insurance-listing-pending-payment-row.html, captured 2026-08-18;
driven by scripts/eauto-quotation-reminder/pages/InsuranceListingPage.ts and
scripts/eauto-e2e/pages/TransactionEnquiryPage.ts]`

| Item | Handle |
|---|---|
| URL | `/view/ucd/insurance/enquiry` (tile `#insuranceListing`); `/view/ucd/insurance/enquiry/main.jsp` renders the same page (`scripts/eauto-e2e/pages/TransactionEnquiryPage.ts:19`) |
| Breadcrumb | `Home / Motor Insurance / Insurance Transaction Listing` (`.page-name`) |
| Filter form | `form#search-form.not-to-print` |
| Vehicle No | `input[name=vehicleNo]#vehicleNo` |
| Transaction No | `input[name=refNo]#refNo` (`.form-group.not-draft`) |
| Date Created | `input[name=fromDate]#fromDate`, `input[name=toDate]#toDate` — readonly datepickers (`.hasDatepicker`); the one-month From→To rule in [quirks.md](quirks.md) applies |
| Status | `select[name=status]` — options `""` All, `DRAFT` Quotation, `PENDING` Pending Payment, `SUCCESS` Insurance Created, `FAILED` Failed, `APPROVAL` Pending Approval, `EXPIRED` Quotation Expired |
| Insurance Company | `select[name=insuranceCompany]` — `""` All, `RHB` "RHB Insurance Berhad", `Takaful`, `Chubb`, `Lonpac`, `TokioMarine` (this is the dropdown EAINT-12175 renames) |
| Duplicate id trap | **both** selects carry `id="to-filter"` — select by `name` |
| Search | `button#to-search.btn-blue` (`type=submit`); nothing renders before it; `#empty-state.table-empty-state` reads "Please apply search to show the record" |
| Table | `table.custom-table`, header `tr.header`, rows `tr.odd` / `tr.even` |
| Columns (13) | `#`, Vehicle No, Reference No, Insured Name, Created Date (`dd-MM-yyyy HH:mm`), Insurance Company, Payment Amount, Payment, JPJ, Status, E-Certificate No, Remarks, Action |
| Status cell | `td.center.status` — e.g. `<td class="center status" style="color:blue"><b>Pending Payment</b></td>` |
| Action cell | `td.center.action` → `a.to-view[data="<uuid>"][title="to view B68004346"]` "View"; on an unpaid row also `a.to-payment[data="<uuid>"][title="to payment B68004346"]` "Resubmit" |
| Details URL | `/view/ucd/insurance/enquiry/view.do?transactionId=<uuid>` (the uuid is the `data` attribute — no URL scraping) |

**Search by vehicle number only.** Adding the status filter to a vehicle search hid a row that
existed; read the Status cell afterwards instead. `[from Faizuddin, 2026-08-18; verified:
InsuranceListingPage.ts:10-16]` Rows can commit a beat after the page that wrote them moves
on — both suites retry the search (4 attempts). The insurance details page is still only
regex-read (`scripts/eauto-e2e/pages/TransactionEnquiryPage.ts:60-119`): labels `E-Certificate
No/Policy No`, `Submission Status to JPJ`, `Date Issue`, `Insurance Company`, `Insurance Plan`,
`Full Name`, `IC No`, `Email`, `Vehicle No`, `Vehicle Use`, `Capacity`, `Cover Type`, `Hire
Purchase:` (`User Submission)`), `Sum Covered`, `Total Nett Contribution After Discount`; status
is the body text containing `Insurance Created`, refreshed up to 3 times.

## BackOffice — Insurance Quote Enquiry (the "Insurance Checker")

A BackOffice page that quotes a vehicle **without creating anything** — the dashboard's
Insurance Checker (`app/eauto/insurance/page.tsx`, tab "check", `POST /api/insurance/check`)
runs `scripts/eauto-insurance` against it for a batch of vehicle numbers.
`[verified: scripts/eauto-insurance/data/config.ts:11 · enquiryPath; pages/EnquiryPage.ts;
app/api/insurance/check/route.ts]`

| Item | Handle / rule | Source |
|---|---|---|
| URL | `<base>/view/insurance/insurance-quote-enquiry/` — a **BO** path (no `/ucd/`) | `data/config.ts:11` |
| Login | BO account (`EAUTO_USERNAME`/`EAUTO_PASSWORD`, default `faizuddinBO1`), `<base>/public/login`; after login the suite navigates straight to the enquiry path and retries login once if bounced to `/login` | `data/users.ts:12-18`, `pages/LoginPage.ts:38-65` |
| Form | `#quote-form`; `input[name="vehicleCategory"][value="company"]`; `#vehicleRegNo`; `#buyerRefIdCompanyROC`; `#to-show-result` | `pages/EnquiryPage.ts:13-17` |
| Postcode step | `#postcode` appears for some vehicles; fill and click `#to-show-result` again | `EnquiryPage.ts:99-114` |
| Vehicle detail | `#vehicle-detail` with `td.quote-label` → next cell: Make, Model, Manufacturing Year, Engine Capacity, Transmission, Variant; `#varientSeriesType` select appears for some motorbikes (pick index 1) | `EnquiryPage.ts:19, 23, 127-138, 169-195` |
| Get quote | `#to-continue` | `EnquiryPage.ts:20` |
| Results | one `.plan-detail-table` per insurer; name in `.plan-name` (or `th`/`td`); cells `Cover Type …` (text before "Period"), `Refer Risk:` / `Refer Risk Code:`, `Allow to purchase insurance:`, and a `Total Price` row with `RM x,xxx.xx`; `TokioMarine` is normalised to `Tokio Marine` | `EnquiryPage.ts:197-262` |
| Busy state | body text `Working...` — poll until gone (60 s cap); `Unable to retrieve your vehicle information` → `NO_VEHICLE_INFO` | `BasePage.ts:9-17`, `EnquiryPage.ts:84-120` |
| Alerts | the form is AJAX and may fire a JS `alert()`; a single `dialog` handler accepts them | `EnquiryPage.ts:68-77` |
| Session expiry | each vehicle re-navigates; a `/login` URL triggers re-login | `EnquiryPage.ts:50-55` |
| Parallelism | `INSURANCE_CONCURRENCY` (default 4, dashboard default 8) browser contexts, one BO login each; results flushed to `output-results.xlsx` after every vehicle (atomic rename) | `tests/insurance-checker.spec.ts:29-48`, `utils/excel.ts:104-120` |
| File contract | input `input-vehicles.xlsx` (`Vehicle Number`, `IC Number`, `Postcode`, `Vehicle Category`); output sheets `Summary` (Vehicle Number, Make, Model, Mfg Year, Engine CC, Transmission, Variant, Insurer, Cover Type, Allow Purchase, Refer Risk Code, Total Price) and `Skipped Vehicles` (Vehicle Number, Status, Reason) | `utils/excel.ts`; route `readOutputExcel()` |
| ID normalisation (route) | two or more dashes = IC → strip dashes (`030217-14-1005` → `030217141005`); one dash = SSM → keep (`1234567-X`); fallback IC `030217141005`, postcode default `31150` | `app/api/insurance/check/route.ts:43-48`, `scripts/eauto-insurance/data/config.ts:14-15` |
| Timeout | 30 min per batch (`TIMEOUT_MS`), `DELETE` stops and returns partial rows | route |

Example output row (2026-09-21 run): `VPM7358 · Chubb · "Cover Type Private Car (Enhanced)" ·
Allow Purchase No · Refer Risk "[Sum Insured more than -8.51 % below market value is Decline
Risk.]"`; `Lonpac · "Cover Type Comprehensive (1st party)" · No · "Vehicle class does not match
the class code"`. `[verified: scripts/eauto-insurance/output-results.xlsx, read 2026-10-15]`
The "Cover Type " prefix is part of the captured string — strip it before comparing.

## UCD portal — Report (Motor Insurance)

Login to the dealer/UCD portal → **Motor Insurance** → **Report** tile.

- Same pattern as Transaction Listing: the Insurance Company filter dropdown appears in more than
  one place on the search screen — check both.
- Generate the report to render the results table with the Insurance Company column.

## Insurance Dashboard — a separate portal, separate login

Not reachable from BackOffice's regular menu. It is its own login, at `/motorInsurance/login/`,
using an insurance-user account distinct from a BackOffice or UCD login.

1. Go to `/motorInsurance/login/` directly.
2. Log in with an insurance-user account.
3. Lands on the Insurance Dashboard home page.

Two things live behind this login that the SRD for EAINT-12175 did not name as affected pages:

- **Payment Report (Pemaju)** — reached via a link from the dashboard home. Carries its own
  Insurance Company filter dropdown. This was surfaced only by tracing every screen that reads the
  shared plan-code label described in EAINT-12175's SRD — it is a hidden-blast-radius page, not one
  the SRD's Affected Pages table lists. Not the CIBO Payment Report — that is a different page in
  a different system (see [flow-cibo.md](flow-cibo.md) §4.6). Both carry a Payment Mode / insurer
  column; do not conflate test evidence.
- **Insurance Company / Agency Performance chart** — on the dashboard home page itself, reached by
  scrolling down after login. This is the same "Insurance Dashboard chart" the *original*
  EAINT-12175 ticket description named as using the shared label — the SRD's v1.1 requirement list
  (REQ-012 to REQ-015) never picked it back up. Still open whether it needs the same name fix; see
  the ticket study for the open question.

## eSTM Transaction Detail

BackOffice → the section containing eSTM Transaction, menu path `/view/estm/enquiry` → click into
any transaction row to open its detail view.

## Credit Portal Insurance Enquiry

Not a standalone menu item — opened from inside a specific transaction, not from a menu.

1. Login to the Credit/Service Portal.
2. Open a Hire Purchase record/transaction that has an insurance component attached.
3. From that transaction's detail screen, open its **Insurance Enquiry** link/tab.

## Role-gated menu items

Exact menu wording can vary by BackOffice role — some items are Admin/HubAdmin-only. If a menu item
above isn't visible under a given login, treat that as a permissions difference, not a wrong path.

## Left open — do not build automation on these yet

Two items came back from the same code-reading chatbot pass and were **not** folded in above,
because each one either contradicts an existing source or is ambiguous about what it actually is:

- **UCD Insurance Quote & Optional Coverage — portal conflict, partly resolved 2026-10-15.** The
  chatbot placed this screen on the **BackOffice** side (Insurance menu → Insurance Quote Enquiry →
  listing → into a quote record → detail/coverage screen). EAINT-12175's SRD (Section 2.2.3,
  Affected Pages item 6) names this as an **eAuto — UCD** screen. Both portals do have a
  quote screen, and they are different pages: BackOffice has an **Insurance Quote Enquiry** at
  `/view/insurance/insurance-quote-enquiry/` (quote-only, no purchase — § BackOffice — Insurance
  Quote Enquiry above, `[verified: scripts/eauto-insurance]`), and UCD has the quote → Optional
  Coverage → payment purchase flow at `/view/ucd/insurance/...`
  ([flow-insurance-purchase.md](flow-insurance-purchase.md)). The SRD's "Quote & Optional
  Coverage" matches the UCD flow (BO's page has no Optional Coverage step in the checker's
  DOM). Whether the BO quote enquiry also has a per-quote detail/coverage screen as the chatbot
  described is still `[unconfirmed]` — the checker never clicks into a result.
- **"Backend-generated Invoice PDF" — possibly not the same document as the Receipt PDF.** Reached,
  per the chatbot, via BackOffice → Insurance Transaction Listing → a Lonpac transaction's detail
  page → an "Invoice" button (Lonpac-specific: the button reads "Invoice", not "Print Invoice" as it
  does for other insurers). EAINT-12175's SRD (REQ-011) instead describes a backend-generated
  **Receipt** PDF, already correct, no change needed. Invoice and Receipt read as two different
  artefacts. Confirm which one the chatbot actually found before assuming it's the same PDF REQ-011
  already covers.
