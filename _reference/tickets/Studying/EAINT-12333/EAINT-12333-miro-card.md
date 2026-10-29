<!-- Source: _reference/tickets/Studying/_miro-board-capture-2026-10-26.md, section "PACKAGE - ENFORCE 12-CHAR PASSWORD". Miro board "eAuto - QA Resource Planning", column "READY FOR TESTING TICKETS" > "PACKAGE - ENFORCE 12-CHAR PASSWORD". Captured 2026-10-26. Copied verbatim. -->

# EAINT-12333 Miro card (verbatim)

```
EAINT-12333 - 🔴[eAuto-BackOffice] To Create Invoice for Proforma Invoice Module
- To deploy on:
- Test Env:
- BA: Yi Link
- QA:
- Test Env Point to:
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- QA start Testing:
- Est. Testing Mandays: 5 days (1 QA)
- Base Testing Time: 3 days
- Buffer (Req Change + Bug Fix + Retest Bug): 2 days
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Automation + Manual Testing)
- Transaction Type
- Existing Transaction
- Invoice auto-generated upon deployment (no BackOffice action)
- e-Invoice Status, e-Invoice No. and e-Invoice PDF remain unchanged
- Existing records not covered by the deployment backfill follow the New Transaction flow ([Generate Invoice & e-Invoice])
- New Transaction
- [Generate Invoice & e-Invoice] button
- Valid TIN: Invoice + e-Invoice generated
- Invalid / No TIN: Invoice generated only; no e-Invoice; e-Invoice Status unchanged
- Invoice Format
- Follows existing production invoice format, field for field
- Invoice numbering
- Regression
- Proforma Invoice / e-Invoice Listing + Export
- Proforma Invoice Details page buttons (Print Proforma Invoice, Print e-Invoice, Mark as Paid, Cancel)
- Credit Note (Raise from Proforma, Listing + Export)
- e-Invoice / Consolidated e-Invoice Listing ("Proforma Invoice Only") + Consolidated report
- Existing invoice generation cron: no duplicate invoices for Proforma
- UCD Portal (Web / Mobile): no change (out of scope)
- Menu access by user list
- MyInvois Portal
```
