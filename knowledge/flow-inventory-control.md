# Shopping Cart Inventory Control — Stock In, Stock Out, Report, Dashboard (flow)

**Draft — not yet walked on a live environment (2026-10-26).** Every behaviour
line below comes from Jira, Miro or Teams. Nothing here was clicked, captured or
confirmed on staging. No DOM handle is recorded because no page or mockup HTML is
in the repo.

Tickets: **EAINT-12099** "🔴[eAuto-BackOffice] Shopping Cart - To Create Inventory
Control Module" (Phase 1) and **EAINT-12635** "Inventory Control Phase 2"
(leftovers). BackOffice module, plus one UCD change (available stock on Biometric
Device Purchase).

Tag used on every behaviour line: `[unconfirmed — from <source>, not seen live]`.

## 0. Source status

1. **SRD v1.1 is NOT in the repo.** Latest attachment on EAINT-12099 is
   "SRD_EAINT-12099_v1.1_20261009.docx/.pdf", Jira version-table remark:
   "Combined Stock In, Stock Out and Dashboard SRD; updated per Ops feedback and
   Dev corrections". Not found in the repo, `_reference/inbox/`, Downloads or
   OneDrive. `[from _reference/tickets/Studying/EAINT-12099/EAINT-12099-study.md §2 item 6]`
2. **Mockup NOT in the repo:** "Mock Up_EAINT-12099_BackOffice Portal_20261009.html".
   Older mockups also only on Jira: "Inventory_Control_Report_V1_20260820.html",
   "Stock_In_Flow_V1_03092026.html", "Stock_In_Flow_Dashboard_V1_11092026.html".
   `[same file, §2 attachment list]`
3. Sources actually read: Miro card (board "eAuto - QA Resource Planning",
   column "5TH NOV DEPLOYMENT", captured 2026-10-26,
   `_reference/tickets/Studying/_miro-board-capture-2026-10-26.md` lines 679-728);
   Teams CR group export `_reference/teams/EAINT-12099-11881-11882-Shopping-Cart.md`
   (to 2026-10-16); Teams sweep
   `_reference/tickets/Studying/EAINT-12099/EAINT-12099-teams-since-2026-10-16.md`;
   Jira fields via the study file (0 comments).
4. **Action:** drop SRD v1.1 and the 20261009 mockup into
   `_reference/tickets/Studying/EAINT-12099/`, then re-check every line here.

## 1. Why this flow matters

1. Phase 1 Shopping Cart (EAINT-10960 / 11880) left stock tracking manual:
   "means only software installation + biometric purchase transactions only? whole
   stock in stock out device tracking manual for current phase?"
   `[from Teams EAINT-12099 group, 2026-07-10 15:57, Lim Xiwei (dev)]` — answered
   "Inventory next round ya as per discussed yesterday"
   `[same, 2026-07-10 16:01, Batrisyia Hasanah (BA)]`.
2. The UCD "available stock" number on Biometric Device Purchase depends on this
   module. Existing defect pattern: "I stocked in the 1 unit of dermalog in BO ady,
   however in UCD side it still displays 0 units in stock even after refresh."
   `[from Teams EAINT-12099 group, 2026-07-10 15:52, Chin Teck Yung]`
3. Shares data with BDP shipping, DO generation and serials — see
   [flow-device-purchase.md](flow-device-purchase.md) and
   [flow-service-hub.md](flow-service-hub.md).

## 2. Entry points and pages

All from the Miro card "New Pages" list, verbatim. `[unconfirmed — from Miro card EAINT-12099, captured 2026-10-26, not seen live]`

| # | Page (Miro wording) |
|---|---|
| 1 | "BackOffice > Service Hub > Inventory Control Report (search & filter panel, 18-column listing)" |
| 2 | "BackOffice > Service Hub > Stock In Request" |
| 3 | "BackOffice > Service Hub > Stock Out Request" |
| 4 | "BackOffice > Service Hub > Inventory Control Dashboard" |
| 5 | "UCD > Biometric Device Purchase (available stock only)" |

Left menu change: "Left menu - new Service Hub section, existing BDP & SI link
moved out of the Proforma Invoice / e-Invoice box". `[unconfirmed — from Miro card EAINT-12099, not seen live]`
Cross-check against [flow-bo-shell.md](flow-bo-shell.md) menu map once live.

Mobile: Stock In is "QR-based mobile scanning" `[unconfirmed — from Jira EAINT-12099 SRD version table, v0.2 18.08.2026, via study §7 item 2, not seen live]`;
"Phone scan limits - 2,000 scans / 32 characters" `[unconfirmed — from Miro card EAINT-12099, not seen live]`.

## 3. Flow steps

### 3a. Stock In

1. Ops scans units into a Stock In batch. "Ops scans Dermalog box, not device".
   `[unconfirmed — from Teams EAINT-12099 group, 2026-07-09 18:17, Batrisyia Hasanah, summary item 8; not seen live]`
2. "Flow: scan all units → show in listing". `[same source]`
3. Each scan saves at once: "Every scan on Stock In and Stock Out is saved straight
   away (auto save), so there is no Save button."
   `[unconfirmed — from Teams EAINT-12099 group, 2026-09-29 08:49, Lim Xiwei (dev), not seen live]`
4. Partial match branch: "Partial match e.g. 80 uploaded, 79 match, 1 mismatch
   (wrong serial) → BO can edit serial, save 79 first".
   `[unconfirmed — from Teams EAINT-12099 group, 2026-07-09 18:17, BA summary item 8; not seen live]`
5. Discard: "Stock In Discard removes only the selected rows, not the whole batch."
   `[unconfirmed — from Teams EAINT-12099 group, 2026-09-29 08:49, dev; not seen live]`
6. Ops sign-off: "To update, Ops given greenlight for Stock In SRD ya"
   `[from Teams EAINT-12099 group, 2026-09-04 15:56, Batrisyia Hasanah]`.

### 3b. Stock Out

All from one dev message. `[unconfirmed — from Teams EAINT-12099 group, 2026-09-29 08:49, Lim Xiwei (dev), not seen live]`

1. "One row per device unit."
2. Columns: "# · Reference No. · UCD · ROC · Serial No. · Scan Date · Scanned · Action".
3. "Action is a "Scan Barcode" link. Each scan is assigned to its own row."
4. "One "Submit Stock Out Request" button completes every order whose rows are all scanned."
5. Branch: an order with any unscanned row is not completed by Submit (inferred from item 4). `[unconfirmed — inference]`

### 3c. Inventory Control Report

1. "search & filter panel, 18-column listing". `[unconfirmed — from Miro card EAINT-12099, not seen live]`
2. "The Reference No. popup on the Inventory Control Report is removed. Reference No.
   is plain text." `[unconfirmed — from Teams EAINT-12099 group, 2026-09-29 08:49, dev; not seen live]`

### 3d. Inventory Control Dashboard

1. "Year filter, 7 columns, colour coding, last-updated note".
   `[unconfirmed — from Miro card EAINT-12099, not seen live]`
2. "Safe Level % formula and the colour that follows it". `[same]`
3. Formula, per dev: "BF vs Safe Level (%) formula in SRD is incorrect should be
   BF ÷ (Stock Opening + Stock IN) × 100."
   `[unconfirmed — from Teams EAINT-12099 group, 2026-09-29 08:49, dev; SRD v1.1 (2026-10-09) may differ; not seen live]`
4. Refresh: "6:00 AM refresh + low-stock email (fires once per drop - stock must
   recover above 30% and fall again to retest)". `[unconfirmed — from Miro card EAINT-12099, not seen live]`
5. History: the dashboard was once out of scope — "Inventory Dashboard • Excluded
   this round, later phase" `[from Teams EAINT-12099 group, 2026-07-09 18:17, BA summary item 9]`.
   Superseded: SRD v1.1 is "combination of stock in, stock out and dashboard"
   `[from Teams EAINT-12099 group, 2026-10-08 17:08, Mei Jia Chee]`.

### 3e. UCD available stock (Biometric Device Purchase)

1. "Paid-but-not-shipped units now count as taken". `[unconfirmed — from Miro card EAINT-12099, not seen live]`
2. Dev wording: "In the UCD portal, available stock counts units on paid orders as
   already taken, even if their Stock Out is not completed."
   `[unconfirmed — from Teams EAINT-12099 group, 2026-09-29 08:49, dev; not seen live]`
3. "Stock checked at order and re-checked before the card is charged".
   `[unconfirmed — from Miro card EAINT-12099, not seen live]`
4. Branch: stock runs out between order and charge — expected message not known (SRD needed).

## 4. Emails and notifications

1. Low-stock email recipient: "regarding the notification email when dermalog under
   safe limit can send to this email ya: operation@eauto.my"
   `[unconfirmed — from Teams EAINT-12099 group, 2026-09-28 11:16, Mei Jia Chee (BA lead), not seen live]`
2. Trigger and time, version A (Teams): "When the current month's Safe Level is below
   30%, an email goes to operation@eauto.my daily at 08:00. Email content is pending."
   `[unconfirmed — from Teams EAINT-12099 group, 2026-09-29 08:49, dev; not seen live]`
3. Trigger and time, version B (Miro): "6:00 AM refresh + low-stock email (fires once
   per drop - stock must recover above 30% and fall again to retest)".
   `[unconfirmed — from Miro card EAINT-12099, captured 2026-10-26, not seen live]`
4. **Conflict — kept both:** 08:00 (Teams) vs 6:00 AM (Miro); "daily" vs "once per
   drop". SRD v1.1 (2026-10-09) is newer than the Teams message (2026-09-29) and
   should settle it. Not resolved.
5. Email body: "Email content is pending" (2026-09-29). No template seen.
6. Cron context: "eauto-cron 1:00 AM must keep working alongside three new 6:00 AM
   behaviours" `[unconfirmed — from Miro card EAINT-12099, Regression list, not seen live]`.
   The three 6:00 AM behaviours are not named anywhere read.

## 5. Business rules and cross-cutting

1. Permission matrix: "Permission matrix - Ops / CSE / Finance / IT".
   `[unconfirmed — from Miro card EAINT-12099, not seen live]`
2. Stock Out access: "Stock Out access also includes eautonurul, the same Ops list
   as Stock In. The SRD left her out." `[unconfirmed — from Teams EAINT-12099 group, 2026-09-29 08:49, dev]`
3. Phase 1 Ops-only list for Biometric Purchase (the likely Ops list; not confirmed
   to be the Inventory list): "kmcheah, jasons, mfared, nikmuhamad, eautosoyeng,
   eautokelvin, eautonurul, eautozara, mfizni"
   `[unconfirmed — from Teams EAINT-12099 group, 2026-07-09 18:17, BA summary item 11]`
4. Concurrency: "Concurrency - 2 Ops on one batch, simultaneous Upload, stale page". `[unconfirmed — from Miro card]`
5. Messages: "47 message strings - asserted literally" — list is in SRD v1.1, not in repo. `[unconfirmed — from Miro card]`
6. Audit log: "Audit log - user, action, Reference No., result". `[unconfirmed — from Miro card]`
7. Device scope Phase 1: Dermalog only. Iris, manual purchase, reserve unit go to
   EAINT-12635 (see §8). Refurbished and damaged units: "Refurbished and damaged units
   phase 2 only handle." `[unconfirmed — from Teams EAINT-12099 group, 2026-09-29 08:49, dev]`

## 6. Regression areas named

Verbatim from the Miro card "Regression" list `[unconfirmed — from Miro card EAINT-12099, not seen live]`:

1. "BO > Update Shipping Details"
2. "BO > Delivery Status state machine"
3. "BO > Delivered closes the service request and re-issues its payment report"
4. "BO > BDP & SI Listing"
5. "BO > listing export (carries device serials today)"
6. "BO > DO template + 20-row split from EAINT-12166"
7. "UCD > BDP Receipt page"
8. "eauto-cron 1:00 AM must keep working alongside three new 6:00 AM behaviours"

Effort: "Est. Testing Mandays: 7 days (1 QA)", "~250 TS". `[from Miro card EAINT-12099]`

## 7. Preconditions and test data (planned, not proven)

1. Paid BDP orders to stock out — arrange via `arrangeBdpReferenceViaUCD`
   `[verified: knowledge/flow-service-hub.md §9 item 3 names it]`.
2. Unique device serials — `tests/service-hub/utils/serials.ts` `[from flow-service-hub.md §8]`.
3. Phone or scanner for QR/barcode scan. 2,000-scan / 32-character limits to test.
4. Mailbox for operation@eauto.my on staging (Mailtrap — see [mailtrap.md](mailtrap.md)).
5. Stock level control: push current-month Safe Level below 30%, recover, drop again.
6. Cron trigger for the 6:00 AM (or 08:00) job — needs dev help. `[inference]`
7. Accounts for Ops, CSE, Finance, IT; two Ops sessions for concurrency.

## 8. EAINT-12635 — Phase 2 leftovers

1. Split decision, verbatim: "Everyone, just to update that for this Inventory Control
   we will break into 2 tickets, Ticket 1: EAINT-12099 arrangement: To proceed arrange
   deployment, push to prod first. let Ops team to use whatever already discussed
   before Ticket 2: EAINT-12635 for those items that did not cover in EAINT-12099 will
   be in this new EAINT tickets."
   `[from Teams EAINT-12099 group, 2026-10-26 10:16, Mei Jia Chee]`
2. Scope: Manual Purchase, Reserve Unit, Iris Scanning — "Deferred from Phase 1 so
   deployment can proceed with what IT has already developed."
   `[from Jira EAINT-12635 description #4, #6, via EAINT-12099-study.md §3 item 7]`
3. Manual purchase origin: "existing biometric listing - we support manual purchase
   device or not ya? / as Nurul told me that might have the chance ops team will need
   to proceed to delivery the device for those ucd that not go thru service hub module ya"
   `[from Teams EAINT-12099 group, 2026-10-14 10:16, Mei Jia Chee]`; dev answer "nope" (study §9 item 9).
4. Iris origin: "need ur help to research and work on it how to scan stock in and stock
   out for the Iris device ya. also wan to let u know that by 03.11 the device will
   pulang back ad yaa" `[from Teams EAINT-12099 group, 2026-10-13 16:55, Mei Jia Chee]`.
5. Refurbished / damaged units: Phase 2 per dev (2026-09-29). Not confirmed as part of 12635.

## 9. Open conflicts and questions

1. **Low-stock email time:** 08:00 daily (Teams 2026-09-29) vs 6:00 AM once-per-drop (Miro 2026-10-26). Check SRD v1.1.
2. **Safe Level formula:** dev says SRD formula wrong (2026-09-29); SRD v1.1 (2026-10-09) may have fixed it.
3. **Email content** "pending" — final template unknown.
4. **47 message strings** — need SRD v1.1.
5. **Test environment** not set: dev "Do let me know which env and when to deploy ya"
   (2026-10-12 16:09); BA "we yet to target when to deploy this ticket" (2026-10-21 10:34).
6. **QA owner** empty in Jira and Miro.
7. **Jira status** "REQ REVIEW IN PROGRESS - EAUTO" while Fix Version is S35.X-20261105 (5 Nov) `[from Jira changelog via EAINT-12099-jira-comments.md]`.
8. **Which three 6:00 AM behaviours** (Miro regression line 8).
9. **Iris / manual purchase / reserve unit** out of 5 Nov scope — confirmed by the split, but confirm the TS list drops them.

## 10. Related tickets

1. EAINT-10960 / EAINT-11880 — Shopping Cart Phase 1 (SI, BDP).
2. EAINT-12166 — DO generation, 20-row split; EAINT-12167 — Device SN capture. See [flow-device-purchase.md](flow-device-purchase.md) (states 12099 is "explicitly **not** on this branch").
3. EAINT-12635 — Phase 2 (To Do, linked 2026-10-26).
4. EAUTO-857, CCB-878 — external links in the changelog.

## 11. Not covered

1. Any DOM handle, URL or page HTML.
2. SRD v1.1 content: field lists, the 18 report columns, the 7 dashboard columns, colour thresholds, messages.
3. Finance and IT role behaviour.
