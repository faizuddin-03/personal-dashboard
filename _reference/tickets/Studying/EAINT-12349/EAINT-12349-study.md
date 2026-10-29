# EAINT-12349 — study (2026-10-27)

## Header

1. **Title (verbatim, Jira):** "🔴[eAuto-UCD & BackOffice] Service Hub: Display Full Shipping Address and Allow OPS to Select Delivered Date in Biometric Device Purchase"
2. **Jira status:** **REQ REFINEMENT IN PROGRESS -EAUTO** (Task). Updated 2026-10-27 11:02.
3. **Priority:** Medium.
4. **Fix version:** none. Labels: "260914-260918", "ProductBacklog", "September2026".
5. **QA (Jira cf[10041]):** **empty**.
6. **BA:** Chee Mei Jia (assignee, reporter, and uploader of both SRDs). [unconfirmed — BA role inferred from SRD authorship]
7. **Dev:** not named anywhere read.
8. **Exp. Deploy Date (cf 10087):** empty. **ETA for Testing (cf 10057):** empty.
9. **Test env:** **not stated.** [unconfirmed] staging `/eauto` instance per standing note (from 2026-10-21); confirm when the ticket moves.
10. **Links / sub-tasks / parent:** none. **Comments:** 0.
11. **Created:** 2026-09-17 08:40.

## Sources read

1. `EAINT-12349-jira.md` — Jira capture by the Jira Scout, 2026-10-27 11:43: fields, description, SRD table, 0 comments, 2 attachments.
2. **SRD v0.1** `SRD_EAINT-12349_v0.1_20261023.docx` (22,008 bytes) — **NOT READ** (.docx cannot be read by this agent).
3. **SRD v0.2** `SRD_EAINT-12349_v0.2_20261027.docx` (23,399 bytes, latest) — **NOT READ** (.docx). Only its change remarks in the Jira SRD table are used below. **Drop a PDF export of v0.2 into this folder for a full study.**
4. **Enhancement request document dated 08.09.2026** (cited in Jira description row 6) — **not in the repo, not read.**
5. `_reference/tickets/EAINT-12349/` — **does not exist.**
6. `_reference/teams/` — **no file name or content mentions EAINT-12349.**
7. `knowledge/` — **no mention of EAINT-12349.** Read for context: `knowledge/flow-device-purchase.md` (lines 1-828 of 1730), `knowledge/flow-service-hub.md` §5.4, §5.9-5.13, `knowledge/eauto-service-hub.md` (BDP rules, BO details rules), `knowledge/cr-ledger.md` §EAINT-12095, `knowledge/flow-inventory-control.md` §6.
8. `lib/ticketStudies.ts` — **no entry for EAINT-12349.**
9. Live capture `_reference/tickets/EAINT-12166/EAINT-12166-ucd-bdp-purchase-selection-step-uat1-2026-09-23.html` (UCD BDP step 1, pre-change baseline).

## What changes

1. **Portal (Jira description row 1, verbatim):** "- UCD - BackOffice".
2. **Module (row 2, verbatim):** "Service Hub > Biometric Device Purchase".
3. **Request (row 3, verbatim):** "- Display full shipping address including postcode and area when "Ship to showroom address" is selected. - Allow OPS to select delivered date when updating delivery status."
4. **Existing issue (row 4, verbatim):**
   1. "Shipping Address: for records where "Ship to showroom address" is selected, displayed address does not include postcode and area in some cases, and address shown does not tally with backend record."
   2. "Delivered Date: delivery date in Update Shipping Details is fixed to ship-out date, so OPS cannot record actual delivered date."
5. **Expected new behaviour (row 5, verbatim):**
   1. "Shipping Address: full address displayed including postcode and area when "Ship to showroom address" is selected."
   2. "Delivered Date: OPS able to select delivered date while updating delivery status in Update Shipping Details."
6. **Additional note (row 6, verbatim):** "Refer to enhancement request document dated 08.09.2026 for screenshots of Selection page and Update Shipping Details popup."
7. **Where (from repo knowledge, not from the SRD):** [unconfirmed — SRD Affected Pages not read]
   1. **UCD BDP step 1 Selection** (`purchase.do`) — `#shipToShowroom` checkbox + `textarea#deliveryAddress` (one field, readonly while ticked). `knowledge/flow-service-hub.md` §5.4.
   2. **UCD Submission page** — "Shipping Address:" line. §5.10.
   3. **UCD Service Request Details** — "Delivery Date:" and "Shipping Address:" rows. §5.9.
   4. **BO Service Request Details** — static shipping table + **Update Shipping Details** popup (`#op-ship-date`, hidden `#op-ship-address`). §5.13.
   5. **BO BDP & SI Listing** — "Delivery Date" column and Delivery Date From/To filters. §5.11.

## Requirements (SRD v0.2 — change remarks only)

SRD body not read. The Jira SRD table row 2 (27.10.2026, v0.2) lists, verbatim:

1. "Split shipping address into separate fields"
2. "Added field specs and acceptance criteria"
3. "Confirmed showroom address prefill"
4. "Default address handling remains as existing"
5. "District set as mandatory"
6. "Added delivered date picker rules"
7. "Labels: Ship Out Date & Delivered Date"
8. "No revert once marked Delivered"
9. "Pending: delivered date picker range"

SRD table row 1 (23.10.2026, v0.1, verbatim): "Initial Draft".

## New vs existing behaviour

1. **Existing (UCD step 1):** one readonly `textarea#deliveryAddress` while "Ship to showroom address" is ticked; ticked by default. `[verified: EAINT-12166 selection-step capture, lines 111-118]` The captured textarea is empty in the pasted HTML. [unconfirmed — likely filled by JS after load]
2. **New (UCD step 1):** address split into **separate fields**, showroom address **prefilled**, **District mandatory**. `[from Jira SRD table v0.2]` Field names and order not known. [unconfirmed]
3. **Existing (BO popup):** one Delivery Date field `#op-ship-date` (`dd-mm-yy`). Once Arranged, "Delivery Date and Consignment Number are locked and only Arranged → Delivered remains". `[from knowledge/eauto-service-hub.md "BO details page rules" #3, citing SRD EAINT-11880 v1.2 §2.3.2.6 #3.8]` Jira row 4 calls this "fixed to ship-out date".
4. **New (BO popup):** two labels, **"Ship Out Date"** and **"Delivered Date"**; Ops picks the Delivered Date when moving to Delivered. `[from Jira SRD table v0.2 + description row 5]`
5. **Unchanged:** "No revert once marked Delivered" — matches existing rule that Delivered is terminal and the Update button disappears. `[from knowledge/flow-device-purchase.md, "Delivery Status is a three-state chain"]`
6. **Unchanged:** "Default address handling remains as existing" — i.e. the non-showroom (typed) address path. [unconfirmed — meaning of "default address" not stated]

## Where this ticket changes or contradicts repo knowledge

1. `knowledge/flow-service-hub.md` §5.4 — the single `textarea#deliveryAddress` will become **separate fields**. Selectors and the page object `pages/BiometricPurchasePage.ts` (`deliveryAddress` param) will go stale.
2. `knowledge/flow-service-hub.md` §5.13 and `flow-device-purchase.md` — popup has **one** `#op-ship-date`; this ticket adds a second date (Ship Out vs Delivered). `DevicePurchaseDetailsPage.setDeliveryDate()` will need a target for each.
3. `knowledge/eauto-service-hub.md` BO rule #3 — "Delivery Date ... locked" once Arranged. After this ticket, Ship Out Date stays locked [unconfirmed]; **Delivered Date becomes selectable** at the Arranged → Delivered step.
4. Update-shipping API (`POST .../biometric/update-shipping.do`) has **one** `deliveryDate` and **one** `shippingAddress` param today `[from knowledge/flow-service-hub.md line 161]`. Likely changes. [unconfirmed]
5. "Delivery Date" label on the UCD Service Request Details page and the BO listing column / filter — which date each shows after the change is **not stated**.

## Open questions / risks for testing

1. **SRD not read.** Every requirement above is from the Jira change remarks only. Field specs and acceptance criteria are in v0.2 docx.
2. **Delivered date picker range** — SRD v0.2 itself says "Pending: delivered date picker range". Min / max (e.g. not before Ship Out Date, not in the future) unknown.
3. **Which fields** make up the split address (address lines, postcode, district / area, state, city?). Jira says "postcode and area"; v0.2 says "District". Are "area" and "District" the same field? [unconfirmed]
4. **"Does not tally with backend record"** (row 4) — which backend record is the truth: Company Management showroom address, or the Application showroom fields (EAINT-11978)? Not stated.
5. **Old records** — will BDP records created before release show the full address, or only new ones? Not stated.
6. **Listing and filter** — does BO listing "Delivery Date" column / `deliveryDateFrom/To` filter use Ship Out Date or Delivered Date after the change?
7. **UCD details page** — does the UCD Service Request Details page show both dates or one?
8. **Emails / DO** — does any BDP email or the Delivery Order print the shipping address or delivery date? DO uses the company **registered address**, never the shipping address `[from knowledge/flow-device-purchase.md "Other confirmed facts"]` — likely unaffected. [unconfirmed]
9. **Export** — `Biometric_Device_Installation_List_YYYYMMDD.xlsx` columns may change if address is split or a date is added. Not stated.
10. **Date format trap** — the popup date posts `dd/MM/yyyy`; ISO is accepted with 200 OK but stores no date and later blocks Delivered `[from knowledge/flow-device-purchase.md, EAINT-12166 section]`. The new Delivered Date field may carry the same trap.
11. **Long address wrap** — EAINT-12095 fixed UCD wrap but "Seems like the initial fix for UCD broke the BO page" `[from knowledge/cr-ledger.md §EAINT-12095, Teams 2026-09-17 16:20]`. Full address with postcode / district makes lines longer — recheck both pages.
12. **Overlap with EAINT-12099 (Inventory Control)** — its Miro regression list includes "BO > Update Shipping Details" and "BO > Delivered closes the service request and re-issues its payment report" `[from knowledge/flow-inventory-control.md §6]`. Both tickets touch the same popup. Deployment order unknown.
13. **QA owner, dev, env, deploy date** — all empty.

## Suggested test focus

1. **UCD step 1, showroom ticked:** each split field is **prefilled** with the showroom address, including **postcode** and **District**; values match the company record.
2. **UCD step 1, showroom unticked:** "Default address handling remains as existing" — typed address path still works; **District mandatory** error when blank.
3. **Display after purchase:** full address (incl. postcode, area / district) on **Submission page**, **UCD Service Request Details**, **BO Service Request Details**, **Update Shipping Details** popup, and BO **Export**.
4. **Long address** wrap on UCD and BO details pages (EAINT-12095 regression).
5. **BO popup, New → Arranged:** label **"Ship Out Date"**; save; date shown on details page and listing.
6. **BO popup, Arranged → Delivered:** label **"Delivered Date"**; Ops **selects** a date; saved value shows, not the Ship Out Date.
7. **Delivered Date range:** boundary cases once the SRD fixes the range (before Ship Out Date, today, future).
8. **No revert:** after Delivered, Update Shipping Details button absent; API attempt returns `INVALID_STATUS` `[from knowledge/flow-device-purchase.md]`.
9. **Listing:** Delivery Date column and Delivery Date From/To filter return the expected date (max one-month window).
10. **Regression:** Device Serial No. capture (EAINT-12167), DO generation and DO Number (EAINT-12166), concurrency dialog "Unable to proceed. This record was just updated by another user.", 40-unit cap, BDP with and without installation.
11. **Legacy records:** a BDP created before release opens without error and shows its old address and date.

## Existing repo knowledge / automation to reuse

1. `knowledge/flow-service-hub.md` §5.4 (UCD step 1 form), §5.9 (UCD details), §5.11 (BO listing), §5.13 (BO shipping popup), §6.6 (BDP shipping and DO flow).
2. `knowledge/flow-device-purchase.md` — popup date format trap, endpoint params, Delivered-is-terminal rule.
3. `tests/service-hub` — `pages/BiometricPurchasePage.ts`, `pages/bo/DevicePurchaseDetailsPage.ts` (`setDeliveryDate`), `arrangeBdpReferenceViaUCD(...)` with `shipToShowroom` / `deliveryAddress` options. All will need updating for split fields and a second date.
4. Baseline captures: `_reference/tickets/EAINT-12166/EAINT-12166-ucd-bdp-purchase-selection-step-uat1-2026-09-23.html`, `_reference/tickets/EAINT-12167/EAINT-12167-bo-sr-details-update-shipping-details-popup-uat1-2026-09-22.html`, `_reference/tickets/EAINT-12166/EAINT-12166-ucd-service-request-details-arranged-uat1-2026-09-23.html`, `_reference/html/eauto/bo-biometric-device-purchase-software-installation-listing.html`.

## Knowledge candidates

1. **EAINT-12349 splits the BDP shipping address into separate fields, District mandatory, showroom address prefilled.** Source: Jira EAINT-12349 SRD table, v0.2 (27.10.2026) remarks. Target: `knowledge/flow-service-hub.md` §5.4 note, flagged as future.
2. **EAINT-12349 adds two date labels on Update Shipping Details: "Ship Out Date" and "Delivered Date"; Ops selects the Delivered Date.** Source: Jira SRD table v0.2 + description row 5. Target: `knowledge/flow-device-purchase.md` and `knowledge/eauto-service-hub.md` BO rule #3 (currently "Delivery Date ... locked").
3. **Known defect behind EAINT-12349:** showroom-address records "does not include postcode and area in some cases, and address shown does not tally with backend record". Source: Jira description row 4. Target: `knowledge/quirks.md` until the fix ships.
