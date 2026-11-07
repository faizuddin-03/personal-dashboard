# Brief — EAINT-12745 C2C functional TS (Faizuddin's sheets)

You draft Test Scenarios (TS) for ONE OR TWO sheets of the official shared workbook. Output JSON only to the file path given in your task. Do not touch Excel. Do not edit repo files.

## The module
C2C = new eAuto UCD-portal module. Motorcycle ownership transfer from an individual SELLER (customer) directly to an individual BUYER (customer). UCD dealer only enters data; never owner. Takes the customer side of STMS (seller MyKad/MyPR + thumbprint, vehicle) and the customer side of eSTM (buyer MyKad/MyPR + thumbprint, payment, transfer). No dealer thumbprint. C2C has ITS OWN TABLES and its own BackOffice pages / JPJ XML log. Statuses: Pending, Cancelled, Expired, Failed, Approved. Save & Continue max 7 days (rule TBC). Add-ons: buyer Insurance, e-LKM, e-VOC; seller LKM Refund + Insurance Cancellation (CONFIRMED IN by Faizuddin 2026-11-06). 69E (no valid insurance) redirects to insurance. Fee TBC. MyKad & MyPR only, no Company.
Expected results: follow EXISTING STMS / eSTM / add-on behaviour and wording (mockup is flow-only). If the ticket, notes or existing behaviour do not say, write "TBC (Q#)" using an Open Question number below. Never guess.

## Read these (repo root C:\Users\Faizuddin\Documents\GitHub\personal-dashboard)
1. _reference/tickets/EAINT-12745/EAINT-12745-test-scope-2026-11-06.md — compiled scope (groups A–U) — MAIN INPUT.
2. _reference/tickets/EAINT-12745/README.md (Jira text, open decisions), EAINT-12745-meeting-notes-2026-11-05.md, EAINT-12745-transcript-findings-2026-11-05.md, EAINT-12745-ask-eauto-2026-11-06.md.
3. knowledge/flow-c2c.md, and for existing behaviour/wording: knowledge/flow-stms.md, flow-estm.md, flow-stms-addons.md, flow-ucd-shell.md, flow-bo-shell.md, flow-payments-fees.md, eauto-payments.md, flow-insurance-purchase.md, jpj-xml-log.md, production-regression-scope.md, flow-ucd-to-ucd.md, flow-platform.md. Grep, don't read all fully.

## Ticket clause refs (Jira item 5) — use in "ref"
T5a-i C2C tile after UCD TO UCD, motorcycle icon, "Individual to Individual", "Motorcycle Ownership Transfer Only". T5a-ii keep existing layout/colours/nav/sidebar. T5a-iii available to all UCD accounts: listing, new application, continue saved.
T5b-i individuals only, block company combos. T5b-ii motorcycles only, validate category. T5b-iii both IC + thumbprint.
T5c-i seller IC + thumbprint, STMS interface. T5c-ii LKM Refund + Insurance Cancellation optional. T5c-iii LKM Refund RM, IC %, service charge separate, pending/unavailable message.
T5d-i vehicle enquiry. T5d-ii seller vs registered owner, JPJ checks. T5d-iii block on mismatch with reason.
T5e-i buyer IC + thumbprint eSTM interface. T5e-ii Insurance/e-LKM/e-VOC. T5e-iii premium, statutory, service charge separate.
T5f-i final checks + review. T5f-ii one continuous record, seller→buyer direct.
T5g-i itemised summary C2C charge, statutory, add-ons, tax, total. T5g-ii refund shown separately. T5g-iii existing payment mechanism, payment ref + outcome, no duplicate deductions.
T5h-i submit after checks + payment, record JPJ ref + response. T5h-ii success only after confirmed; pending/failed/completed distinct. T5h-iii track main + each add-on; acknowledgement, receipt, documents from the transaction.
T5i-i save & resume max 7 days. T5i-ii saved status + expiry date/time in listing and application. T5i-iii block after expiry with expired message.
T5j-i unique C2C reference linking seller, buyer, motorcycle, verification, payment, JPJ response, add-on refs. T5j-ii reuse access controls + audit records. T5j-iii keep reference + outcome after interruption; no duplicate payments/submissions.
Meeting notes 05.11 → ref "Notes 05.11". Must Change Modules row → ref "MCM #n". Existing behaviour → ref the knowledge file, e.g. "flow-estm".

## Open Questions already in the workbook (use as TBC (Q#))
Q2 seller first, buyer later. Q3 6 vs 4 steps. Q4 C2C fee/wording/tax. Q5 no-quotation add-on hide vs disabled. Q6 status meaning, cancel until which step, refund. Q7 7-day rule details. Q8 resubmit limit/charge. Q9 contact fields + notification text/channel. Q10 make/model rules, car category from JPJ. Q11 company-level permission / company types. Q12 payment fail/uncertain/refund. Q13 same motorcycle active across C2C/STMS/eSTM/UCD TO UCD. Q14 BO roles, reports, notifications, mobile. Q16 build for 17th. Q17 IDD. Q24 tick/untick add-ons at payment. Q25 vehicle type default. Q26 wording instead of price. Q27 address typed or from IC. Q28 30-day post-approval handling. Q29 Save & Continue hidden for demo. Q31 engine/chassis/year typed or from enquiry. Q32 eVOC email required when e-VOC unticked. Q33 confirm tick before JPJ check. Q34 listing columns/filters/actions. Q37 insurance line in summary. Q38 two-layer approval / pay-over-counter. Q39 quote expiry vs 7 days. Q40 who resubmits after payment (dealer vs HubAdmin). Q41 duplicate definition. Q42 C2C name in BO/finance reports type lists. Q43 same person seller and buyer. Q44 card must match category. Q18 declaration text (Legal). Q19 PDPA. Q20 account-owner verification. Q22 UCD account types lacking STMS/eSTM. Q23 69E with seller-first.
New ones Faizuddin is adding: Q45 Transfer History purchase in C2C? Q46 JPJ region code source. Q47 JPJ receipt email recipient. Q48 Hak Milik / FIS for buyer, Credit (HP) portal visibility, vehicle under loan. Q49 insurance permission + Commercial Agreement gate for C2C insurance. Q50 quotation reminder email for C2C quotes. Q51 Kod Hasil / JPJ revenue code / RHB Ref 2 suffix / invoice line text. Q52 Perakuan expand-collapse and lock-once-ticked behaviour. Q53 sub-UCD e-LKM RM2,000 cap applies. Q54 UCD user's own IC as seller or buyer. Q55 seller/buyer copies of JPJ receipt and Slip Pengesahan.

## Must Change Modules (# → module → sheet)
1 Home tiles→HOME. 2 C2C Transaction Listing (new, 5 statuses)→LIST. 3 create flow→E2E (not yours). 4 details: Invoice, e-Invoice, receipt, documents→DTL. 5 Insurance + Insurance Transaction Listing: policy bought in C2C shows + links to C2C record→E2E. 6 Payment Breakdown Report→RPT. 7 Download Payment Document→RPT. 8 UCD Payment Report (type filter)→RPT. 9 BO C2C Transaction (new listing + details)→BO. 10 RHB Payment Transaction→FIN. 11 e-Invoice / Consolidated e-Invoice Listing (16 types, C2C needs one)→FIN. 12 Transaction Summary Report→FIN. 13 Transaction Summary Report (State)→FIN. 14 Statement of Account (UCD)→FIN. 15 JPJ Reports (payment report, type=Office)→FIN. 16 GST/SST Payment Report→FIN. 17 Revenue Report→FIN. 18 BO Insurance Transaction Listing: C2C policy appears and links→BO. 19 Resubmit Pending STMS, APT & eSTM (C2C pending needs a way back)→BO D. 20 Resubmit JPJ Final Submission (STMS) / 21 (eSTM): C2C own page or entry→BO D. 22 Support Audit Log→BO D. 23 Pending STMS, APT & eSTM Audit Log→BO D. 24 Blacklist MyKad No.→E2E. 25 Manual Payment Processing→FIN. 26 Generate Batch Invoice→FIN. 27 JPJ XML Log (C2C) new→BO D. 28 Bulk Submission Setup + Audit Log→E2E. 29 Bulk Submission Control maintenance→E2E. 30 eAuto STMS, APT and eSTM Transaction Listing (JPJ report)→FIN. 31 JPJ Reconciliation Report (HASIL), JPJ fee RM1 motorcycles→FIN. 32 eAuto Reconciliation Summary Report→FIN. 33 eAuto Reconciliation Summary Listing (CJ, configurable)→FIN. 34 JPJ Hasil portal Senarai Transaksi (checkbox per type)→FIN. 35 Laporan Ringkasan Penyamaan Penyata→FIN. 36 7-day expiry job→E2E. 37 Completion notice→E2E. 38 JPJ integration→E2E. 39 Automatic daily bank reconciliation (CJ)→FIN. 40 Revenue CSV (Tue, Fri, 1st)→FIN. 41 Payment sync into e-invoicing→FIN. 42 Association month-close→FIN. 43 Search index / QUICK SEARCH→BO B.

## Sheet sections
HOME (Homepage & Access): A. FUNCTIONAL — C2C tile position, icon, wording; rest of homepage unchanged. B. ACCESS & PERMISSION — main UCD, sub-user, each company type; who sees tile, who is blocked.
LIST (C2C Listing): A. FUNCTIONAL — columns, values, status labels, saved date and expiry shown, paging. B. SEARCH & FILTER — each search field and filter, alone and combined, no result, reset. C. ACTIONS — Continue, Cancel, Resubmit, View; shown only for the right status.
DTL (Details & Documents): A. FUNCTIONAL — seller, buyer, motorcycle, add-ons, payment and JPJ details shown correctly. B. DOCUMENTS — acknowledgement, receipt, invoice, e-Invoice, add-on documents open with right values.
RPT (UCD Reports): A. FUNCTIONAL — Payment Breakdown, Download Payment Document, UCD Payment Report show C2C rows and amounts. B. SEARCH & FILTER — C2C as a type in each report filter, date range, export.
BO (BackOffice C2C): A. FUNCTIONAL — listing columns, details page, status, payment and JPJ data. B. SEARCH & FILTER — each search field and filter, Quick Search finds C2C. C. ROLES & PERMISSION — HubAdmin, Admin, Probation, Normal: see and do. D. ACTIONS & AUDIT — resubmit, cancel, reset payment, export, audit trail log.
FIN (BackOffice Finance & JPJ): A. FUNCTIONAL — reconciliation, RHB Payment Transaction, SST, Revenue, e-Invoice listing, JPJ monthly report, Transaction Summary. B. SEARCH & FILTER — C2C as a type in each report filter, date range, export.
REG (Regression): A. STMS — seller flow end to end, Save & Continue, listing. B. ESTM — buyer flow end to end, add-ons, listing. C. UCD TO UCD — Standard and Interstate. D. PAYMENT & ADD-ONS — RHB payment, Insurance, e-LKM, e-VOC, LKM Refund from existing flows. E. BACKOFFICE — STMS and eSTM listing, resubmit pages, reports.

## Writing rules (copied from the workbook's Overview)
1. One check per TS. Test Scenario = one line.
2. Test Steps = numbered "1. ... 2. ..." lines in one string separated by "\n". Start from login ("1. Login to eAuto as Main UCD") or "As 12745_<CODE>_TSxx" to reuse steps (only reference TS within your own sheet by its position, e.g. "As LIST A1" — the lead will renumber; write "As <SHEET> <section><n>").
3. Expected Result = "Ensure:\n1. <Page> -> <what shows>\n2. ..." Copy screen text exactly when known (quote it). Use "TBC (Q#)" where unknown.
4. Priority P1 / P2 / P3: P1 = the change itself, one attempt (new C2C pages, types appear, core filters, permissions); P2 = variations, combinations, boundaries; P3 = cosmetic / rare. Aim ~55% P1, 35% P2, 10% P3.
5. Pre-condition / Test Data: who logs in, which records must exist (e.g. "Approved C2C record with e-LKM + e-VOC", "Failed C2C (JPJ 4K)"). Never invent IC numbers or plates.
6. Ref: clause / Notes 05.11 / MCM #n / knowledge file.
7. Remarks: optional, short (e.g. "Not in mockup", "Existing STMS wording").
8. Be exhaustive within your sections: every column, every filter alone and combined, empty result, reset, date-range limit (eAuto date filters max one month From→To), export file name/columns, paging, sort, each status × each action, each role, each report × C2C type × filter × export. Regression: protect existing flows end-to-end. "Every single thing" — the lead wants the full iceberg, not the tip.
9. Plain text only, no markdown.

## Output
JSON array to the given file:
[{"sheet":"LIST","section":"A","priority":"P1","scenario":"...","precondition":"...","steps":"1. ...\n2. ...","expected":"Ensure:\n1. ...","ref":"T5a-iii","remarks":""}]
Return to the lead only: the file path and a count per section.
