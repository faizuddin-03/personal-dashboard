<!-- Copied verbatim from _reference/tickets/Studying/_miro-board-capture-2026-10-26.md (lines 679-728), Miro board "eAuto - QA Resource Planning", captured 2026-10-26. Column: 5TH NOV DEPLOYMENT. -->

### EAINT-12099 — 5TH NOV DEPLOYMENT
```
EAINT-12099 - 🔴[eAuto-BackOffice] Shopping Cart - To Create Inventory Control Module
- To deploy on:
- Test Env:
- BA: Mei Jia
- QA:
- Test Env Point to: -
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- QA start Testing:
- Est. Testing Mandays: 7 days (1 QA)
- Base Testing Time: 5 days
- Buffer (Req Change + Bug Fix + Retest Bug): 2 days
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation + Manual Testing)
- New Pages
- BackOffice > Service Hub > Inventory Control Report (search & filter panel, 18-column listing)
- BackOffice > Service Hub > Stock In Request
- BackOffice > Service Hub > Stock Out Request
- BackOffice > Service Hub > Inventory Control Dashboard
- UCD > Biometric Device Purchase (available stock only)
- Stock In Request and Stock Out Request
- Dashboard
- Year filter, 7 columns, colour coding, last-updated note
- Safe Level % formula and the colour that follows it
- 6:00 AM refresh + low-stock email (fires once per drop - stock must recover above 30% and fall again to retest)
- UCD - Available Stock
- Paid-but-not-shipped units now count as taken
- Stock checked at order and re-checked before the card is charged
- Cross-cutting
- Permission matrix - Ops / CSE / Finance / IT
- Concurrency - 2 Ops on one batch, simultaneous Upload, stale page
- 47 message strings - asserted literally
- Audit log - user, action, Reference No., result
- Phone scan limits - 2,000 scans / 32 characters
- Left menu - new Service Hub section, existing BDP & SI link moved out of the Proforma Invoice / e-Invoice box
- Regression
- BO > Update Shipping Details
- BO > Delivery Status state machine
- BO > Delivered closes the service request and re-issues its payment report
- BO > BDP & SI Listing
- BO > listing export (carries device serials today)
- BO > DO template + 20-row split from EAINT-12166
- UCD > BDP Receipt page
- eauto-cron 1:00 AM must keep working alongside three new 6:00 AM behaviours
- ~250 TS
```
