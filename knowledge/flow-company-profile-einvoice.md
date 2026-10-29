# Company / Business Profile Update and e-Invoice (flow)

Built 2026-10-23 for /eauto/flows; data mirror: lib/eautoFlows/modules/company-profile-einvoice.ts

Provenance tags: [azfar: ...] = colleague Azfar's QA repo copy at _reference/codebases/eauto-qa-azfar; [mine: ...] = our own knowledge files; [jira: ...]; [ts: ...]; [miro: ...]; [askeauto: ...] = Ask eAuto chatbot answers from prod code. [unconfirmed] = lead, not fact. "Conflict:" = two versions kept.

## Purpose
- Two linked topics. First, every dealer must update its Company/Business Profile so eAuto has a valid TIN for e-Invoicing. Second, every paid transaction gets an Invoice and, when the TIN is valid, an e-Invoice sent to LHDN. Failed e-Invoices are re-sent by a monthly job once the TIN is fixed.
- Portals: UCD portal, Back Office, AATF portal (payment report), LHDN MyInvois (external)
- Related modules: onboarding, ucd-portal, ssm, backoffice, cibo

## Glossary
- TIN: Tax Identification Number. A valid TIN is needed for an e-Invoice. [mine: knowledge/business-rules-from-test-scenarios.md]
- LHDN / MyInvois: The tax authority and its e-Invoice system. eAuto submits e-Invoices to it. [azfar: cr/EAINT-7548/LEDGER.md]
- Pre e-Invoice: The name of the Company/Business Profile Update flow (done before e-Invoicing starts). [azfar: knowledge/portals/ucd/portal.md]
- Consolidated e-Invoice: A combined e-Invoice sent later for transactions whose e-Invoice failed (for example an invalid TIN). Created by a monthly cronjob. [azfar: cr/EAINT-12022/01-research/study.md]
- Document Code: Invoice number like EA-IV-MMYY-xxxxxxx. It runs in sequence with no skipped numbers. [azfar: cr/EAINT-7548/LEDGER.md] [mine: knowledge/business-rules-from-test-scenarios.md]
- Proforma Invoice: An invoice shown before payment is final. Has its own button and e-Invoice. [mine: knowledge/business-rules-from-test-scenarios.md]
- Type of Business (profile): ROB, ROC, TLN (Trading Licence) or LLP. It decides which documents Step 2 asks for. [azfar: automation/src/ff36/journeys.ts]

## Flow: Company / Business Profile Update (3 steps)
- The main user updates the company profile: details, a Trading Licence or SSM document, then a licence agreement with MyKad and thumbprint. The steps depend on the Type of Business.
- Portals: UCD portal

### Entry points and steps
- Entry point "Homepage tile COMPANY/BUSINESS PROFILE": UCD homepage › COMPANY/BUSINESS PROFILE (/view/ucd/einvoice/view.do) [azfar: knowledge/portals/ucd/portal.md] [azfar: automation/src/ff36/journeys.ts]
  - Main user only. A sub user cannot open Step 1.
  1. Open the tile | where: Homepage › #company-business-profile | Opens Pre e-Invoice Step 1. For a company that is already updated it shows a read-only summary (SSM Invoice, MVD Agreement, “MyKad/Thumbprint verified on …”). | affects: ucd-portal [azfar: knowledge/portals/ucd/portal.md] [mine: knowledge/flow-ucd-shell.md]
  2. Step 1 – Details | where: Profile › Step 1 | Company details. Fields depend on Type of Business (ROB, ROC, TLN, LLP). [azfar: automation/src/ff36/journeys.ts]
  3. Step 2 – Upload Trading Licence / SSM document | where: Profile › Step 2 (#TradingLicense, [Upload & Submit] #to-upload-tl) | Multipart upload to einvoice/trading-license-doc/upload.do. For SSM types the system runs an SSM enquiry first. | affects: ssm [azfar: automation/src/ff36/journeys.ts] [ts: EAINT-9247 PE_TS02-TS06]
     - If SSM enquiry answers anything other than 004 -> Popup “Purchase SSM Document / The SSM Document is not available for purchase.” OK goes to the homepage. SSM Check = Failed and Tx Status = Failed.
     - If Retry -> Company Name and SSM Number fill in. Summary: SSM Document Fee RM15.00 + eAuto Service Fee RM3.00 + Service Tax RM1.44 = RM19.44. Press Agree to Purchase.
     - If Duplicate purchase -> Popup “SSM Document for this Company was purchased recently.”
  4. Step 3 – MVD License Agreement and Thumbprint | where: Profile › Step 3 | The main user reads the MVD agreement and verifies with MyKad and thumbprint. | affects: platform › MyKad / thumbprint [azfar: knowledge/_core/roles-and-accounts.md] [azfar: automation/src/ff36/journeys.ts]
- Entry point "“Company/Business Profile Update – UPDATE REQUIRED” popup": UCD homepage popup chain (#dialog-einvoice) [azfar: knowledge/portals/ucd/portal.md] [askeauto: Q2 2026-10-23]
  1. Popup shows after login until the profile is done | Text: “UPDATE REQUIRED … Failure to comply may result on your account with eAuto be suspended”. It sits in the popup order after the profile-updates dialog (order depends on the campaign). The e-Invoice reminder flag reads CompanyAccount.eInvoiceSetupStatus. The popup button leads to the same update flow. | affects: ucd-portal › startup popup chain [azfar: knowledge/portals/ucd/portal.md] [mine: knowledge/flow-ucd-shell.md] [askeauto: Q2 2026-10-23]
- Entry point "Link at the top of the homepage": UCD homepage › Company/Business Profile (top of page) [ts: EAINT-9247] [ts: EAINT-8169]
  1. Open the link | Same flow as the tile. Message wording was changed in EAINT-8169 (e-Invoicing phase 3 notice; deadline moved from 31 May 2025 to 20 June 2025). [ts: EAINT-9247 E2E_TS01] [ts: EAINT-8169 TS1-TS3]
- Entry point "Company created in BO without a Type of Business": Back Office › Manage Company Accounts (create) [azfar: knowledge/_core/roles-and-accounts.md]
  1. Treated as Trading Licence | Companies created in BO without a Type of Business are treated as “Trading License” (PDF upload) in the profile flow. | affects: onboarding › registration-and-account [azfar: knowledge/_core/roles-and-accounts.md]

### Cross-module effects (what it affects)
- Company/Business Profile page shows SSM documents and the purchase date (dd Month YYYY HH:MM AM|PM). [ts: EAINT-9247 PE_TS06]
- SSM Transaction Details (LLP) and the BO SSM listing and Export CSV get the purchase. [ts: EAINT-9247 PE_TS06]
- BO company details TIN is the value later used for invoices and e-Invoices. [mine: knowledge/business-rules-from-test-scenarios.md]
- Pre-Application price stays RM108.00; only SSM price changed (EAINT-10691). [ts: EAINT-9247 10691_PC_TS1-TS10]

### Roles
- Main user does the update and the thumbprint. Sub UCD cannot open Pre e-Invoice Step 1. [azfar: knowledge/portals/ucd/portal.md] [ts: EAINT-9247]
- BO users can view the result. [ts: EAINT-9247]
- Main UCD in the TS is Sdn Bhd/Bhd; Sub UCD is Sole Proprietorship/Partnership (EAINT-8169 sheet). [ts: EAINT-8169]

### Where the transaction goes
- The SSM purchase appears in the SSM Transaction Listing (UCD and BO). The profile page shows read-only data. [ts: EAINT-9247]
- [unconfirmed] Where else the update data goes is not known. [azfar: knowledge/portals/ucd/portal.md]

### Rules
- SSM price RM19.44 applies on STMS Step 4, eSTM Step 4 (new and retry) and Profile Update Step 2. MyInvois classification 022 “SSM profile & admin fees”, unit price 18.00, tax 1.44, total 19.44. [ts: EAINT-9247 10691_PC_TS1-TS10]
  - Conflict: other version: Older workbooks show SSM price RM15 + 3 + 1.44; one screen showed RM18 + 1.44; the earlier price was RM18.64. [azfar: knowledge/_core/fees-and-pricing.md] [mine: knowledge/business-rules-from-test-scenarios.md] (EAINT-10691 is newer; RM19.44 wins.)
- If the user is NOT granted SSM permission (company level does not matter), Step 2 asks for documents instead: Sdn Bhd/Bhd = SSM Company Profile + Company Board Resolution + Staff Employment Pass & MyKad; Sole Proprietorship/Partnership = SSM Business Profile + Authorisation Letter + … [ts: EAINT-8802 E2E_STMS_TS1-TS5]
- A Bypass Purchase SSM user setting lets the UCD proceed without buying SSM and upload 3 documents. [ts: EAINT-8802]
- The profile reminder is NOT shown on this flow’s own pages (EAINT-12253, Ex.3). [azfar: knowledge/portals/ucd/portal.md] [jira: EAINT-12253]
- [unconfirmed] One SSM general-error popup for ROB in Pre e-Invoice cannot be triggered (code error per dev). [ts: EAINT-9247]

### QA scope to check
- Check each Type of Business (ROB, ROC, TLN, LLP) through the 3 steps. [azfar: automation/src/ff36/journeys.ts] [ts: EAINT-9247]
- Check SSM not-available popup, retry price breakdown RM19.44, and the duplicate-purchase popup. [ts: EAINT-9247 PE_TS02-TS06]
- Check main user vs sub user access. [azfar: knowledge/portals/ucd/portal.md]
- Check the update popup and the homepage link, and message wording. [ts: EAINT-8169]
- Check the thumbprint step and MVD agreement date and name. [azfar: knowledge/_core/roles-and-accounts.md]
- Check the SSM Transaction Listing (UCD and BO) and Export CSV after a purchase. [ts: EAINT-9247]
- Check an updated company shows the read-only summary. [azfar: cr/EAINT-9247/LEDGER.md]

### Ticket history
- EAINT-7229: Applet certificate / profile flow [latest]
- EAINT-8169 (2025-05): Profile update message content (e-Invoicing phase 3 notice) [latest]
- EAINT-8081: Hotline number text on pages including Change Address popup [latest]
- EAINT-9247: SSM purchase for LLP in Pre e-Invoice [latest]
- EAINT-10691: SSM price change to RM19.44 (newer than 9247 base) [latest]
- EAINT-12253 (2026-09): Browser reminder is not shown in this flow [latest]
- EAINT-11558 (2026-05): Data job: 334 UCDs restricted for not completing the company profile update (also rounds 11212, 10948, 10510) [latest]

### Open questions
- Cronjobs for this flow are unknown.
- Where the transaction goes after completion beyond the SSM listing is unknown.
- Ask eAuto Q16 (profile and e-Invoice, prod code) has not been answered yet.

## Flow: Invoice and e-Invoice on each transaction
- When a transaction is approved, the details page shows an Invoice and, if the TIN is valid, an e-Invoice. e-Invoices go to LHDN MyInvois. A dealer with a blank or invalid TIN gets the Invoice only.
- Portals: UCD portal, AATF portal, Back Office, LHDN MyInvois

### Entry points and steps
- Entry point "Invoice / e-Invoice buttons on Transaction Details": UCD or BO › any module › Transaction Details (Approved) [mine: knowledge/business-rules-from-test-scenarios.md] [ts: EAINT-8550] [azfar: cr/EAINT-3090/LEDGER.md]
  1. Transaction is approved | e-Invoice is built and submitted to LHDN. Listings show e-Invoice Status and Submission Date. The [Invoice] button is named [e-Invoice] when it applies (SSM: [SSM Invoice] / [SSM e-Invoice]; Proforma: [Proforma Invoice] / [e-Invoice]). | affects: All paid modules; LHDN MyInvois [mine: knowledge/business-rules-from-test-scenarios.md] [ts: EAINT-7548]
  2. Valid TIN | Both [Invoice] and [e-Invoice] show. LHDN Response Status = OK. [mine: knowledge/business-rules-from-test-scenarios.md] [ts: EAINT-8550]
  3. Blank or invalid TIN | Only [Invoice] shows, with the note “e-Invoices are only available for customers with a valid TIN. e-Invoices can only be issued for transactions within the current calendar month.” LHDN Response Status = Failed (remark “TIN verification failed. Kindly provide correct TIN information to eAuto customer service.” or “No TIN info has been provided.”). [mine: knowledge/business-rules-from-test-scenarios.md] [ts: EAINT-8550]
     - If TIN is fixed later -> The monthly consolidated e-Invoice cronjob re-sends the failed e-Invoice.
- Entry point "eDereg Pre-Checking e-Invoice": AATF portal › eDereg Pre-Checking transaction [mine: knowledge/business-rules-from-test-scenarios.md] [jira: EAINT-8655] [jira: EAINT-9043]
  1. Valid TIN gives OK, invalid gives Failed | AATF “e-Invoice Status = OK” and BO “LHDN Response Status = OK” for a valid TIN. Failed with the TIN verification remark for an invalid TIN. | affects: dereg [mine: knowledge/business-rules-from-test-scenarios.md]
- Entry point "Pre-Application and Application payment invoices": Onboarding success pages and emails [azfar: cr/_boards/miro-preapp-application/t33_3458764647058719873.tsv]
  1. Invoice and e-Invoice for the onboarding fees | Invoice PDF + e-Invoice PDF (valid TIN) or Invoice PDF only (invalid or blank TIN). BO Pre-Application / Application listings have lhdnStatus filters. | affects: onboarding [azfar: cr/_boards/miro-preapp-application/t33_3458764647058719873.tsv]
- Entry point "Proforma Invoice: generate an Invoice (FUTURE, EAINT-12333, not live)": BO › Proforma Invoice / e-Invoice (menu URLs in flow-bo-shell.md §3.8) [from ticket EAINT-12333, Jira description, read 2026-10-26]
  - Today, Jira verbatim: "No invoice is generated." Why: "UCD requires the invoice after making a payment where they do not have a TIN. Refer to source ticket EAUTO-1055." Expected: "The system shall generate an invoice and/or e-invoice."
  1. New transaction | BO › Proforma Invoice details | "[Generate Invoice & e-Invoice] button"; "Valid TIN: Invoice + e-Invoice generated"; "Invalid / No TIN: Invoice generated only; no e-Invoice; e-Invoice Status unchanged". [unconfirmed — Miro card EAINT-12333, captured 2026-10-26; SRD v1.0 (17.09.2026) not read]
  2. Existing transaction | no BO action | "Invoice auto-generated upon deployment (no BackOffice action)"; "e-Invoice Status, e-Invoice No. and e-Invoice PDF remain unchanged"; "Existing records not covered by the deployment backfill follow the New Transaction flow ([Generate Invoice & e-Invoice])". [unconfirmed — same Miro card]
  - Format: "Follows existing production invoice format, field for field". Regression named on the card: "Existing invoice generation cron: no duplicate invoices for Proforma"; "Credit Note (Raise from Proforma, Listing + Export)"; "e-Invoice / Consolidated e-Invoice Listing ("Proforma Invoice Only") + Consolidated report"; "Proforma Invoice Details page buttons (Print Proforma Invoice, Print e-Invoice, Mark as Paid, Cancel)". [unconfirmed — same Miro card]
  - Conflict: Jira "Affected Portal" lists UCD web and mobile and the Homepage; the Miro card says "UCD Portal (Web / Mobile): no change (out of scope)". Invoice numbering and which records the backfill skips are not stated anywhere read. [source: Studying EAINT-12333 study §10 #2, #5, #6, 2026-10-27]

### Cross-module effects (what it affects)
- LHDN MyInvois receives the e-Invoice. Supplier is eAuto Sdn Bhd (fixed TIN, MSIC 62099). [ts: EAINT-7548] [azfar: cr/EAINT-7548/LEDGER.md]
- Modules with e-Invoices: STMS, Transfer History, UCD to UCD Interstate, eSTM, eLKM, eVOC, APT, BMK, JomCheck, SSM, Dereg, Insurance Cancellation. Mobile: STMS, UCD to UCD, eSTM, eLKM, eVOC, SSM. [ts: EAINT-7548]
- Combined documents: STMS + TH, and eSTM + eLKM + eVOC list one line per item, each with its own SST. [azfar: knowledge/portals/ucd/how-we-test.md]
- Reconciliation and Finance use the same amounts. [mine: knowledge/business-rules-from-test-scenarios.md]
- CIBO payments are a separate system. [mine: knowledge/business-rules-from-test-scenarios.md]

### Cronjobs
- LHDN resubmission (consolidated e-Invoice) | Monthly (day of month not recorded) | Re-sends LHDN-failed e-Invoices once the TIN is fixed. [azfar: cr/EAINT-12022/01-research/study.md] [mine: knowledge/business-rules-from-test-scenarios.md]

### Roles
- UCD users see their own company documents. BO Finance and Ops see per page. AATF sees its own. [azfar: knowledge/_index/sharepoint-studied.md] [mine: knowledge/business-rules-from-test-scenarios.md]
- Invoice rules apply on UCD web and mobile and BackOffice. [ts: EAINT-8550]

### Where the transaction goes
- Documents are in the transaction details, the UCD Payment Report, Download Payment Document and Payment Breakdown Report, and sent to LHDN. [mine: knowledge/business-rules-from-test-scenarios.md] [azfar: cr/EAINT-3090/LEDGER.md]

### Rules
- Document Code runs in sequence with no skipped numbers across all modules, including failed e-Invoices (EAINT-8659). Format EA-IV-MMYY-xxxxxxx, resets monthly. Type 01 Invoice version 1.1. [mine: knowledge/business-rules-from-test-scenarios.md] [azfar: cr/EAINT-7548/LEDGER.md] [ts: EAINT-7548]
- Payment Reference No format {yymmdd}{0017}{000001}-{vehicle}. Vehicle number prints with spaces (for example “WU 4444”). [azfar: cr/EAINT-7548/LEDGER.md] [mine: knowledge/business-rules-from-test-scenarios.md]
- Buyer block: blank SST prints “n/a”. Blank PIC contact falls back to the company contact. Blank PIC email falls back to the Director/Owner email. [mine: knowledge/business-rules-from-test-scenarios.md]
- A partial bundle failure gives an invoice with only the successful part. Classification code 022 is used for SSM and JomCheck lines. [mine: knowledge/business-rules-from-test-scenarios.md]
- e-Invoices can only be issued for transactions in the current calendar month. [ts: EAINT-8550] [mine: knowledge/business-rules-from-test-scenarios.md]
- New documents carry the eAuto logo with TM. Documents already approved keep the old logo (EAINT-9555). Hotline [hotline number omitted] and the new address (Level 15 Sunway Tower) apply; documents before 5/5/2025 keep the old address (EAINT-8620 / 8627). [mine: knowledge/business-rules-from-test-scenarios.md]
- [unconfirmed] An Approved transaction with e-Invoice Failed (“Submission failed due to unexpected error”) was seen. What the dealer should do is unknown. [azfar: knowledge/portals/ucd/portal.md]
- Staging company “FAIZUDDIN AUTO TEST 2” has an invalid TIN ready-made. [azfar: knowledge/portals/ucd/how-we-test.md]

### QA scope to check
- Check buttons and PDFs for valid, invalid and blank TIN on UCD and BO details, for every module (EAINT-8550 sheets: Invalid or Blank TIN, New Transactions, Existing, Buyer, Supplier & Amount). [ts: EAINT-8550]
- Check Document Code sequence and description wording per module. [mine: knowledge/business-rules-from-test-scenarios.md]
- Check listing columns and filters (e-Invoice Status, Submission Date, LHDN Response Status, e-Invoice Validation Date). [ts: EAINT-7548] [azfar: cr/EAINT-7548/LEDGER.md]
- Check amounts: item lines, SST, JPJ/FIS/eAuto split, price after a fee change. [ts: EAINT-7548] [azfar: knowledge/_core/fees-and-pricing.md]
- Check the monthly resubmission after the TIN is corrected. [azfar: cr/EAINT-12022/01-research/study.md]
- Check the BO Consolidated e-Invoice Listing (Type, Payment Date From/To, LHDN status, Submission Date, Proforma Invoice Only). [azfar: cr/_boards/miro-preapp-application/t17_3458764662353826470.tsv]
- Check JomCheck invoice split RM18 + RM2 (EAINT-12412). [azfar: cr/EAINT-12022/01-research/study.md] [jira: EAINT-12412]

### Ticket history
- EAINT-2450 (2025-06): e-Invoice (earlier ticket in the e-Invoice family) [latest]
- EAINT-7548 (2025-05): e-Invoice templates and listings (umbrella, To Do) [latest]
- EAINT-8550 (2025-10): New Invoice template for users with invalid or blank TIN [latest]
- EAINT-8659: Document Code sequence with no gaps [latest]
- EAINT-8655: eDereg Pre-Checking e-Invoice [latest]
- EAINT-9043: eDereg Pre-Checking e-Invoice (follow-up) [latest]
- EAINT-9555: eAuto logo with TM on documents [latest]
- EAINT-8620: Address and hotline change on documents [latest]
- EAINT-8627: Address and hotline change (follow-up) [latest]
- EAINT-9058: e-Invoice ticket listed in Faizuddin’s e-Invoice notes [latest]
- EAINT-9059: e-Invoice ticket listed in Faizuddin’s e-Invoice notes [latest]
- EAINT-12412 (2026-10): JomCheck charge split (RM18 + RM2) on invoices [latest]
- EAINT-12130 (2026-08): Contact Us: hide eAuto bank account [latest]

### Open questions
- e-Invoice retry for an Approved transaction whose e-Invoice failed is unknown.
- Buyer contact number source is marked “details source?” in the EAINT-7548 template.
- Ask eAuto answers for e-Invoice (Q16 and the gap question on the monthly job day) have not arrived yet.

## Flow: Consolidated e-Invoice and revenue report jobs
- Failed e-Invoices are re-sent in bulk as consolidated e-Invoices by a monthly job. BO and UCD can see the result in listings.
- Portals: Back Office, LHDN MyInvois

### Entry points and steps
- Entry point "Monthly consolidated e-Invoice cronjob (EAINT-9845)": Scheduled backend job (live since S27.6-20260318) [azfar: cr/EAINT-12022/01-research/study.md]
  1. Job picks LHDN-failed e-Invoices | Selects e-Invoices that failed (for example invalid TIN) where the TIN is now fixed. Re-sends them as consolidated. In staging TS the transaction is “patched to previous month” to test it. [azfar: cr/EAINT-12022/01-research/study.md]
  2. Result | Consolidated e-Invoice Listing shows rows by Type (STMS, …, Pre-Application, Application, Insurance Cancellation). | affects: BO Consolidated e-Invoice Listing [azfar: cr/_boards/miro-preapp-application/t17_3458764662353826470.tsv]
- Entry point "BO Consolidated e-Invoice Listing": Back Office › e-Invoice / Consolidated e-Invoice Listing [azfar: cr/_boards/miro-preapp-application/t17_3458764662353826470.tsv]
  1. Filter and read | Filters: Type, Payment Date From/To, LHDN e-Invoice Status, Consolidated e-Invoice Submission Date, “Proforma Invoice Only”. EAINT-9063 added eDereg Pre-Checking to the Type filter (S22.9-20251029). [azfar: cr/_boards/miro-preapp-application/t17_3458764662353826470.tsv] [azfar: cr/EAINT-3090/LEDGER.md]

### Cross-module effects (what it affects)
- Finance sees the Revenue Report (live in some form via EAINT-8772 / 8816 exports, EAINT-10120 cronjob, EAINT-12260 fix S33.4-20260910). [azfar: cr/EAINT-12022/01-research/study.md]
- LHDN receives the consolidated e-Invoice. [azfar: cr/EAINT-12022/01-research/study.md]

### Cronjobs
- Monthly consolidated e-Invoice cronjob (EAINT-9845) | Monthly; the day is not recorded | Re-sends LHDN-failed e-Invoices (invalid TIN fixed) as consolidated. [azfar: cr/EAINT-12022/01-research/study.md]
- [unconfirmed] Revenue Report cronjob (EAINT-10120) | Unknown | Builds the Revenue Report. [azfar: cr/EAINT-12022/01-research/study.md]
- Pre-Application / Application consolidated resubmission | Monthly | Re-sends LHDN-failed onboarding payment e-Invoices. Remarks: “No TIN info has been provided.” or “TIN verification failed. Kindly provide correct TIN information to eAuto customer service.” [azfar: cr/_boards/miro-preapp-application/t36_3458764647399514416.tsv]

### Roles
- BO Finance and Ops. [azfar: knowledge/_index/sharepoint-studied.md]

### Where the transaction goes
- Rows in the Consolidated e-Invoice Listing with the LHDN status. [azfar: cr/_boards/miro-preapp-application/t17_3458764662353826470.tsv]

### Rules
- [unconfirmed] The Revenue Report scope for Insurance Cancellation is an open question (Q16 in Azfar’s list). [azfar: cr/EAINT-12022/01-research/study.md]

### QA scope to check
- Check a failed e-Invoice becomes consolidated after the job and the TIN fix. [azfar: cr/EAINT-12022/01-research/study.md]
- Check the listing filters and Type values, including Pre-Application and Application. [azfar: cr/_boards/miro-preapp-application/t17_3458764662353826470.tsv]
- Check the remark text for blank and invalid TIN. [azfar: cr/_boards/miro-preapp-application/t36_3458764647399514416.tsv]

### Ticket history
- EAINT-9845 (2026-03): Monthly consolidated e-Invoice cronjob (live S27.6-20260318) [latest]
- EAINT-9063 (2025-10): Add eDereg Pre-Checking to the consolidated listing Type filter [latest]
- EAINT-10120: Revenue Report cronjob [latest]
- EAINT-12260 (2026-09): Revenue Report fix (S33.4-20260910) [latest]

### Open questions
- On which day the monthly job runs is not recorded. Ask eAuto gap question 6 has not been answered yet.

## Flow: UCD payment reports and downloads
- Dealers can export payment reports, download weekly invoice bundles and read the payment breakdown for tax and accounts.
- Portals: UCD portal (Reports), AATF portal, Back Office

### Entry points and steps
- Entry point "UCD › Reports › UCD Payment Report (EAINT-7495)": UCD › Reports › UCD Payment Report [mine: knowledge/business-rules-from-test-scenarios.md] [azfar: cr/EAINT-7495/LEDGER.md]
  1. Search and export | Payment Date defaults to today, max 30 days, no future dates. Export name Payment_Report_{ddMMyyyy}_{hh_mm_AM}. [mine: knowledge/business-rules-from-test-scenarios.md] [azfar: cr/EAINT-7495/LEDGER.md]
- Entry point "UCD › Reports › Download Payment Document (EAINT-8514, EAINT-7496)": UCD › Reports › Download Payment Document › Generate [ts: EAINT-8514] [azfar: cr/EAINT-7496/LEDGER.md]
  1. Pick month and year, Generate, download a week | Weekly rows, past weeks only (the current week cannot be downloaded). Zip name payment_documents_{UCD_Company_ID}_YYYY-MM-DD_to_YYYY-MM-DD with Invoice and e-Invoice PDFs. Pressing Generate builds the latest set (no cronjob). Totals = eSTM + STMS + APT. [ts: EAINT-8514 TS1-TS6] [azfar: cr/EAINT-7496/LEDGER.md]
- Entry point "Payment Breakdown Report (EAINT-3090)": UCD › Reports and BO › Report › Payment Breakdown Report [ts: 3090] [azfar: cr/EAINT-3090/LEDGER.md]
  1. Choose range and type, download | Payment Date range max 1 month. Types: BMK, TH, eLKM, eVOC, SSM, JomCheck, eSTM, STMS, APT, All. Output PDF and Excel. Columns: Tarikh Invoice, Tarikh Bayaran, No Rujukan, No Transaksi, Document Code, No Kenderaan, Keterangan, Mod Bayaran, JPJ, FIS, eAuto, Service Tax. [ts: 3090_TS1-TS3] [azfar: cr/EAINT-3090/LEDGER.md]
- Entry point "AATF Payment Report (EAINT-9715)": AATF portal › Payment Report [mine: knowledge/business-rules-from-test-scenarios.md] [jira: EAINT-9715]
  1. Same filters, types All / DEREG / eDereg Pre-Checking | affects: dereg [mine: knowledge/business-rules-from-test-scenarios.md]
- Entry point "BO SST Payment Report (eAuto Plus)": Back Office › SST Payment Report [azfar: cr/EAINT-3090/LEDGER.md]
  1. Read the report | Includes JomCheck lines (shown in EAINT-12339 TS). [azfar: cr/EAINT-3090/LEDGER.md]

### Cross-module effects (what it affects)
- Documents equal the Invoice and e-Invoice PDFs on eSTM / STMS / APT details pages. The invalid/blank TIN template is used where it applies. [ts: EAINT-8514 TS3-TS4]
- A fee change shows both fee versions in the reports for old and new transactions. [mine: knowledge/business-rules-from-test-scenarios.md]

### Cronjobs
- Weekly document zip job (old design) | None now | EAINT-8514 note: “No longer using cronjob - Clicking [Generate] will generate latest set of documents”. [ts: EAINT-8514 TS1]

### Roles
- UCD main and sub users for their own company. AATF for AATF. BO for the BO report. [mine: knowledge/business-rules-from-test-scenarios.md]

### Where the transaction goes
- Files download to the browser. [ts: EAINT-8514]

### Rules
- Download Payment Document zip name is payment_documents_{UCD_Company_ID}_YYYY-MM-DD_to_YYYY-MM-DD. [mine: knowledge/business-rules-from-test-scenarios.md] [azfar: cr/EAINT-7496/LEDGER.md]
  - Conflict: other version: Earlier zip name {UCD Company ID}-YYYYMMDD-YYYYMMDD; PDFs named {Transaction No.}_YYYYMMDD.pdf. [ts: EAINT-8514 TS2] (EAINT-7496 is newer; later wins.)
- Payment Report: Payment Date max 30 days. Breakdown: max 1 month. This matches the standard one-month date rule. [mine: knowledge/business-rules-from-test-scenarios.md] [azfar: cr/EAINT-3090/LEDGER.md]

### QA scope to check
- Check filters, default dates, maximum range and export file names. [mine: knowledge/business-rules-from-test-scenarios.md]
- Check past month, current month, all months; valid, invalid and blank TIN; transactions from before the deploy. [ts: EAINT-8514]
- Check the PDF contents equal the details page PDFs. [ts: EAINT-8514 TS3-TS4]
- Check Breakdown columns and amounts per type, in PDF and Excel. [ts: 3090]

### Ticket history
- EAINT-3090 (2026-05): Payment Breakdown Report [latest]
- EAINT-7495 (2026-05): UCD Payment Report (S29.5-20260520) [latest]
- EAINT-7496 (2026-04): Download Payment Document (extends 8514) [latest]
- EAINT-8514 (2025-07): Download Payment Document base behaviour [legacy, superseded by EAINT-7496]
- EAINT-9715: AATF Payment Report [latest]
