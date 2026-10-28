# EAINT-12099 — Study (2026-10-26)

## 1. Header

1. **Title (verbatim):** "🔴[eAuto-BackOffice] Shopping Cart - To Create Inventory Control Module"
2. **Jira status:** **REQ REVIEW IN PROGRESS - EAUTO** (since 2026-09-14). Priority **Medium**. Type Task.
3. **QA (cf[10041]):** **empty** (Azfar set and cleared 2026-09-25). Miro "QA:" **blank**.
4. **BA:** Batrisyia Hasanah + Chee Mei Jia (Jira BA field). Miro "BA: Mei Jia". Assignee = Chee Mei Jia. Reporter = Batrisyia.
5. **Dev:** Xiwei Lim (Jira Developer field).
6. **Deployment date:** **5 Nov 2026** per Miro column "5TH NOV DEPLOYMENT". Jira Fix Version **S35.X-20261105 🌞** (release 2026-11-05; description "Main item(s): 1. Inventory Control Phase 1"). Jira Exp. Deploy Date 5/Nov/26 (set 2026-10-26 10:39).
7. **Test env:** **not stated** — Miro "Test Env:" blank; dev asked "Do let me know which env and when to deploy" (Teams 2026-10-12), no answer in export.
8. **Effort:** Miro "Est. Testing Mandays: 7 days (1 QA)" (Base 5 + Buffer 2), "~250 TS". Jira [QA] Est Man-day = 7.
9. **Commitment Month:** By2026, Sept2026.

## 2. Sources read

1. Jira EAINT-12099 (MCP, read 2026-10-26): description (version tables only), fields, changelog, attachments, links. **0 comments, 0 sub-tasks, 0 remote links.**
2. Linked **EAINT-12635** (Phase 2, To Do, created 2026-10-26) — description read.
3. Miro card `EAINT-12099-miro-card.md`.
4. Teams `_reference/teams/EAINT-12099-11881-11882-Shopping-Cart.md` (ends 2026-10-16).
5. `knowledge/teams-decisions-by-ticket.md`, `knowledge/flow-device-purchase.md`, `knowledge/flow-service-hub.md`, `knowledge/eauto-service-hub.md`.
6. **SRD: NOT retrieved — "SRD_EAINT-12099_v1.1_20261009.pdf" / ".docx", v1.1, 2026-10-09, uploaded by BA lead (Chee Mei Jia).** MCP cannot download attachment binaries; no local copy in repo, `_reference/inbox/`, `Downloads`, or OneDrive (`EAINT-12099` folder does not exist). **Please drop it into this folder.**
7. **Mockup NOT retrieved:** "Mock Up_EAINT-12099_BackOffice Portal_20261009.html" (2026-10-09).

### Attachment list (Jira)

1. EAINT-12099_Inventory_Control_V0.1_20260728.docx; V0.2_20260818.docx
2. EAINT-12099_Inventory_Control_StockIn_V0.1_20260903.docx; StockIn_V1.0_20260903.docx/.pdf
3. EAINT-12099_Inventory_Control_StockOut_Dashboard_V0.1_20260911.docx; StockOut_Dashboard_V1.0_20260914.docx/.pdf
4. **SRD_EAINT-12099_v1.1_20261009.docx/.pdf** (latest — "Combined Stock In, Stock Out and Dashboard SRD; updated per Ops feedback and Dev corrections" `[Jira description, version table]`)
5. Inventory_Control_Report_V1_20260820.html; Stock_In_Flow_V1_03092026.html; Stock_In_Flow_Dashboard_V1_11092026.html; **Mock Up_EAINT-12099_BackOffice Portal_20261009.html**

## 3. What changes

1. **Portal:** BackOffice (+ UCD available-stock). Jira description holds only version tables — no requirement text.
2. **New pages (Miro):** "BackOffice > Service Hub > Inventory Control Report (search & filter panel, 18-column listing)", "Stock In Request", "Stock Out Request", "Inventory Control Dashboard", "UCD > Biometric Device Purchase (available stock only)". `[Miro card]`
3. **Dashboard (Miro):** "Year filter, 7 columns, colour coding, last-updated note"; "Safe Level % formula and the colour that follows it"; "6:00 AM refresh + low-stock email (fires once per drop - stock must recover above 30% and fall again to retest)". `[Miro card]`
4. **UCD available stock (Miro):** "Paid-but-not-shipped units now count as taken"; "Stock checked at order and re-checked before the card is charged". `[Miro card]`
5. **Cross-cutting (Miro):** "Permission matrix - Ops / CSE / Finance / IT"; "Concurrency - 2 Ops on one batch, simultaneous Upload, stale page"; "47 message strings - asserted literally"; "Audit log - user, action, Reference No., result"; "Phone scan limits - 2,000 scans / 32 characters"; "Left menu - new Service Hub section, existing BDP & SI link moved out of the Proforma Invoice / e-Invoice box". `[Miro card]`
6. **Why** `[inference]`: Phase 1 shopping cart left stock-in/stock-out tracking manual; Teams 2026-07-10 BA: "Inventory next round ya as per discussed yesterday".
7. **Device scope:** Dermalog fingerprint only in Phase 1; manual purchase, reserve unit, Iris scanning deferred to **EAINT-12635** ("Deferred from Phase 1 so deployment can proceed with what IT has already developed."). `[Jira EAINT-12635 description #4, #6]`

## 4. New vs existing behaviour

1. **Existing:** BDP stock-in done in BO; no stock-out / inventory dashboard. `[Teams 2026-07-10 15:52, Ops-side tester]` "I stocked in the 1 unit of dermalog in BO ady, however in UCD side it still displays 0 units in stock even after refresh."
2. **Existing:** DO creation tied to the shipping save only; "EAINT-12099 (Inventory Control / Stock Out) is explicitly **not** on this branch". `[knowledge/flow-device-purchase.md, Dev QA Guide section]`
3. **New:** Stock In / Stock Out scan-based requests, inventory report, dashboard with Safe Level %, low-stock email, UCD stock counts paid-but-unshipped units as taken.

## 5. QA scope (Miro "Testing Scope: (Automation + Manual Testing)")

1. New pages: Inventory Control Report, Stock In Request, Stock Out Request, Dashboard, UCD BDP available stock.
2. Dashboard rules, Safe Level formula, 6:00 AM refresh + low-stock email.
3. UCD available stock + re-check before charge.
4. Permission matrix, concurrency, 47 message strings, audit log, phone scan limits, left menu.
5. "~250 TS".
6. **SRD-based scope not verified** — SRD v1.1 unread.

## 6. Affected regression areas (Miro "Regression")

1. "BO > Update Shipping Details"
2. "BO > Delivery Status state machine"
3. "BO > Delivered closes the service request and re-issues its payment report"
4. "BO > BDP & SI Listing"
5. "BO > listing export (carries device serials today)"
6. "BO > DO template + 20-row split from EAINT-12166"
7. "UCD > BDP Receipt page"
8. "eauto-cron 1:00 AM must keep working alongside three new 6:00 AM behaviours"

## 7. Test data / env needs

1. **Environment:** unknown.
2. **Phone / scanner** for QR/barcode scanning — Stock In flow is "QR-based mobile scanning" `[Jira version table, v0.2 18.08.2026]`; scan limits 2,000 / 32 chars `[Miro]`.
3. **Device serials** — unique, timestamp-generated per `tests/service-hub/utils/serials.ts` `[flow-service-hub.md §8]`.
4. **Paid BDP orders** to stock out — arrange via `arrangeBdpReferenceViaUCD` `[flow-service-hub.md §9 item 3]`.
5. **Low-stock email** mailbox (operation@eauto.my) — needs Mailtrap or equivalent; stock must drop below 30% and recover to retest `[Miro]`.
6. **Accounts:** Ops (incl. eautonurul), CSE, Finance, IT roles for the permission matrix `[Miro; Teams 2026-09-29]`.
7. **Two Ops sessions** for concurrency `[Miro]`.
8. **Cron control** for the 6:00 AM refresh `[inference: dev trigger needed]`.

## 8. Dependencies / related tickets

1. **EAINT-12635** — Inventory Control Phase 2 (Manual Purchase, Reserve Unit, Iris Scanning), To Do, linked 2026-10-26.
2. EAINT-10960 / 11880 (shopping cart Phase 1), **EAINT-12166** (DO template, 20-row split), EAINT-12167 (serials). `[Miro regression list; flow-device-purchase.md]`
3. External links in changelog: **EAUTO-857**, **CCB-878** (not readable via issuelinks).

## 9. Teams decisions (exports end 2026-10-16; all from `_reference/teams/EAINT-12099-11881-11882-Shopping-Cart.md`)

1. `[2026-07-10 16:01, BA (Batrisyia)]` "Inventory next round ya as per discussed yesterday"
2. `[2026-09-04 15:56, BA (Batrisyia)]` "To update, Ops given greenlight for Stock In SRD ya"
3. `[2026-09-28 11:16, BA lead (Mei Jia)]` "regarding the notification email when dermalog under safe limit can send to this email ya: operation@eauto.my"
4. `[2026-09-29 08:49, dev (Xiwei Lim)]` "Every scan on Stock In and Stock Out is saved straight away (auto save), so there is no Save button. Stock Out access also includes eautonurul, the same Ops list as Stock In. The SRD left her out. Stock Out: / One row per device unit. Columns: # · Reference No. · UCD · ROC · Serial No. · Scan Date · Scanned · Action. Action is a "Scan Barcode" link. Each scan is assigned to its own row. One "Submit Stock Out Request" button completes every order whose rows are all scanned. When the current month's Safe Level is below 30%, an email goes to operation@eauto.my daily at 08:00. Email content is pending. The Reference No. popup on the Inventory Control Report is removed. Reference No. is plain text. Stock In Discard removes only the selected rows, not the whole batch. In the UCD portal, available stock counts units on paid orders as already taken, even if their Stock Out is not completed. BF vs Safe Level (%) formula in SRD is incorrect should be BF ÷ (Stock Opening + Stock IN) × 100. Refurbished and damaged units phase 2 only handle."
5. `[2026-10-07 09:37, dev]` "12/10 next Monday for now (ETA ready for testing)"
6. `[2026-10-09 14:58, BA lead]` "i updated SRD v1.1 based on Tracey's feedback ya. and also attached the mockup will send out for external review"
7. `[2026-10-12 16:09, dev]` "hi all, EAINT-12099 changes are ready. Do let me know which env and when to deploy ya thanks"
8. `[2026-10-13 16:55, BA lead]` "need ur help to research and work on it how to scan stock in and stock out for the Iris device ya. also wan to let u know that by 03.11 the device will pulang back ad yaa"
9. `[2026-10-14 10:16 / 10:18 / 18:22, BA lead ↔ dev]` "existing biometric listing - we support manual purchase device or not ya?" — "nope" — "okkies then we might need to add in for this, Nurul requested this morning." (now deferred to EAINT-12635 `[inference from 12635 scope]`)
10. `knowledge/teams-decisions-by-ticket.md` § Shopping cart has only the RHB Ref 2 decision (not 12099-specific).

## 10. Open questions / conflicts

1. **Email time conflict:** Teams 2026-09-29 "daily at 08:00" vs Miro "6:00 AM refresh + low-stock email (fires once per drop ...)". Daily vs once-per-drop also conflicts. Check SRD v1.1.
2. **Safe Level formula:** Teams says SRD formula "is incorrect should be BF ÷ (Stock Opening + Stock IN) × 100" (2026-09-29); SRD v1.1 (2026-10-09) may have fixed it — unverified.
3. **Jira status** still REQ REVIEW IN PROGRESS while dev said changes ready 2026-10-12 and Fix Version set for 5 Nov — confirm SRD external review sign-off.
4. **QA owner** empty in Jira and Miro.
5. **Test env** not decided (dev asked 2026-10-12).
6. **Iris device** — Teams 10-13 asks dev to research Iris scanning; 12635 defers Iris to Phase 2. Confirm Iris is out of 5 Nov scope.
7. **Manual purchase** — requested 10-14; 12635 defers it. Confirm out of scope.
8. **Email content** "pending" (Teams 09-29) — final template unknown.
9. **~250 TS in 7 man-days** — confirm scope split manual vs automation.
10. **47 message strings** — need SRD v1.1 for the literal list.

## 11. Existing repo knowledge / automation to reuse

1. `tests/service-hub/` (benchmark suite): `utils/arrange.ts` (`arrangeBdpReferenceViaUCD`), `utils/serials.ts`, `specs/device-purchase-do-ts01..08.spec.ts` (shipping / DO / serial regression), `specs/user-access-regression.spec.ts` (permission matrix pattern).
2. Dashboard runners: `app/eauto/shopping-cart/`, `app/eauto/12166` (benchmark per memory), `app/api/eauto/bdp-creator/run/route.ts` (Create BDP utility).
3. Knowledge: `knowledge/flow-device-purchase.md` (BO shipping, serials, DO), `knowledge/flow-service-hub.md`, `knowledge/eauto-service-hub.md`, `knowledge/mailtrap.md`.
4. Older capture: `_reference/tickets/Shopping Cart/SRD_EAINT-11880_Biometric_Purchase_V1.2_20260724 (1).pdf` (Phase 1 BDP SRD, not 12099).
