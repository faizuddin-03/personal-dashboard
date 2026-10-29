<!-- Study written 2026-10-26 by Claude. Read-only sources: Jira (Atlassian MCP), Miro capture 2026-10-26, Teams exports (end 2026-10-16), repo knowledge/. No browser used. -->

# EAINT-12333 study

## 1. Header
1. **Title (Jira, verbatim):** "🔴[eAuto-BackOffice] To Create Invoice for Proforma Invoice Module"
2. **Jira status:** **Code Review** (updated 2026-10-01 15:43 +0800).
3. **Priority:** Medium. **Labels:** 260907-260911, ProductBacklog, September2026. Created 2026-09-10.
4. **Assignee / reporter:** BA (Lim Yi Link) on both.
5. **QA field (cf[10041]):** **empty** (null).
6. **BA:** Yi Link (Miro "BA: Yi Link"). **Dev:** Jin Siang Boo (Teams 2026-09-29 11:45).
7. **Fix version:** "[QA]Ready for Testing Tickets" (release date field 2026-11-02). Due date: none.
8. **Deployment date:** **none set**. Miro column "READY FOR TESTING TICKETS → PACKAGE - ENFORCE 12-CHAR PASSWORD"; "- To deploy on:" blank.
9. **Test env:** **not stated.** Miro "- Test Env:" and "- Test Env Point to:" blank. `[inference]` staging /eauto; confirm.
10. **Miro estimate:** "Est. Testing Mandays: 5 days (1 QA)", "Base Testing Time: 3 days", "Buffer (Req Change + Bug Fix + Retest Bug): 2 days". Testing Scope "(Automation + Manual Testing)".

## 2. Sources read
1. **Jira EAINT-12333** — all fields, 0 comments, 0 sub-tasks, 0 issue links, 0 remote links. Read 2026-10-26.
2. **Jira attachments (list only):** `SRD_EAINT-12333_v1.0_20260917.pdf` and `.docx` (2026-09-17 18:22) — **latest SRD**; `SRD_EAINT-12333_v0.1_20260917.docx`.
3. **SRD not retrieved — `SRD_EAINT-12333_v1.0_20260917.pdf`, v1.0, 2026-09-17.** MCP gives metadata only; no local copy in repo, inbox, Downloads or OneDrive. User to drop it here.
4. **Miro card** — `EAINT-12333-miro-card.md` (detailed scope; source of most of §5).
5. **Teams** — `_reference/teams/EAINT-12228-12333-Forgot-Password-and-Proforma-Invoice.md` part 2 (2026-09-17 to 2026-10-01; header: "scroll aborted ... may be incomplete").
6. **Knowledge** — `knowledge/flow-bo-shell.md` §3.8; `knowledge/flow-company-profile-einvoice.md`; `knowledge/production-regression-scope.md` §8.4; `knowledge/business-rules-from-test-scenarios.md` item 12 (EAINT-8538).

## 3. What changes (Jira description, verbatim)
1. **Affected Portal:** "eAuto – Homepage (Web app) eAuto – Used Car Dealer Portal (Web app) eAuto – Used Car Dealer Portal (Mobile app) eAuto – Back Office User Portal"
2. **Affected Module:** "Proforma Invoice"
3. **Request:** "Create the invoice for the Proforma Invoice module."
4. **Existing:** "No invoice is generated."
5. **Expected:** "The system shall generate an invoice and/or e-invoice."
6. **Why:** "Key reason for the request: UCD requires the invoice after making a payment where they do not have a TIN. Refer to source ticket EAUTO-1055."
7. **Where in BO** (`knowledge/flow-bo-shell.md` §3.8): "Generate Proforma Invoice" `/<env>/view/proformainvoice/main/new.do`; "Proforma Invoice / e-Invoice Listing" `/<env>/view/proformainvoice/enquiry/`; "Credit Note Listing" `/<env>/view/creditnote/enquiry/main.do`.

## 4. New vs existing behaviour
1. **Existing:** Proforma has [Proforma Invoice] and [e-Invoice] buttons only (`knowledge/flow-company-profile-einvoice.md` line 94). No invoice document when the UCD has no TIN.
2. **New (Miro card, verbatim):**
   1. Existing transactions: "Invoice auto-generated upon deployment (no BackOffice action)"; "e-Invoice Status, e-Invoice No. and e-Invoice PDF remain unchanged"; "Existing records not covered by the deployment backfill follow the New Transaction flow ([Generate Invoice & e-Invoice])".
   2. New transactions: "[Generate Invoice & e-Invoice] button"; "Valid TIN: Invoice + e-Invoice generated"; "Invalid / No TIN: Invoice generated only; no e-Invoice; e-Invoice Status unchanged".
   3. "Invoice Format": "Follows existing production invoice format, field for field"; "Invoice numbering".

## 5. QA scope (Miro card, verbatim)
1. "Transaction Type" — Existing / New (see §4.2).
2. "Invoice Format", "Invoice numbering".
3. "Regression":
   1. "Proforma Invoice / e-Invoice Listing + Export"
   2. "Proforma Invoice Details page buttons (Print Proforma Invoice, Print e-Invoice, Mark as Paid, Cancel)"
   3. "Credit Note (Raise from Proforma, Listing + Export)"
   4. "e-Invoice / Consolidated e-Invoice Listing ("Proforma Invoice Only") + Consolidated report"
   5. "Existing invoice generation cron: no duplicate invoices for Proforma"
   6. "UCD Portal (Web / Mobile): no change (out of scope)"
   7. "Menu access by user list"
   8. "MyInvois Portal"

## 6. Affected regression areas
1. BO Proforma Invoice / e-Invoice Listing, Details, Export.
2. Credit Note raised from Proforma (prod checklist pattern, `knowledge/production-regression-scope.md` §8.4 item 7).
3. Consolidated e-Invoice listing filter "Proforma Invoice Only" (`knowledge/flow-company-profile-einvoice.md` line 168).
4. LHDN MyInvois submission for valid-TIN cases.
5. Invoice-generation cron (duplicate check).
6. Earlier Proforma CRs: EAINT-7583 (module), EAINT-8538 (payment slip), EAINT-11069 ([Mark as Paid]) — `knowledge/production-regression-scope.md` lines 968, 1057, 1101.

## 7. Test data / env needs
1. BO account with Proforma menu ("Menu access by user list"; Finance is view-only per EAINT-8538 role test).
2. UCD companies with **valid TIN**, **invalid TIN**, **no TIN**.
3. **Existing** Proforma records created **before** the deploy on staging, to check the backfill.
4. MyInvois sandbox access for e-Invoice check `[inference]`.
5. Prod note: "Proforma Invoice (No data)" (`knowledge/production-regression-scope.md` §8.4 item 4) — prod check may lack data.

## 8. Dependencies / related tickets
1. Source ticket **EAUTO-1055** (other Jira project; not read).
2. No Jira links on the ticket.

## 9. Teams decisions (verbatim, `_reference/teams/EAINT-12228-12333-Forgot-Password-and-Proforma-Invoice.md`)
1. 2026-09-17 18:38, Yi Link: "uploaded v0.1 & v1.0 to JIRA"
2. 2026-09-25 17:15, Jin Siang Boo: "can put my AI first, does this ticket urgent?" — Yi Link 17:36: "not urgent ticket ya"
3. 2026-09-29 11:45, Jin Siang Boo: "this ticket done development and can be deploy to staging anytime for QA Testing ya" (summary artifact link redacted in export).
4. 2026-10-01 16:28, Jin Siang Boo: "(done code review?) yaya"
5. Export may be incomplete (scroll aborted); ends 2026-10-16.

## 10. Open questions / conflicts
1. **Why in the password package?** No source explains it. Jira, Teams and SRD names show no password link. `[inference]` grouping by shared BA (Yi Link) / release bundle, not by feature.
2. **UCD scope conflict:** Jira "Affected Portal" lists UCD Web, UCD Mobile and Homepage; Miro says "UCD Portal (Web / Mobile): no change (out of scope)".
3. **Status:** Jira **Code Review** although Teams 2026-10-01 says code review done; Miro "READY FOR TESTING".
4. **Miro scope source:** detailed items ([Generate Invoice & e-Invoice], backfill) are not in the Jira text and SRD v1.0 is unread. `[inference]` from the dev summary artifact (2026-09-29). Confirm against SRD.
5. **Invoice numbering format** — not stated anywhere read.
6. **Backfill:** which existing records are "not covered by the deployment backfill"?
7. Deployment date, test env and QA assignee not set.

## 11. Existing repo knowledge / automation to reuse
1. `knowledge/flow-bo-shell.md` §3.8 — Proforma menu URLs ("no flow doc yet").
2. `knowledge/flow-company-profile-einvoice.md` — e-Invoice / consolidated rules.
3. `knowledge/business-rules-from-test-scenarios.md` item 12 — EAINT-8538 Proforma rules.
4. `knowledge/production-regression-scope.md` §8.4 — prod e-Invoice / credit note / Proforma checks.
5. `_reference/html/eauto/bo-einvoice-consolidated-listing-search-results.html` — consolidated listing capture.
6. No Proforma page captures or automation exist; capture the listing and details pages when testing starts (AGENTS.md HTML rule).
