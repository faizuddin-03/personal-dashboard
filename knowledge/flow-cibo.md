# Flow: CIBO — portal shell, Transaction Management, Payment Management, Payment Report

Written 2026-10-15 from the SRDs and test scripts of the four CIBO tickets in
`_reference/tickets/` (EAINT-12058, EAINT-12151, EAINT-12327, EAINT-12107), the
EAINT-12151 mockup HTML, and the ticket notes. **No live CIBO page has ever been
captured and no CIBO page object exists** — every DOM handle here comes from a
*mockup*, not the running portal. Treat the whole file as a map of what the
tickets have established, not as selectors you can build on.
`[verified: no _reference/html/cibo/ folder; no CIBO page object under scripts/ or tests/, 2026-10-15]`

What CIBO *is* (a separate system holding both eAuto and Secarang insurance
transactions, its ticket history, the 11934/12058 backfill story) is in
[cibo.md](cibo.md). This file is the page-by-page flow.

## 1. Why this flow matters, and what depends on it

1. CIBO is the **third verification surface** for every eAuto insurance
   transaction (after UCD and BO) and the **only** record surface for a Secarang
   transaction. Any payment-channel or insurance CR ends with a CIBO check.
   `[from ticket EAINT-11864 test script — cibo.md; SRD EAINT-12151 §2.1.1 assumption 1]`
2. Four CRs in two months changed its listings (12058 columns, 12151 dates, 12107
   filter + reference id, 12327 payment mode). Each one re-asks the same questions
   — which page, which column position, is the export the same — so they are
   answered once here.
3. Nothing in this repo automates it; the combined 12107+12327 workbook marks
   every CIBO row "manual". `[verified: app/eauto/12107/page.tsx:66-79 · notBuilt: true]`

## 2. Entry points

| Entry | What is known | Status |
|---|---|---|
| Login | Every TS starts "Open and login into CIBO" / "Login to CIBO". URL, account type and credentials are **not in the repo**. | `[unconfirmed]` |
| Left icon sidebar | The mockup shows a 78 px icon-only sidebar (avatar, 9 nav icons, a collapse chevron); the active icon is the chart icon for Transaction Management. Which icon is which page is not labelled. | `[from mockup EAINT-12151, 2026-08-19 — not live DOM]` |
| Pages reached from it | **Transaction Management** (page title) containing the **Transaction Listing** (table), with a **Transaction Details** view per row; **Payment Management** (Payment Channels filter, listing, export); **Payment Report** (listing, export). | `[from SRD EAINT-12327 §2.2.3; SRD EAINT-12107 §2.2.3; SRD EAINT-12151 §2.2.1]` |
| Environment | Chosen per ticket. The 12058 BA plan and the 12151 session used one labelled `cibo` under the eAuto staging host; that is a per-ticket fact, not a rule. | `[from BA testing plan EAINT-12058; user, 2026-09-28 — cibo.md]` |

**Naming — settled.** "Transaction Management" is the page/module; "Transaction
Listing" is the table on it; "Transaction Management Listing" (EAINT-11934 /
12058 wording) is the same surface. The 12327 SRD writes it as
`CIBO > Transaction Management > Transaction Listing`, the 12151 SRD as
`Module: Transaction Management > Transaction Listing`, and the mockup has
`<h1>Transaction Management</h1>` over `<h2>Transaction Listing</h2>`.
`[from SRD EAINT-12327 §2.2.3 item 1; SRD EAINT-12151 §2.2.1 item 3; mockup EAINT-12151 lines 141, 200]`
This closes the `[unconfirmed]` "one screen or two" question in cibo.md.

## 3. URL map

No CIBO URL is recorded anywhere in the repo. `[verified: grep for cibo URLs across knowledge/, lib/, app/, scripts/, _reference/tickets — none, 2026-10-15]`

| Step | URL | Arrival signal |
|---|---|---|
| Login | `[unconfirmed]` | — |
| Transaction Management | `[unconfirmed]` | page title "Transaction Management", filter card, "Transaction Listing" table `[from mockup]` |
| Transaction Details | `[unconfirmed]` — opened from a listing row ("Open the transaction details page") | shows Payment Method, amount, Payment Reference ID `[from TS 12107_TS01 CIBO expected]` |
| Payment Management | `[unconfirmed]` | Payment Channels filter, [Search], [Export], [Clear all] `[from TS 12107_TS06]` |
| Payment Report | `[unconfirmed]` | date range, [Search], [Export], Payment Mode column `[from TS 12327_TS05/06]` |

## 4. The real DOM handles — mockup only

Source: `_reference/tickets/EAINT-12151/EAINT-12151-CIBO-Transaction-Listing-Mockup-20260819.html`
(BA mockup attached to the CR, 2026-08-19). **These ids exist in the mockup's own
script; the live Angular/React portal almost certainly uses different ones.** They
are recorded because the mockup is the only picture of the page we have, and its
*labels, column order and export header* are what the SRD was signed off against.

### 4.1 Transaction Management — filter panel

| Control | Mockup markup | Line |
|---|---|---|
| "Hide Filters" toggle | `div.hidefilters` | 142 |
| Platform | `.field` with `span.fl` = "Platform", `div.ctrl` dropdown | 146-149 |
| Insurance Company | same pattern, "Insurance Company" | 150-153 |
| **Date Range Type** (new in 12151) | `#drt` (`.field.dd-wrap`), trigger `#drtCtrl`, value `#drtValue`, items `.dd-item[data-val="txn"]` "Transaction Creation Date" (renamed) and `.dd-item[data-val="ins"]` "Insurance Creation Date" (new) | 155-162 |
| date range | label `#rangeLabel` = "<type> range"; `input#fromDate[type=date]` (From), `input#tillDate[type=date]` (Till) | 163-169 |
| Transaction Status | dropdown | 171-174 |
| Submission to JPJ Status | dropdown | 175-178 |
| Road Tax | dropdown | 180-183 |
| Discount Code | dropdown | 184-187 |
| free-text search | `input#searchText[placeholder="Search"]` | 191 |
| Search / Clear all | `button.btn-primary` "Search", `button.btn-link` "Clear all" | 192-193 |

Filter values seen in the test scripts (the live option lists are `[unconfirmed]`):
Platform = `Secarang` / `eAuto`; Insurance Company = `Pemaju Ekslusif` (an
agency label — the mockup shows it as a purple badge under the insurer name);
Transaction Status = `Insurance Created`; Submission to JPJ status = `Accepted`;
Road Tax = `Exempted`; Discount Code = `Included`; `-` for "any".
`[from TS: _reference/tickets/EAINT-12151/… .xlsx, 12151_TS04/TS05]`
Mockup row statuses: `Approved`, `Pending payment`; payment badge `Paid` /
`Pending`; JPJ badge `Approved` / `-`; platform badge `Secarang`.
`[from mockup lines 274-301]`

### 4.2 Transaction Management — listing table

Header row, in order, after EAINT-12151 (mockup lines 211-228):

`#` · `Transaction Ref. No.` · **`Transaction Created Date`** (renamed from
"Created Date") · **`Insurance Created Date`** (new) · `UCD` · `UCD Name` ·
`Vehicle No` · `Vehicle Type` · `Insured` · `Payment` · `Discount Code` ·
`Road Tax` · `Ins. Co.` · `Transaction Status` · `JPJ` · `Remark`

After EAINT-12327 a **`Payment Mode`** column is inserted **after `Payment` and
before `Discount Code`**. `[from SRD EAINT-12327 REQ-003]`

Cell shapes (mockup `rowHTML`, lines 273-302): ref no. stacked with a platform
badge; Insured = name over IC; Payment = amount, Paid/Pending badge, then the
payment date-time `DD-MM-YYYY HH:mm`; Ins. Co. = insurer over agency badge; a
Secarang row shows `-` in UCD, UCD Name, Discount Code, Road Tax, Remark.

Actions: `button.btn-out` **Print** and `button.btn-out` **Export** (mockup lines
202-203); result note "Showing N of M transactions" with a chip naming the date
type and range (lines 314-324).

### 4.3 Transaction Management — export (CSV)

The mockup's `exportCSV()` writes `Transaction_Management_<yyyymmddHHMM>.csv`,
UTF-8 BOM, row 1 = title `Transaction Management`, row 2 blank, row 3 = headers,
"matches portal export" per its comment (lines 383-418). The **40 columns**:

`Transaction Ref. No.` · `Platform` · `Transaction Created At` (renamed from
"Created At") · `Insurance Created At` (new, immediately after) · `Company Name` ·
`Company Registration No.` · `UCD Name` · `Vehicle No.` · `Vehicle Type` ·
`Insured Name` · `Insured ID` · `Gross Premium (RM)` · `Service Tax (RM)` ·
`Stamp Duty (RM)` · `Total Premium (RM)` · `Road Tax` · `Discount (RM)` ·
`Discount Code` · `Payment Amount (RM)` · `Insurance Commission Amount (RM)` ·
`Payment Status` · `Payment At` · `Payment Month` · `Payment Year` ·
`Insurance Company` · `Agency` · `Transaction Status` ·
`E-Certificate No. / Policy No.` · `Coverage Type` · `Year` · `Make` ·
`UCD City` · `UCD State` · `Vehicle Model` · `Hire Purchase (Claimed by)` ·
`Hire Purchase (User Submission)` · `Hire Purchase (Returned by JPJ)` · `JPJ` ·
`Remark` · `Special Remark`

`[from mockup EAINT-12151 lines 385-392 — the mockup's own claim that it matches the portal export; not verified against a real file]`
The same 40-column order appears in the EAINT-9979 Reference sheet, "NEW VER"
column (Transaction Ref. No. … JPJ, Remark, Special Remark).
`[from SharePoint TS #140 EAINT-9979, sheet Reference, rows 4-43]`

Note the **export header differs from the screen header** for the same field
("Transaction Created At" vs "Transaction Created Date"; "Payment Status"/"Payment
At" split out of the screen's single "Payment" cell). 12327's Payment Mode column
in the export is required to sit "after the Payment column and before the Discount
Code column" — in the CSV above the neighbours are `Payment Year` … `Discount Code`
is *before* the payment columns, so **where exactly the export column lands is
`[unconfirmed]`** until a real export is read. `[from SRD EAINT-12327 REQ-005 vs mockup column order]`

**The export is a CSV.** The EAINT-9979 script expects
"Transaction_Management_YYMMDDHHmm.csv e.g: Transaction_Management_202605080846"
`[from SharePoint TS #140 EAINT-9979, sheet Test Scenario, row 2]` (the example is
actually yyyyMMddHHmm). Supersedes the earlier `[unconfirmed]` xlsx-vs-csv question
(the 11934/12058 material said "Excel export", 12151 "CSV export", 12327/12107
"exported file"); still not checked against a live export. An older file name,
"Transaction_Management_ {YYYYMMDD}", appears in EAINT-8657 (Oct 2025).
`[from SharePoint TS #134 EAINT-8657 & 8956, sheet 8657 & 8956 (Latest), row 11]`

### 4.4 Transaction Details

Opened from a listing row. Expected content per the 12107 TS: "Payment Method
Fiuu eWallet GrabPay Paid" (e-wallet) / "Fiuu Credit or Debit Card Paid" /
"Fiuu FPX RHB Paid", the amount, and the Payment Reference ID.
`[from TS 12107_TS01/TS07/TS08 CIBO expected]` It is the page the 12107 SRD names
as affected (not the listing row). `[from SRD EAINT-12107 §2.2.3 item 4]`
No DOM known.

### 4.5 Payment Management

Known only from EAINT-12107:

| Element | Fact | Source |
|---|---|---|
| Payment Channels filter | tree of checkboxes; new parent **`Fiuu - eWallet`** with children `GrabPay`, `GrabPay - PayLater by Grab`, `ShopeePay`, `ShopeePay - SPayLater` | SRD REQ-011/012 |
| parent tick | ticks all 4 children | SRD REQ-012 |
| child untick | unticks that child only, others stay ticked | SRD REQ-013 |
| parent untick | "de-select all 4 of the nested Fiuu options" | TS 12107_TS06 step 20 — **not in the SRD** |
| whether unticking a child also clears the parent tick | **(Open)** — not in the SRD | TS 12107_TS06 step 19 remark |
| existing channels in the same filter | `Credit or Debit Card`, `FPX` (TS07/TS08 filter by these) | TS 12107_TS07/TS08 |
| listing columns | transaction, payment amount, Status (`Paid` / `Failed`), Payment channel ("Fiuu eWallet / GrabPay", "Fiuu / Credit or Debit Card", "Fiuu / FPX - RHB"), Payment Reference ID | TS 12107_TS01/02/07/08 — wording is the TS author's, not the SRD's |
| buttons | [Search], [Export], [Clear all] | TS 12107_TS06 |
| export | must mirror the listing filter result and carry the Payment Reference ID | SRD REQ-015 b; TS 12107_TS06 |

Shane, 2026-09-09: "cibo staging changes are up as well, added filter for fiuu
ewallet payment and introduced this payment method in transaction management."
`[from Jira EAINT-12107 comment]`

### 4.6 Payment Report

| Fact | Source |
|---|---|
| Has had a **UCD Name** column (between `UCD` and `Vehicle No`, listing and export) since EAINT-11934 went live 2026-07-24; Secarang rows show `-` | cibo.md § What the executed 11934 script established; TS 12058_TS6 |
| Has a **User ID** column that must match the Transaction Management listing | TS 12058_TS5 |
| Has a **Payment Mode** column whose value today is the gateway name only, `BoldPay` or `Fiuu`; after EAINT-12327 the full format, position unchanged, **never blank** | SRD EAINT-12327 §2.2.2 item 1, REQ-004, REQ-006 |
| Pre-12327 Payment Mode values by source: "Bold Pay" = **Makrokiosk** transactions; "Fiuu" = Secarang on/after the cutoff; "RMS" = Secarang before it; "RHB" = eAuto. BoldPay is therefore the Makrokiosk gateway, not a Secarang one | SharePoint TS #129 EAINT-11541, sheet EAINT-11541, rows 3-10 |
| Export file "Payment_Report_YYMMDDHHmm.csv" | SharePoint TS #128 EAINT-10052, sheet Test Scenario, row 2 |
| Shows the Payment Reference ID (so the `EW` marker appears here too) | SRD EAINT-12107 REQ-015 d/e |
| Filter: a date range + [Search]; export via [Export] | TS 12327_TS05/06 |
| Shows records "by Insurance Created Date" (the reason 12151 exists) | SRD EAINT-12151 §2.2.2 item 1 |
| Insurance Dashboard portal also has a "Payment Report (Pemaju)" — a **different** page in a different portal | flow-eauto-insurance-enquiry.md |

### 4.7 Referred Risk Log — export only

Known only from the EAINT-9900 script; no DOM.

1. Column order: "1 Inquiry Date 2 Inquiry By 3 Platform 4 Reference No 5 Company
   Name 6 Company Registration No 7 Vehicle No. 8 Vehicle Type 9 Insured Name 10
   Insured ID 11 Insurance Company 12 Year 13 Make 14 UCD City 15 UCD State 16
   Vehicle Model 17 Hire Purchase…"
   `[from SharePoint TS #139 EAINT-9900, sheet Test Scenario, row 3]`
2. Inquiry Date format "DD-MM-YYYY HH:MM (24hrs system)"; Inquiry By "UCDID/userID".
   `[from SharePoint TS #139 EAINT-9900, sheet Reference, meta rows 3-4]`
3. UCD City is the branch's city. `[from SharePoint TS #139 EAINT-9900, sheet Test Scenario, row 8]`
4. The script reuses the Payment_Report file-name pattern for this export
   `[from SharePoint TS #139 EAINT-9900, sheet Test Scenario, row 2]` — likely a
   copy error `[unconfirmed]`.

## 5. Decision points and business rules

### 5.1 Dates (EAINT-12151)

1. Filter dropdown **Date Range Type** under the Platform filter with two options:
   `Transaction Creation Date` (the old "Creation Date", behaviour unchanged) and
   `Insurance Creation Date` (new). `[from SRD EAINT-12151 REQ-001/002; TS 12151_TS01]`
2. Listing column `Created Date` → **`Transaction Created Date`**; new column
   **`Insurance Created Date`** between `Transaction Created Date` and `UCD`.
   `[REQ-003/004]`
3. **Insurance Created Date = the payment date-time**, format `DD-MM-YYYY HH:mm`
   for an approved transaction, `-` when not yet approved. `[SRD §2.1.1 assumption 3; REQ-005]`
   Dev clarification: it is the insurance payment table's `last_updated_at`, not
   the JPJ-approved date. `[from Teams, Mong Guo Hao, 2026-08-20 12:17 — via Session-Handoff-2026-09-28-12151.md]`
4. Filtering by Insurance Creation Date **excludes** rows with no insurance
   created date (not yet approved). `[REQ-006]`
5. Export: `Created At` → `Transaction Created At`, new `Insurance Created At`
   directly after it; Print shows the same columns as the screen. `[REQ-007/008/009]`
6. From/Till validation "follows the existing Transaction Listing filter
   behaviour; no change". What that limit is, is **`[unconfirmed]`** — the
   one-month rule in [quirks.md](quirks.md) is stated for eAuto modules, and the
   12151 TS05 itself uses a range of 1 Aug–28 Sep 2026 (almost two months) while
   TS04 and the 12327 TS use one month. Check on the first live visit.
   `[from SRD EAINT-12151 §2.1.1 assumption 2; TS 12151_TS04/05; TS 12327_TS01]`

### 5.2 UCD attribution columns (EAINT-11934 / 12058)

1. `UCD Name` sits between `UCD` and `Vehicle No` in the listing and the export;
   eAuto rows show the full name, Secarang rows `-`. `[from TS 12058_TS1/TS2; cibo.md]`
2. Rows before 2025 show no UCD Name (migration boundary) — accepted. `[TS 12058_TS4 remark]`
3. Only `Full Name` is visible in CIBO; Full Name (paid), Full Name (last update)
   and Login ID (paid) are DB-only, evidenced by dev screenshots. `[cibo.md § Most of 12058 is not visible]`
4. Open assumption in the TS: the visible name is the **creator**; if it shows the
   payer, ask dev rather than log a defect. `[TS 12058_TS3 remark]`

### 5.3 Payment Mode (EAINT-12327)

1. One format, order **gateway | method – details**, 7 values:
   `BoldPay | eWallet – TouchNGo`, `BoldPay | Online Banking – FPX-Bank Name`,
   `BoldPay | Credit/Debit Card – MBBMGATE_MS`,
   `Fiuu | eWallet – ShopeePay – Full Amount – Single Payment`,
   `Fiuu | eWallet – ShopeePay – BNPL – Installment`,
   `Fiuu | eWallet – GrabPay – Full Amount – Single Payment`,
   `Fiuu | eWallet – GrabPay – BNPL – Installment`. `[SRD REQ-001; Jira description row 3]`
2. Transaction Listing + export: new column after `Payment`, before `Discount
   Code`; `-` when no payment mode recorded. `[REQ-003/004/005]`
3. Payment Report + export: same position as today, new value, no blanks. `[REQ-004/006/007]`
4. Same transaction → identical string on all four surfaces. `[REQ-002]`
5. Not specified: back-fill of historical rows ("Existing and new transactions"
   only); the source of "Bank Name"; other BoldPay e-wallets; any filter/sort on
   the column; **no string for Fiuu Credit/Debit Card or Fiuu FPX** although
   Secarang pays those through Fiuu today. `[unconfirmed — raised in NOTES, ask Lim Yi Link]`

### 5.4 Payment Reference ID (EAINT-12107)

1. E-wallet transactions carry **`EW`** in the Payment Reference ID, example
   `LON20260908SEW0002`. Displayed in: Payment Management Listing, its export,
   Transaction Details, Payment Report, its export. `[SRD REQ-014/015]`
2. Card and FPX transactions must **not** contain `EW`. `[TS 12107_TS07/TS08 CIBO expected item 4 — TS author's negative, not in the SRD]`
3. Reading of the example: `LON` = Lonpac, `20260908` = date, then `S`, `EW`,
   `0002` sequence — only `EW` is defined; the rest is **`[unconfirmed]`**.

### 5.5 Transaction status / payment status values

Seen: Transaction Status `Approved`, `Pending payment` (mockup), `Insurance
Created` (TS filter); Payment status `Paid`, `Pending` (mockup), `Failed` (12107 TS
for a failed gateway outcome); Submission to JPJ `Accepted` (TS filter) /
`Approved` badge (mockup). The full option lists are `[unconfirmed]`.

## 6. Preconditions and test data

1. A CIBO login with Transaction Management, Payment Management and Payment
   Report access — source and role `[unconfirmed]`.
2. **One transaction per payment mode** for 12327 (7) — only GrabPay Full Amount
   can be paid live in the Fiuu sandbox; ShopeePay, SPayLater and PayLater by Grab
   come from **dev data patching** of GrabPay rows (Shane: "it's confirmed that we
   can disable any payment method by data patching", Jira 2026-09-09); BoldPay
   TouchNGo / FPX / card rows must already exist. `[from TS 12327_TS02; SRD EAINT-12107 §2.2.8]`
3. An unpaid Secarang transaction for the `-` Payment Mode case. `[TS 12327_TS03]`
4. An eAuto transaction created by a Sub UCD and paid by the Main UCD for the
   12058 attribution case; a pre-CR transaction for every regression row.
5. For 12151: approved and not-yet-approved rows in the same date window
   (the mockup seeds both). `[from mockup TX data lines 245-261]`
6. Secarang-side creation: see [flow-secarang-insurance.md](flow-secarang-insurance.md);
   eAuto-side: [flow-insurance-purchase.md](flow-insurance-purchase.md).
   Remember that an eAuto run that stops before step 3 never reaches any listing.

Safety: CIBO is read-only for QA in every TS (search, export, print, open details).
No TS edits anything in CIBO.

## 7. Traps

1. **Three names, one page** (§2) — do not scope a CR as "listing only" because
   the ticket says "Transaction Management Listing".
2. **Export ≠ screen** — header wording differs (§4.3) and a new screen column has
   to be checked separately in the export; the two can diverge. `[from QA team, 2026-08-13 — cibo.md]`
3. **Secarang rows legitimately show `-`** in UCD, UCD Name, Discount Code, Road
   Tax, Remark — not missing data. `[cibo.md; mockup]`
4. **Pre-2025 rows have no UCD Name** — migration, accepted. `[TS 12058_TS4]`
5. **Payment Report and Transaction Listing used different date bases** before
   12151 (created vs paid) — comparing them row for row was the original complaint.
   `[SRD EAINT-12151 §2.2.2]`
6. **Payment Report "Payment mode = Fiuu"** is the pre-12327 value; a TS written
   for 12107 alone expects it, the combined TS expects the long format. Check
   which build is on the host before calling either a defect. `[from _reference/tickets/EAINT-12107/NOTES.md § Test script v0.2 item 4]`
7. **Dev-patched rows are not real payments** — their Payment Reference ID,
   amount and dates are whatever the patch wrote; verify display rules, not
   financial truth.
8. **ShopeePay in the Payment Channels filter may list rows that the sandbox
   could never create** — all of them are patches.
9. Date-range limit unknown (§5.1 item 6) — a 2-month range may be rejected or
   may work; record what happens.

## 8. What is NOT covered

1. Login page, URL scheme, session behaviour. (The role-to-module matrix from
   EAINT-9840 is in [cibo.md](cibo.md) § Roles; it is script-sourced, not live.)
2. Any live DOM — every handle above is mockup-only.
3. Transaction Details page content beyond the three TS expectations.
4. Payment Management listing columns, its date filter, pagination, sort.
5. Payment Report columns other than UCD Name, User ID, Payment Mode, Payment
   Reference ID; its filters other than a date range.
6. Referred Risk Log pages, dashboards, any other CIBO module — no ticket in
   `_reference/tickets/` has touched them. Only the Referred Risk Log export columns
   are known, from the SharePoint EAINT-9900 script (§4.7). Supersedes "nothing is
   known" `[verified: grep "Referred Risk" across the repo → none, 2026-10-15]`.
7. Print output layout (12151 REQ-008 only says "same values as on screen").
8. How transactions arrive in CIBO (live join vs sync vs write-time snapshot) —
   still the open question in cibo.md.
9. The exact export column position of Payment Mode. (Export file type is
   settled as CSV — §4.3.)

### 4.4a Transaction Details — captured 2026-10-20

Captured: `_reference/html/cibo/transaction-details.html` (BR60006259). Reached by clicking
the Transaction Ref. No. link on the listing (`/cibo/transaction-management/transaction-details/<uuid>`).
Header: vehicle + model, "Ref. No: BR…", status badge ("Insurance created"), buttons
Certificate of Insurance / Policy Schedule / Receipt. Sections: Car Owner Details, Car
Details, Payment Details (Receipt No, Payment History: date, "Payment Method" →
"Fiuu eWallet - GrabPay" + "Paid" badge, "Payment Ref ID"), More Info, premium block
ending "Total Premium". Each field = label element + value sibling.
Page object: `CiboTransactionDetailsPage` (scripts/eauto-12107/pages/cibo/CiboPages.ts).
`[verified: live HTML, staging, 2026-10-20]`
A PayLater by Grab (Instalment) patched row shows Payment Method "Fiuu eWallet - GrabPay"
— no PayLater wording, accepted (see knowledge/cibo.md). 12107_TS05 automated 2026-10-20,
passed live on BR60006259.
Insurer line with BRN: Tokio Marine shows "198601000381 (149520-U)" below the insurer name;
EAINT-12406 adds Allianz "200601015674 (735426-V)" in the same layout. "Other insurers (e.g.:
RHB, Lonpac, etc.) remain unchanged." `[from ticket EAINT-12406, SRD v1.1 REQ-011 — Allianz Company Registration Number]`


## Additions from the 2026-10-23 flows study

Source: lib/eautoFlows/modules/*.ts (data mirror for /eauto/flows). Only facts not already in this file.

- Planned page 'Macrokiosk - Opt Out Listing' for free-text WhatsApp opt-outs (To Do). [jira: EAINT-12443]
- Set Platform and Create Date after EAINT-12442 (testing): max 30 days, default 1st of this month to today, From not in the future, Till not after today. [ts: SC_EAINT-9900 9900_TS01-TS06] [jira: EAINT-12442 2026-10-19]
