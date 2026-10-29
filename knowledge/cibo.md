# CIBO — a separate system, inter-related with eAuto and Secarang

## What it is, and what it is not

**CIBO is its own portal, not part of eAuto and not part of Secarang.** Treat the
three as separate systems that share data rather than one product with three
skins — a fact established with the QA team on 2026-08-13. It has its own Jira
component (`CIBO`) in EAINT, distinct from the `eAuto` component.

## CIBO carries BOTH eAuto and Secarang insurance transactions

**The CIBO Transaction Management Listing holds insurance transactions from both
systems in one table**, and they are distinguished by what the UCD-attribution
columns contain:

| Transaction source | UCD Name column shows |
|---|---|
| **eAuto** insurance | the full UCD name |
| **Secarang** insurance | a literal **`-`** |

That is a deliberate rule, not missing data — Secarang transactions have no eAuto
UCD to attribute, so the column is dashed rather than blank. Any CR adding a
UCD-derived column to this listing therefore needs a Secarang case, or half the
rows go unchecked. `[from BA testing plan, EAINT-12058, 2026-08-13]`

For **EAINT-12058 specifically**, the BA plan split the test environments by
system: eAuto at `staging/uat4`, Secarang at `staging/cibo`.
`[from BA testing plan, EAINT-12058, 2026-08-13]` EAINT-12151 was tested on
`cibo/staging` (user-supplied, 2026-09-28). `[from handoff 2026-09-28 EAINT-12151]`

⚠️ **That is one ticket's environment, not a standing fact.** Environments are
chosen per ticket depending on what's free — see
[eauto-portals.md](eauto-portals.md) § Never tie an environment to a general rule.
Read the env from the ticket you're working on; the pairing above tells you nothing
about the next CIBO ticket. `[from QA team, 2026-08-14]`

The relationship that matters for testing: **an eAuto insurance transaction shows
up in CIBO as well.** CIBO is the *third* place a transaction has to be verified,
after the UCD portal and the BO portal. The EAINT-11864 test script makes this
explicit — its cross-check step lists all three:

> Cross check the details in the relevant pages: a. UCD Insurance Transaction and
> Details page · b. BO Insurance Transaction and Details page · **c. CIBO**

`[from ticket EAINT-11864 test script]`

In EAINT-11864 that three-way cross-check (UCD / BO / CIBO) belongs to TS08–TS10
only — the email-link purchase cases — and none of them is automated.
`[from ticket EAINT-11864 test script]`

So a change in eAuto can surface as a defect in CIBO, and a CIBO change can be
reading data eAuto owns. When either side moves, check the other.

## Modules seen so far

| Module / page | Seen in | Notes |
|---|---|---|
| **Transaction Management** → **Transaction Listing** (table) → **Transaction Details** (per row) | EAINT-11934, 12058, 12151, 12327, 12107 | Lists eAuto **and** Secarang insurance transactions. Export + Print. Columns, filters and date rules: [flow-cibo.md](flow-cibo.md) §4.1-4.4, §5 |
| **Payment Management** | EAINT-12107 | Payment Channels checkbox-tree filter (gets the `Fiuu - eWallet` group), listing with Payment Reference ID, Export, Clear all. [flow-cibo.md](flow-cibo.md) §4.5 |
| **Payment Report** | EAINT-11934, 12058, 12327, 12107 | Date-range search, Export. Carries UCD Name (since 11934), User ID, Payment Mode (format changes in 12327), Payment Reference ID. [flow-cibo.md](flow-cibo.md) §4.6 |

The listing's **export is a second read path for the same data**, so any column
added to the listing has to be checked there too — the export can render or omit
a new column independently of the screen. `[from QA team, 2026-08-13]` The
Transaction Management export is a **CSV**: the EAINT-9979 script expects
"Transaction_Management_YYMMDDHHmm.csv e.g: Transaction_Management_202605080846"
`[from SharePoint TS #140 EAINT-9979, sheet Test Scenario, row 2]`, which matches
the 12151 mockup. Supersedes the earlier `[unconfirmed]` xlsx-vs-csv question (the
tickets had called it "Excel", "CSV" and "exported file"); not yet checked against
a live export. See [flow-cibo.md](flow-cibo.md) §4.3.

**Settled 2026-10-15 — "Transaction Listing" and "Transaction Management
Listing" are one surface.** This file previously said: *"Whether 'Transaction
Listing' and 'Transaction Management Listing' are one screen or two is not yet
established … [unconfirmed]"*. The SRDs resolve it: "Transaction Management" is
the page/module, "Transaction Listing" is the table on it, and the 11934/12058
phrase "Transaction Management Listing" names that same table.
`[from SRD EAINT-12327 §2.2.3 "CIBO > Transaction Management > Transaction Listing"; SRD EAINT-12151 §2.2.1 "Module: Transaction Management > Transaction Listing"; EAINT-12151 mockup h1/h2]`

## Roles — after EAINT-9840

CIBO role matrix from the post-implementation sheet
`[from SharePoint TS #138 EAINT-9840, sheet TS Post-Implementation, rows 2, 24, 34, 52, 54]`:

1. **Admin:** all modules — Dashboard, User Account Management, CRM, Transaction
   Management, Payment Management, Referred Risk Log, Payment Report, Commission
   Report, Visitor Management, Agent Management, Discount Code Management `[row 2]`.
2. **Admin Insurance:** "ONLY … DASHBOARD - TRANSACTION MANAGEMENT - PAYMENT REPORT -
   COMMISSION REPORT - DISCOUNT CODE MANAGEMENT" `[row 24]`.
3. **Temporary Insurance Staff:** Dashboard, Transaction Management, Payment Report,
   Commission Report — Admin Insurance minus Discount Code Management `[row 34]`.
4. **Ops Support:** Dashboard and Transaction Management; "The Print & Export button
   will be hidden; user is unable to download the Transaction Listing" `[rows 52, 54]`.

## Money columns and discount codes

From the EAINT-9979 and EAINT-10052 scripts
`[from SharePoint TS #140 EAINT-9979, sheet Test Scenario, rows 4-10]`
`[from SharePoint TS #128 EAINT-10052, sheet Test Scenario, rows 10-13]`:

1. "Gross Premium (RM) refers to total premium amount after NCD (No Claim Discount)
   plus any add-ons." `[#140 row 4]`
2. "Service Tax = Gross Premium (RM) x 8%" `[#140 row 5]`; stamp duty "always RM10"
   `[#140 row 6]`.
3. Total Premium = total payable before discount `[#140 row 7]`.
4. Discount codes: "EAUTOOFF10 - Discount 10% of Gross Premium (automatically applied
   to eAuto transaction) 2. RJC7 - Discount 7% of Gross Premium 3. COTEAM - Discount
   5% of Gross Premium 4. SCW5 - Discount 5% of Gross Premium"; no code → " 0.00 "
   `[#140 rows 8-9]`.
5. Insurance commission "10% applied automatically to transaction made in eAuto";
   Secarang commission follows Discount Code Management `[#140 row 10]`.
6. Commission to sub-agent: RJC7 3% `[#128 row 11]`.
7. "Total Direct Cost = Discount to Customers + Commission to Sub Agent"; "Gross
   Profit = Insurance Commission Amount − Total Direct Cost"; " 0" when no discount
   code `[#128 rows 12-13]`.

## Secarang rules that surface in CIBO

1. **Discount line on the Secarang receipt / email / WhatsApp (EAINT-8331/8334/7199):**
   Discount and Total Amount show only for codes MF / EAUTO / ER; hidden for other
   codes and when no code is used.
   `[from SharePoint TS #133 EAINT-8331, 8334 & 7199, sheet EAINT-8331, 8334 & 7199, rows 14, 17]`
2. **Lonpac 14-day renewal grace (EAINT-9062):** "Policy expired and is still within
   14-day renewal period | Able to purchase Lonpac insurance"; beyond 14 days the
   purchase is not possible. `[from SharePoint TS #137 EAINT-9062, sheet EAINT-9062, rows 2-3]`

## What CIBO shows about a UCD

Historically the listing carried **only the date/time** of an insurance
transaction — no indication of *which* dealer user did anything.

Two tickets are changing that:

- **EAINT-11934** — adds the **User ID of the used car dealer representative** to
  the Transaction Management Listing and the Payment Report. Status: Ready for
  Prod Deployment. `[from ticket EAINT-11934]`
- **EAINT-12058** — reworks how the name is retrieved (11934's method is
  described as "not straightforward") and adds four columns: **Full Name** for the
  UCD who *created*, who *paid*, and who *last updated*, plus **Login ID** for the
  UCD who *paid*. Fix version S32.X-20260817. `[from ticket EAINT-12058]`

**They are two phases of one piece of work, not two unrelated tickets.** The
formal Jira link is only the weak `Relates` type, which understates it. What
actually binds them:

- 12058's description: *"Following EAINT-11934 … the current way to display the
  name is not straightforward — hence an enhancement is needed to retrieve the
  name."*
- A comment on 11934 (Chee Mei Jia, 2026-07-26): *"Payment Report changes has
  been deployed to Production on 24.07.2026 … **Next Phase - Transaction Listing
  + EAINT-12058 together**."*

**11934 was descoped mid-flight**, and which half went matters when scoping a test:

| Surface | State | Testing implication |
|---|---|---|
| **Payment Report Listing + CSV export** | **UCD Name column delivered by 11934**, in Production since 2026-07-24 (S31.8) | **Regression** — 12058 reworks the retrieval underneath it |
| **Transaction Management Listing + CSV export** | **Cut from 11934**, moved to 12058 | **First-time testing**, not regression |

The 11934 testing plan records the cut verbatim: *"Will NOT show UCD Name column
for now due to **difficulty on Dev side to display the value in this page**. To
work on this in separate ticket."* That difficulty is the same thing 12058's
description calls the retrieval being "not straightforward" — so **12058 exists
to unblock the half of 11934 that could not be delivered**.

Note the column is called **UCD Name** in both plans, even though 11934's ticket
title says "User ID". `[from BA testing plans, EAINT-11934 / EAINT-12058, 2026-08-13]`

### What the executed 11934 script established

From Maisarah's completed run (all cases Pass):

- **The UCD Name column sits between `UCD` and `Vehicle No`** — in the listing
  *and* in the Excel export.
- **Records before 2025 do not show a UCD Name**, because of a data migration
  done previously. This is **known and accepted**, not a defect. It is the real
  answer to "are historical rows backfilled?" — they are, but only back to the
  migration boundary.

⚠️ **That script is a snapshot, and it is now out of date.** It covers
*Transaction Management Listing **and** Payment Report* and marks both Pass —
which was true when Maisarah ran it. **Changes were made afterwards**: the
Transaction Management Listing column was pulled from the deployment and moved to
EAINT-12058. The script was never updated, so it still shows a surface passing
that did not ship.

Two consequences:

- **The Pass on Transaction Management Listing is not evidence about production.**
  Only the Payment Report half went live (2026-07-24).
- **EAINT-12058 is re-delivering that surface**, not delivering it for the first
  time — it worked once, then changed. Treat the old expected results as a useful
  starting point for what "correct" looks like, not as a baseline you can assume
  still holds.

`[from QA team, executed EAINT-11934 script + follow-up, 2026-08-13]`

Note also that 11934's summary says *User ID* while its SRD v0.2 "Added UCD Name
display scenarios", which is why 12058 refers to it as a name-display request.
And 11934's **User ID** vs 12058's **Login ID** are plausibly the same field
under two names — unconfirmed. `[from tickets EAINT-11934 / EAINT-12058, 2026-08-13]`

### Most of EAINT-12058 is not visible in the UI

Confirmed with the developer (Goh Kai Jiaeh) on 2026-08-13: of the four new
columns, **only Full Name is visible on the CIBO side** — the rest can only be
checked from the database. The developer offered to supply **DB screenshots** as
the evidence for those.

That shapes how a CR like this gets tested here: treat a dev-supplied DB
screenshot as a legitimate evidence type rather than something QA has to reach
itself. `[from dev Goh Kai Jiaeh, 2026-08-13]`

### Only two of the three name columns can ever differ

An insurance transaction has just two actor-recording events — **create** and
**make payment** — with no separate update step (see
[eauto-insurance.md](eauto-insurance.md)). So on an insurance row:

- **Full Name (created)** — can be a different user (e.g. a Sub UCD)
- **Full Name (paid)** — the payer
- **Full Name (last update)** — **always equals the payer**, since payment is
  the last action

Expect two distinct names at most, never three. `[from QA team, 2026-08-13]`

## Open questions — fill these in as they are answered

Nothing below is established. Do not assume an answer.

- **Base URL scheme.** Does CIBO use the same `staging.eauto.my/<env>` path-segment
  scheme as eAuto, or its own host? (Which *specific* env a ticket runs on is
  always per-ticket — that's not the open question here.)
- **Login and accounts.** Separate credentials, or shared with BO/UCD? (Which
  roles see the Transaction Listing is answered in § Roles — after EAINT-9840.)
- **How transactions arrive.** Live join against eAuto's data, a scheduled sync,
  or its own tables written at transaction time? This decides whether a value
  corrected in eAuto self-heals in CIBO. Partial clue: the UCD Name populates for
  *existing* transactions, so it is either a live lookup or a backfilled value —
  not a write-time snapshot only.
- **Which surfaces exist beyond listing, Payment Report and the export** — other
  downloads, detail pages. The EAINT-9840 module list (§ Roles) names CRM, Referred
  Risk Log, Commission Report, Visitor Management, Agent Management and Discount
  Code Management; none has been studied here yet.

`[from QA team, 2026-08-13]` for the separateness and the inter-relation; every
specific above is `[unconfirmed]` until checked against the running system.

## Testing notes

- **Verify in all three places.** For anything touching an insurance transaction,
  UCD and BO agreeing is not sufficient — CIBO is a distinct read path and can
  disagree.
- **New columns on an existing listing raise the backfill question every time.**
  Historical rows predate the data being captured, so decide up front whether
  they should populate or stay blank, and get it stated rather than inferred.
- **Denormalised vs live-joined names behave differently over time.** If a name
  is captured at transaction time, renaming the user later won't change history;
  if it's joined live, it will. Prove which by renaming a user after a
  transaction and re-reading the listing.
- **No automation exists against CIBO** in this repo — no page objects, no
  selectors, no credentials wired through any runner, and no captured HTML.
  CIBO is *mentioned* in `scripts/eauto-12107` (spec comments) and
  `lib/ticketStudies.ts`, and every CIBO row on the `/eauto/12107` dashboard is
  marked manual (`notBuilt: true`). The only picture of a CIBO page is the
  EAINT-12151 BA mockup. Anything here starts from scratch — read
  [flow-cibo.md](flow-cibo.md) first. (This entry previously read "no CIBO
  references anywhere under scripts/, tests/, lib/" — true in August, not since
  12107.) `[verified: grep, 2026-10-15; app/eauto/12107/page.tsx:66-79]`
- **A CIBO check belongs to every Secarang payment test** — Secarang has no
  listing of its own, so CIBO is the *only* record of a Secarang purchase. See
  [flow-secarang-insurance.md](flow-secarang-insurance.md) §1. `[from SRD EAINT-12151 §2.1.1 assumption 1]`
- **Dev data patching is an accepted way to create CIBO rows** the sandbox cannot
  produce (ShopeePay, SPayLater, PayLater by Grab): Shane, Jira EAINT-12107,
  2026-09-09 — "it's confirmed that we can disable any payment method by data
  patching". Patched rows prove display rules only. `[from Jira EAINT-12107]`

## Payment Mode column format — EAINT-12327 (2026-10-15)

The Transaction Listing (+ export) gains a Payment Mode column and the Payment
Report (+ export) changes its Payment Mode value to one format:
`<gateway> | <method> – <details>`, 7 strings covering BoldPay (TouchNGo,
FPX-Bank Name, MBBMGATE_MS) and Fiuu (ShopeePay / GrabPay, Full Amount – Single
Payment / BNPL – Installment). Full study: `knowledge/eauto-payments.md` § "CIBO
Payment Mode column format (EAINT-12327)". Tested together with EAINT-12107
(the "Fiuu - eWallet" filter group and the EW Payment Reference ID marker).
[source: SRD v1.0 2026-09-17; Jira EAINT-12327]

Gap to raise: the 7 strings have no Fiuu Credit/Debit Card or Fiuu FPX entry,
although Secarang pays card and FPX through Fiuu today; this affects 12107_TS07 /
TS08. `[from _reference/tickets/EAINT-12107/NOTES.md § Test script v0.2 item 4]`

**BoldPay is the Makrokiosk gateway, not a Secarang one.** Before EAINT-12327 the
CIBO Payment Report showed Payment Mode "Bold Pay" for **Makrokiosk** transactions,
"Fiuu" for Secarang on/after the cutoff, "RMS" for Secarang before it, and "RHB"
for eAuto. `[from SharePoint TS #129 EAINT-11541, sheet EAINT-11541, rows 3-10]`
So the BoldPay rows in 12327 (TouchNGo / FPX / MBBMGATE_MS) describe Makrokiosk
payments, which is why the EAINT-12107 SRD §2.2.2 does not list BoldPay on the
Secarang payment page. Supersedes the earlier open item "whether BoldPay is a second
live Secarang gateway is `[unconfirmed]`".

## Date fields — EAINT-12151 (deployed 2026-09-30, Yi Link Lim)

1. Filter: new **Date Range Type** dropdown under Platform with
   `Transaction Creation Date` (renamed from "Creation Date") and
   `Insurance Creation Date` (new). `[from SRD EAINT-12151 REQ-001/002]`
2. Listing: `Created Date` → **`Transaction Created Date`**; new
   **`Insurance Created Date`** between it and `UCD`, `DD-MM-YYYY HH:mm` when
   approved, `-` otherwise. `[REQ-003/004/005]`
3. **Insurance Created Date = payment date-time** (SRD assumption 3); dev: the
   insurance payment table's `last_updated_at`, not the JPJ-approved date.
   `[from Teams, 2026-08-20 12:17, Mong Guo Hao — via handoff 2026-09-28 EAINT-12151]`
   The SRD v0.3 change log reads: "Clarified Insurance Creation Date refers to
   Payment Date Time". `[from SRD EAINT-12151 v1.0 §1.3]` Business signed off keeping
   the date+time under the existing "Payment" column framing (Shamini, via Mei Jia
   Chee, 2026-08-27). `[from handoff 2026-09-28 EAINT-12151]`
4. Insurance Creation Date filter excludes rows with no such date. `[REQ-006]`
5. Export: `Created At` → `Transaction Created At`, new `Insurance Created At`
   right after it; Print carries the new column. `[REQ-007/008/009]`
6. Why: Transaction Listing listed by created date, Payment Report by insurance
   created date — the Business Owner could not reconcile them. `[SRD §2.2.2]`

Page-level detail (mockup DOM, column order, export header, open date-range
limit): [flow-cibo.md](flow-cibo.md).

## UCD columns — EAINT-12058 test script (executed state unknown)

Six rows: 12058_TS1 new eAuto row shows the full UCD Name; TS2 new Secarang row
shows `-`; TS3 creator ≠ payer (UCD Name = creator **assumed**, DB screenshot for
Full Name paid/last update and Login ID paid); TS4 pre-CR eAuto row backfilled;
TS5 User ID unchanged on listing and Payment Report; TS6 Payment Report UCD Name
regression (live since 11934). `[from TS: _reference/tickets/EAINT-12058/… .xlsx]`

## Live staging check — 12107 + 12327 (2026-10-16)

Captured from `https://staging.secarang.com/cibo` (testadmin) on 2026-10-16.
**12107 and 12327 were NOT yet pushed to staging at capture time** — Faizuddin,
2026-10-16: "that time actually didnt push yet. so all changes wasnt present
yet at that time". Everything below is the PRE-PUSH baseline (page structure,
selectors, existing values), not findings against the CRs. Recheck items 4-12
after the push. HTML in `_reference/html/cibo/` (login, transaction-management,
payment-management, payment-management-channel-dropdown, payment-report-loading).
`[verified: live HTML, staging, 2026-10-16]`

1. **Sidebar routes:** `/cibo/transaction-management`, `/cibo/payment-management`,
   `/cibo/payment-report` (also dashboard, user-account-management, crm,
   referred-risk-log, commission-report, visitor-management, agent-management,
   discount-management, macrokiosk-template-management).
2. **Login form:** Angular reactive form, `formcontrolname="loginId"` / `"pwd"`;
   Login button disabled until both filled.
3. **Filters** are `ng-select` (`formcontrolname` platform, insuranceComp,
   dateRange, status, jpjStatus, roadTax, discountCode on Transaction
   Management); date inputs are `ngbdatepicker` and `readonly`. Search =
   `button[type=submit]` "Search"; "Clear all"; Print and Export are
   `btn-outline-primary` buttons in the listing card. Pagination 20 per page.
4. **Transaction Listing has the Payment Mode column** (between Payment and
   Discount Code). Values seen on page 1: `-`, `Bold Pay`, `Fiuu`,
   `Fiuu | eWallet – GrabPay – Full Amount – Single Payment`,
   `Fiuu | eWallet – ShopeePay`. Older Fiuu card/FPX rows show bare `Fiuu`.
5. **Payment Report table has a Payment Mode column** (between Payment Ref ID
   and Payment To). Rows not seen: the list request never returned —
   `POST ins-api/v1/cibo/insurance-payment-report/main-page/summary` stayed
   pending > 60 s on three tries (17:21-17:27). Default window 15.09.2026 -
   16.10.2026.
6. **Payment Management, Payment Channel filter, group "Fiuu - eWallet":**
   `GrabPay`, `GrabPay - PayLater by Grab`, `ShopeePay`. **No SPayLater option.**
   12107_TS06 expects SPayLater too — raise with dev.
   **⚠️ AMENDED 2026-10-20:** no SPayLater option is correct — BA: "this filter is no
   longer valid: ShopeePay - SPayLater". See § "BA requirement update — 12107 + 12327
   (2026-10-20)". `[from Teams, EAINT-12107 CR chat, Yi Link Lim, 2026-10-20]`
7. **Payment Management listing** Payment Channel cell: `Fiuu eWallet ShopeePay`
   (BR69006072, Failed — already dev-patched) and `Fiuu eWallet GrabPay`
   (BR60006232, Paid).
8. **Transaction Management Export** with no filters (~7,900 rows) produced no
   file after 3+ minutes. Filter to a narrow range before exporting.
9. **Payment Channel group tick behaviour** (clicked live, 2026-10-16):
   ticking "Fiuu - eWallet" ticks every option under it; unticking one option
   (ShopeePay) also clears the group tick while the others stay ticked —
   answers the (Open) on 12107_TS06 step 19; clicking the group from that
   partial state RE-TICKS everything, a second click clears all. ng-select
   marks state with `aria-selected="true"` on `.ng-optgroup` / `.ng-option`.
10. **Payment Ref ID** for Fiuu e-wallet payments contains `EW`
    (`LON20261007SEW0001` GrabPay, `LON20261007SEW0002` ShopeePay).
11. **Payment Mode across 100 newest transactions** (2026-10-16): `-` (no
    payment, 10), `Bold Pay` (Pending, 1), `Fiuu` (Pending 11, Paid 66 — Fiuu
    FPX/card), `BoldPay | Online Banking – FPX` (Paid, 10 — no bank name),
    `Fiuu | eWallet – GrabPay – Full Amount – Single Payment` (BR60006232),
    `Fiuu | eWallet – ShopeePay` (BR69006072, Failed).
12. **Transaction Management export is CSV** (`Transaction_Management_<yyyyMMddHHmm>.csv`,
    UTF-8 BOM): line 1 title, line 2 blank, line 3 header. Payment Mode sits
    between `Discount Code` and `Payment Amount (RM)` — not between Payment
    and Discount Code as on screen. Sample:
    `_reference/tickets/EAINT-12327/EAINT-12327-staging-transaction-export-BR60006232-2026-10-16.csv`.
13. **Automation:** `scripts/eauto-12107/tests/cibo.spec.ts` + `pages/cibo/CiboPages.ts`
    (12107_TS06, 12327_TS10-TS18, workbook numbering). Refs typed on /eauto/12107 (CIBO_REF_*).
    **Blank ref = the run finds one (2026-10-19).** Faizuddin: the "BR…" boxes
    are "any values that the automation should decide by itself".
    `utils/ciboRefFinder.ts` opens Transaction Management, clicks Search,
    chooses 100 items per page and reads up to 5 pages from the newest end
    (Fiuu e-wallet, no-payment rows) and 5 from the oldest end via the last page
    number and « (pre-push, pre-Fiuu RMS rows); BoldPay and eAuto rows are read
    from both. It takes the first row whose Payment Mode / Payment badge /
    platform badge fits, logs the chosen ref as a DETAIL line, and leaves a kind
    blank (logged "not found") when nothing fits. A typed ref always wins.
    `[verified: scripts/eauto-12107/utils/ciboRefFinder.ts · RULES]`
    The dashboard pre-fills the CIBO staging login (testadmin). `[from QA team, 2026-10-19]`
    **Run live 2026-10-19** — page-size select, », « and the last-page click all
    work. Changes from that run: Platform = Secarang is ticked before reading the
    oldest Secarang rows (RMS), "existing" = a paid, insured Secarang Fiuu/BoldPay
    row created before 20-10-2026, eAuto / RMS / existing rows must be "Insurance
    created", and the choices are cached for the day in
    `scripts/eauto-12107/.cache/cibo-refs.json` so each dashboard TS doesn't read
    the listing again. `[verified: live run 2026-10-19]`

## Live run — 12107 + 12327 automation (2026-10-19)

CLI runs of `scripts/eauto-12107` against staging CIBO (testadmin), same env as
the dashboard. `[verified: live run 2026-10-19]`

1. **Payment cell text has no space before the badge**: innerText reads
   `RM884.48Paid 07-10-2026 10:20`, so a word-boundary regex on "Paid" never matches.
2. **The sidebar collapses to icons** after a wide listing is read; the link
   text is then hidden. Open menus by href (`nav a[href$="/cibo/payment-report"]`).
3. **Oldest rows are eAuto, 2022** (`B22002806 eAuto`, Payment Mode `RHB`, or
   `-` when unpaid). The 5 oldest pages hold only eAuto rows.
4. **Secarang before the Fiuu cutoff** shows Payment Mode `RMS`
   (`B23000131`, 31-03-2022) — matches EAINT-11541 above.
5. **Payment Report only lists insured transactions**: a paid 2022 RMS row with
   no insurance was "not listed" there.
6. **Payment Report is slow**: about 2 minutes per ref search, so a TS that
   searches 6 refs needs 12+ minutes. The 12107 run route cap is now 20 minutes.
7. **Payment Management export** calls the column `Payment Reference ID` (the
   page says `Payment Ref ID`); Payment Channel in the file reads
   `Fiuu eWallet | GrabPay` (page: `Fiuu eWallet GrabPay`).
8. **An empty Payment Management listing downloads no file** on Export.
9. **Not on staging in the newest/oldest 500 rows:** any SPayLater or PayLater
   by Grab transaction.
10. **Results against the TS (data on staging, not automation faults):**
    a. 12327_TS10, TS12, TS16: pass.
    b. 12327_TS11/TS14: BoldPay FPX shows `BoldPay | Online Banking – FPX` (no
       bank); BoldPay card shows `… – Mastercard`, TS expects `… – MBBMGATE_MS`;
       ShopeePay (BR69006072) shows `Fiuu | eWallet – ShopeePay` with no
       "– Full Amount – Single Payment".
    c. 12327_TS13: export column order `Discount Code | Payment Mode | Payment
       Amount (RM)` (same as item 12).
    d. 12327_TS14: 18 rows on Payment Report page 1 still show bare `Fiuu`.
    e. 12327_TS17: existing row BR69006078 (30-09-2026) shows bare `Fiuu` on
       Transaction Listing and Payment Report.
    f. 12327_TS18: eAuto B22002806 is `RHB` on the page but `RHB – eAuto` in
       the Payment Report export.
    g. 12107_TS06: GrabPay filter gives 6 rows; 4 Payment Ref IDs have no `EW`
       (`LON20260908SFX0002`, `LON20260908SFX0001`, `LON20260907SFX0011`,
       `LON20260907SFX0009`); "GrabPay - PayLater by Grab" gives 0 rows.

## Payment Report — always narrow by "Insurance Created From / Till" (2026-10-19)

1. **Rule:** before searching Payment Report, set **Insurance Created From** and
   **Insurance Created Till** to a window of **at most one week** around the target
   transaction's date. Faizuddin, 2026-10-19: "for payment report page, you will need
   to put 'insurance created from', because its taking too long because of a lot of
   record to call. so make sure to set not more than a week of a target date".
   `[from QA team, 2026-10-19]` Stricter than the general one-month limit in
   `eauto-date-range-max-one-month` — Payment Report uses one week.
2. **Why:** an unfiltered or one-month Payment Report search took about 2 minutes per
   ref on staging and pushed 12327_TS14 / TS15 past their time limit.
   `[verified: live run 2026-10-19]`
3. **Fields:** `input[formcontrolname="fromDate"]` ("Insurance Created From") and
   `input[formcontrolname="toDate"]` ("Insurance Created Till") — `ngbdatepicker`,
   `readonly`, so dates are picked in the calendar, never typed.
   `[verified: _reference/html/cibo/payment-report-loading.html]`
4. **Target date:** the transaction's "Insurance Created Date" (Transaction
   Management column). Planned window: From = that date, Till = 6 days later; for a
   page-wide check with no single ref, the 7 days up to today.
5. **Calendar (captured 2026-10-19):** both inputs start empty. Opening one shows
   ngb-datepicker with arrows "Previous month" / "Next month", `select[title="Select month"]`
   (values 1-12), `select[title="Select year"]` (2016-2036) and day cells
   `.ngb-dp-day[aria-label="Monday, October 19, 2026"]`. The two calendars limit each
   other — with Till on 9 Aug, From would not take September — so moving the window
   later means setting Till first. `[verified: _reference/html/cibo/payment-report-datepicker-open.html; live run 2026-10-19]`
6. **Window = the 7 days up to today (Faizuddin, 2026-10-19, later the same day):**
   "for the payment report. can you make it so that it will search for a week from the
   current date." Replaces the first version (a week from each ref's Insurance Created
   Date). `[from QA team, 2026-10-19]`
7. **Automation (applied 2026-10-19):** every Payment Report search in
   `scripts/eauto-12107` sets Insurance Created From = today - 6 days, Till = today
   (`utils/insuranceDates.ts · lastWeek`, `CiboPaymentReportPage.setInsuranceCreatedRange`).
   For TS that read Payment Report (12327_TS14-TS18) the ref finder only picks
   transactions insured in that week; an older ref (typed, or for a kind with no recent
   row) is logged "not checked — … before the one-week Payment Report window" and,
   where the TS needs it, fails with "type a newer ref". `[verified: live run 2026-10-19]`
8. **Consequence on staging, 2026-10-19:** only GrabPay Full Amount has a transaction
   insured in the last week (BR60006269); BoldPay TouchNGo / FPX / card, ShopeePay and the
   PayLater kinds have none, and 12327_TS18's eAuto (2022) and RMS rows can never fall in
   the window. Run: TS14 + TS16 + TS17 took 2.2 min; TS16 passed.
   `[verified: live run 2026-10-19]`

## Dev patch plan for the e-wallet rows (2026-10-19)

From dev, pasted by Faizuddin 2026-10-19 (verbatim): "ill suggest to patch the payment
method for these transactions to the following instead 1. dc752013-ccec-4c5f-a403-faadf5697402
- ShopeePay 2. 020bbb7c-322a-4b5d-ac43-59c10293eb2a - GrabPay PayLater (Full Amount)
3. ee435087-2054-4aa5-8fe6-753d7bfee06b - GrabPay PayLater (Instalment) ShopeePay Full
Amount and SPayLater cannot be differentiated (Fiuu confirmed), both will show as
ShopeePay. GrabPay Full Amount already got data on staging (TEST1234AB, LOL122)"
`[from dev, 2026-10-19]`

1. **The three transactions on CIBO** (transaction-details pages, read 2026-10-19 before
   any patch): `[verified: live CIBO staging, 2026-10-19]`
   a. dc752013… = **BR60006266**, HXA0007A, receipt 26101921300020 → to be ShopeePay.
   b. 020bbb7c… = **BR60006264**, HXA0016A, receipt 26101921300018 → to be GrabPay PayLater (Full Amount).
   c. ee435087… = **BR60006259**, TEST1111UD, receipt 26101921300016 → to be GrabPay PayLater (Instalment).
   All three were paid with GrabPay Full Amount on /ia on 2026-10-19.
2. **ShopeePay Full Amount and SPayLater show the same value** ("ShopeePay") — Fiuu
   cannot tell them apart. The 12327 TS strings that separate them cannot both hold.
3. **GrabPay Full Amount data already on staging:** vehicles TEST1234AB and LOL122.
4. **Not yet known:** the exact Payment Mode text the patched rows will show.
   **⚠️ AMENDED 2026-10-20:** BA confirmed the strings — see § "BA requirement update —
   12107 + 12327 (2026-10-20)".  `[from Teams, EAINT-12327 CR chat, Yi Link Lim, 2026-10-20]`

## TS changes and results after the dev patch (2026-10-19, evening)

1. **ShopeePay line merged** in 12327_TS11 / TS14 (repo workbook): one expected value
   `"Fiuu | eWallet – ShopeePay"` with "(Full Amount and SPayLater both show this — Fiuu
   cannot tell them apart)". Faizuddin: "update the TS line". `[from QA team, 2026-10-19]`
2. **Bare "Fiuu" is correct for Fiuu card and FPX** — Faizuddin, 2026-10-19: "it should
   show just Fiuu". 12327_TS14's last check now reads `No row shows "BoldPay" alone (Fiuu
   card and FPX rows show "Fiuu" only)`; 12327_TS17 picks an existing e-wallet or BoldPay
   row. `[from QA team, 2026-10-19]`
3. **12327_TS18 Payment Report window** = one week from each ref's own Insurance Created
   Date ("limit the range to 1 week only"); the other Payment Report TS keep the last 7
   days. `[from QA team, 2026-10-19]`
4. **Dev patch is live:** BR60006266 shows `Fiuu | eWallet – ShopeePay`; BR60006259 shows
   `Fiuu | eWallet – GrabPay – BNPL – Installment`. `[verified: live run 2026-10-19]`
5. **Run (TS11, TS14, TS17, TS18 — 4.3 min):** TS14 and TS17 pass; TS11 fails only on
   BoldPay FPX (no bank) and card ("Mastercard" vs "MBBMGATE_MS"); TS18 fails only on the
   eAuto export value `RHB – eAuto` vs `RHB` on the page. `[verified: live run 2026-10-19]`
6. **OneDrive workbook copy edited** 2026-10-19 once Excel was closed (same changes, format rules re-applied).

## 12107_TS06 after the dev patch, and the patched PayLater rows (2026-10-20)

1. **SPayLater has no filter option of its own** — Faizuddin, 2026-10-20: "both of them
   will show the same display". 12107_TS06 (both workbook copies + automation):
   a. Steps 9-11 (ShopeePay) also cover SPayLater transactions.
   b. Old steps 12-14 (tick "ShopeePay - SPayLater") replaced by step 12: open the
      Payment Channel filter; only `GrabPay`, `GrabPay - PayLater by Grab`, `ShopeePay`
      are listed.
   c. Old steps 15-20 renumbered 13-18; "all 4 options" → "all 3".
   `[from QA team, 2026-10-20]`
2. **Live run 12107_TS06 (2026-10-20):** step 12 passes (3 options). Still failing:
   a. GrabPay rows BR69005754/56/57/58 have Payment Ref IDs `LON2026090…SFX…` (no EW).
   b. BR60006259 (patched to PayLater by Grab, Instalment) shows Payment Channel
      `Fiuu eWallet GrabPay` under the "GrabPay - PayLater by Grab" filter — the patch
      changed Payment Mode only.
   c. "Fiuu - eWallet" group ticked lists `Online Banking RHB Bank` and `Online Banking CIMB Bank` rows.
   `[verified: live run 2026-10-20]`
3. **BR60006264 (patch: GrabPay PayLater, Full Amount)** shows Transaction Management
   Payment Mode `Fiuu | eWallet – GrabPay – Full Amount – Single Payment` — the same as
   a plain GrabPay Full Amount row. The SRD v1.0 §2.2.2 lists no PayLater Full Amount
   string (7 strings; GrabPay has only "Full Amount – Single Payment" and "BNPL –
   Installment"). `[verified: live CIBO staging, 2026-10-20]`
   **⚠️ AMENDED 2026-10-20:** this is the expected value. BA: GrabPay "Method 2: full
   amount next month (Pay later)" displays as `Fiuu | eWallet – GrabPay – Full Amount –
   Single Payment`. `[from Teams, EAINT-12327 CR chat, Yi Link Lim, 2026-10-20]`

## BA requirement update — 12107 + 12327 (2026-10-20)

Posted by the BA (Yi Link Lim) in both CR group chats on 2026-10-20. SRD not yet
updated: "Will update SRD accordingly." **Supersedes** the 7-string list in SRD
EAINT-12327 v1.0 §2.2.4 for the Fiuu e-wallet rows, and the "ShopeePay - SPayLater"
filter option in SRD EAINT-12107.

1. **EAINT-12107 chat, 09:54 (verbatim):** "Hi Everyone Received feedback from dev side
   that system unable to categories pay later & full payment due to insufficient
   information in shopeepay response. Hence, this filter is no longer valid: ShopeePay -
   SPayLater / Will update SRD accordingly."
   `[from Teams, EAINT-12107 CR chat, Yi Link Lim, 2026-10-20 09:54]`
2. **EAINT-12327 chat, 09:48, edited (verbatim):** "Hi Everyone Received feedback from
   dev side on below items: 1. shopeepay unable to categories pay later & full payment
   -> Filter for shopeepay change to: Fiuu | eWallet – ShopeePay 2. Grabpay - able to
   receive response for 3 payment method a. Fiuu | eWallet – GrabPay – Full Amount –
   Single Payment Method 1: full amount Method 2: full amount next month (Pay later)
   b. Fiuu | eWallet – GrabPay – BNPL – Installment Method 3: installment Will update
   SRD accordingly." `[from Teams, EAINT-12327 CR chat, Yi Link Lim, 2026-10-20 09:48]`
3. **Payment Mode strings now in force (Fiuu e-wallet):**
   a. ShopeePay (Full Amount and SPayLater alike): `Fiuu | eWallet – ShopeePay`.
      The two old strings `… – ShopeePay – Full Amount – Single Payment` and
      `… – ShopeePay – BNPL – Installment` are dropped.
   b. GrabPay full amount **and** GrabPay PayLater (full amount next month):
      `Fiuu | eWallet – GrabPay – Full Amount – Single Payment`.
   c. GrabPay instalment: `Fiuu | eWallet – GrabPay – BNPL – Installment`.
   `[from Teams, EAINT-12327 CR chat, Yi Link Lim, 2026-10-20]`
4. **Payment Channel filter:** "ShopeePay - SPayLater" is no longer a valid option.
   Matches staging (group "Fiuu - eWallet" = `GrabPay`, `GrabPay - PayLater by Grab`,
   `ShopeePay`). `[from Teams, EAINT-12107 CR chat, Yi Link Lim, 2026-10-20; verified: live run 2026-10-20]`
5. **Inference, not stated:** GrabPay PayLater Full Amount (Method 2) shares the
   Single Payment string, so it cannot be told apart from a plain GrabPay Full Amount
   row on Payment Mode. Whether "GrabPay - PayLater by Grab" filter covers Method 2,
   Method 3 or both was **not** stated. `[inference]`
6. **Not addressed by the BA update** (still open as before): BoldPay FPX bank name /
   `MBBMGATE_MS` vs "Mastercard", bare `Fiuu` for Fiuu card/FPX, `EW` in Payment Ref
   ID, `RHB – eAuto` export value, export column order.
7. **Other context, same chats:** deployment targeted Wednesday 21.10.2026 morning
   (Mei Jia Chee, 2026-10-19 08:17, both chats); BA asked QA (2026-10-20 09:26) to
   update the Jira status and say when the ticket is ready for walkthrough. The
   12107 chat name now reads "Enhance Payment Gateway to Enable SPAY Later and
   PayLater by Grab". `[from Teams, EAINT-12107 / EAINT-12327 CR chats, 2026-10-19/20]`

## SRD updates 2026-10-20 (12107 v1.2, 12327 v1.1)

1. **12107 v1.2:** only REQ-012 changed. "d. ShopeePay - SPayLater" is struck
   through; AC "Ticking Fiuu - eWallet ticks all 3 sub-options." Note added: "Fiuu
   does not return whether the payment is installment or full."
   `[source: SRD_EAINT-12107_v1.2_20261020.docx §2.2.7, Change Log #23]`
2. **12327 v1.1:** 6 strings (ShopeePay one value "Fiuu | eWallet – ShopeePay");
   new REQ-008: GrabPay "Full amount" and "Full amount next month (Pay later)" →
   "Full Amount – Single Payment"; "Installment" → "BNPL – Installment".
   `[source: SRD_EAINT-12327_v1.1_20261020.docx §2.2.4 REQ-001, REQ-008]`
3. Unchanged: BoldPay FPX-Bank Name / MBBMGATE_MS strings, export column position
   (REQ-005), Payment Report export = page (REQ-007). 12107 §2.2.8 still lists
   ShopeePay as "Not able to test" in the Fiuu sandbox, although the simulator works
   (12107_TS02 passed 2026-10-20). Extract:
   `_reference/tickets/EAINT-12107/EAINT-12107-12327-SRD-changes-2026-10-20.md`.

## Listing race: the first, unfiltered load can overwrite a filtered search (2026-10-20)

1. Opening a CIBO listing starts a slow unfiltered load (Payment Management: 222
   pages). Ticking a filter and clicking [Search] before it finishes sends the
   filter correctly (`"paymentChannelList":["FIUU_SHOPEEPAY"]`), but the
   unfiltered answer can land last and replace the filtered rows on screen. The
   export still uses the filter, so the page and the file then disagree.
   `[verified: live probe 2026-10-20, request/response log]`
2. 12107_TS06 failed on this on 2026-10-20 ("GrabPay" filter showed ShopeePay and
   RHB rows). Automation fault, not a CIBO defect a person would see. Fix:
   `CiboListingPage.clickSearch()` waits until no CIBO API call is open (own
   tracker, `waitForQuiet`) before and after the click; Playwright's
   'networkidle' does not cover calls made after page load. Re-run: filters
   correct (GrabPay 15 rows, ShopeePay 10, PayLater by Grab 1).
3. Left after the fix (real data): GrabPay rows BR69005754/56/57/58 (07-08 Sep
   2026) carry `SFX` not `EW` in Payment Ref ID; BR60006259 under "GrabPay -
   PayLater by Grab" shows Payment Channel "Fiuu eWallet GrabPay".
4. Payment Management, 2026-10-20: BR69006045 = "BoldPay Online Banking - FPX"
   (Payment Ref ID LON20260929SFX0001, Secarang-MK); BR68005689 = "BoldPay
   Credit/Debit Card - Mastercard"; BR67005660 = "BoldPay eWallet - TouchNGo".
   None carries a bank name. `[verified: live probe 2026-10-20]`
5. Failure screenshots: `BasePage.captureIssue()` saves `<label>-ISSUE.png` with
   a red box + caption on the cell at fault (Faizuddin, 2026-10-20).

## FPX Payment Mode = Fiuu, not BoldPay (2026-10-20)

1. Faizuddin, 2026-10-20: "Confirmed - It will bi Fiuu / To check - If will display Fiuu
   only, or Fiuu with bank name / but confirmed that the display is Fiuu, not boldpay".
   `[user, 2026-10-20]` Overrides the SRD line "BoldPay | Online Banking – FPX-Bank
   Name" (SRD 12327 v1.1 REQ-001 Example 1b) for testing.
2. Live 2026-10-20: BR60006293 (12107_TS08, Online Banking RHB Bank,
   LON20261020SFX0016) shows Payment Mode "Fiuu" on Transaction Listing — no bank name.
   `[verified: live run 12327_TS12, 2026-10-20]`
3. Automation: kind `fiuuFpx` (dashboard "Fiuu FPX (12107_TS08)", env CIBO_REF_FIUU_FPX)
   replaces `boldPayFpx`; blank = picked on Payment Management (paid, platform exactly
   "Secarang", channel "Online Banking …", SFX ref). Expected `/^Fiuu(?:\s|$)/` — "Fiuu"
   alone or with a bank passes until confirmed; the run logs which.
4. TS (12327_TS12 / TS15 rows 24 / 27): `"Fiuu" for FPX (Open)`; 12327_TS12 uses
   12107_TS08 for FPX.
5. **SA format, 2026-10-20** (Teams, relayed by Faizuddin): "As spoken, added Fiuu - FPX
   display format for Secarang payment method ya: Fiuu | Online Banking – FPX-Bank Name".
   Supersedes item 1's "Fiuu only or with bank" question. Live today BR60006293 still
   shows "Fiuu" → defect raised to dev. Automation expects
   `/^Fiuu \| Online Banking – FPX-\S/`; TS rows 18 (TS08 Payment Report), 24, 27 updated.
   Raised as QA-Issue EAINT-12566 (On Hold, 2026-10-20).

## EW in Payment Reference ID applies to new data only (2026-10-20)

1. Dev answer, relayed by Faizuddin 2026-10-20: "yes, existing data will not change. only
   new data will". GrabPay rows BR69005754/56/57/58 (paid 07-08 Sep 2026) keep "SFX".
   `[user/dev, 2026-10-20]`
2. 12107_TS06 now checks EW only for payments dated from 2026-09-11 (SRD 12107 v1.1, which
   added REQ-014); older rows are logged as expected. Re-run 2026-10-20: EW check passes;
   TS06 still fails only on BR60006259's Payment Channel ("Fiuu eWallet GrabPay" under the
   PayLater by Grab filter) — open question to dev.
3. SRD 12107 §2.2.7 (REQ-011–013) governs filter tick behaviour only (tick "Fiuu - eWallet"
   → all 3 nested ticked; untick one → only that one clears, parent unticks, other 2 stay).
   It does not define the Payment Channel text in results; BR60006259's "Fiuu eWallet
   GrabPay" under the PayLater by Grab filter is sourced to TS05 only. `[user, 2026-10-20]`

## SRD 12327 v1.1 re-uploaded with the Fiuu FPX line (2026-10-20 15:05)

1. Jira EAINT-12327 attachments 160646 (pdf) / 160647 (docx) replace the 12:59 v1.1 copy.
   Revision 1.1 now reads "a. Updated ShopeePay and Fiuu online banking display values."
   §2.2.2 item 7 and REQ-001 Example 2 d. add "Fiuu | Online Banking – FPX-Bank Name".
   `[source: SRD_EAINT-12327_v1.1_20261020 (re-upload), highlighted blue]`
2. So EAINT-12566's expected value is now in the SRD, not only the SA's Teams note.
3. Run 2026-10-20 16:48: 12327_TS19 still fails only on B22002806 Payment Report export
   "RHB – eAuto" vs page "RHB" (REQ-007, page 14 of the re-uploaded PDF).
4. **"RHB – eAuto" in the Payment Report export is existing behaviour — pass.** Faizuddin,
   2026-10-20: "RHB - eAuto -- considered pass. this is the existing behaviour". 12327_TS19
   now accepts "<page value>" or "<page value> – eAuto" in that export. `[user, 2026-10-20]`
5. **PayLater by Grab rows show Payment Channel "Fiuu eWallet GrabPay" — pass.** Faizuddin,
   2026-10-20: "we will accept this behaviour as pass". Basis: dev, Teams EAINT-12107
   2026-09-03 19:06 "paylater by grab are not separate payment channels"; the filter
   matches on Fiuu's grabpay_indicator. 12107_TS06 steps 6-8 accept "Fiuu eWallet GrabPay"
   or "Fiuu eWallet GrabPay - PayLater by Grab". `[user, 2026-10-20]`
