# EAINT-11823 — Jira capture (27/10/2026, 5:47:57 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** [eAuto - BO / JPJ Hasil] Downloaded PDF does not match View Report data for eSTM Reconciliation Summary
2. **Type:** QA-Issue · **Status:** Done · **Priority:** Medium
3. **Assignee:** zhan.choon · **Reporter:** Siti Nur Azila · **QA (cf 10041):** —
4. **Fix versions:** —
5. **Labels:** —
6. **Created:** 2026-06-22T14:55:13.213+0800 · **Updated:** 2026-06-22T15:45:06.512+0800
7. **Exp. Deploy Date (cf 10087):** — · **ETA for Testing (cf 10057):** — · **[QA] Est Man-day (cf 10081):** —
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** EAINT-10168 🔴[eAuto-BackOffice] To Create eAuto Reconciliation Summary Report for eAuto Core Modules, JomCheck and Insurance

## Description

Test env: /preprod2
Browser: Chrome 
Affected page: 
- BO - eAuto Reconciliation Summary Listing
- JPJ Hasil - Laporan Ringkasan Penyamaan Penyata eAuto (Consolidated)
Actual Result
View page displays:
- H0272423 – Bayaran Pertukaran Hakmilik Kenderaan (eSTM) (eAuto=1, RHB=1)
- H0272424 – Bayaran Tuntutan Hakmilik Kenderaan (eAuto=1, RHB=N/A)
Downloaded PDF displays:
- H0272423 only
- H0272424 is missing
Expected Result
The downloaded PDF should display the same reconciliation data as shown on the View page, including all result codes and transaction counts. H0272424 should be included in the PDF export if it is displayed in the report view.

## Comments (1)

### Siti Nur Azila — 2026-06-22T15:45:03.637+0800

Retested & Verified OK on staging/preprod2

## Attachments

1. image-20260622-065637.png — 312157 bytes, 2026-06-22T14:56:51.632+0800, by Siti Nur Azila
1. image-20260622-065645.png — 27519 bytes, 2026-06-22T14:56:51.400+0800, by Siti Nur Azila
1. image-20260622-074459.png — 76531 bytes, 2026-06-22T15:45:02.663+0800, by Siti Nur Azila