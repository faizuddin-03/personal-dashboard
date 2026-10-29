# EAINT-12028 — Jira capture (28/10/2026, 4:00:45 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** 🔴[eAuto-BackOffice] New Module – Association Payment Listing (Automate Association/Vendor Payment Requests)
2. **Type:** Task · **Status:** In Development · **Priority:** Medium
3. **Assignee:** Shane · **Reporter:** Chee Mei Jia · **QA (cf 10041):** Muhammad Faizuddin Bin Bidi
4. **Fix versions:** S35.X-20261126 🌞 (2026-11-26)
5. **Labels:** 260720-260724, July2026, ProductBacklog
6. **Created:** 2026-07-21T17:01:43.207+0800 · **Updated:** 2026-10-19T14:51:36.167+0800
7. **Exp. Deploy Date (cf 10087):** 2026-11-26 · **ETA for Testing (cf 10057):** 2026-08-28 · **[QA] Est Man-day (cf 10081):** 10
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | BackOffice |
| 2 | Affected Module | New Module – Association Payment Listing |
| 3 | Request | Automate association/vendor payment requests to Associates (FMC, MMSDA, JomCheck).  System to record entries and produce summary listings that the current process lacks. |
| 4 | Existing Issue/Behaviour | Ops manually exports approved STMS, eSTM & APT transactions and compiles them in Excel by vehicle/state.  Report is sent to Finance to verify and make payment.  Process is manual, cross-division and time-consuming, with no entry records or summary listing. |
| 5 | Expected New Handling/Behaviour | 1. System retrieves data and auto-calculates monthly payment amounts to vendors.  2. Generate invoice for FMC and MMSDA.  3. Generate payment request with approval line (Ops), routed directly to Finance to view, approve and proceed with payment.  4. Track transaction listing, review date, approved date, submit-to-finance date and payment date.  5. Statement of account for FMC and MMSDA to track monthly amount and payout.  6. BackOffice view for Ops team review. |
| 6 | Additional Note | Ref: source ticket EAUTO-977 and slide deck "Payment Request to Association Automation".  Note: association name is MMSDA (deck typo "MMSD" corrected). |
SRD:
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 23.07.2026 (Thurs) | 0.1 | Initial Draft |  |
| 2 | 27.07.2026 (Mon) | 0.2 | Removed Finance handling; refined details; renumbered Requirement IDs | SRD:     HTML MockUp:      Sample of Payment Requisition Form (Shared by Fared on 28.07.2026): |
| 3 | 29.07.2026 (Wed) | 0.3 | Added association charge rates (FMC RM1, MMSDA RM2), amount calculation, and FMC & MMSDA payment request field mapping | SRD:   HTML Mock Up: |
| 4 | 30.07.2026 (Thurs) | 1.0 | Sent out for requestor to review |  |
| 5 | 31.07.2026 (Fri) | 1.1 | Added total Car/Motorcycle transaction columns (counted by JPJ Approved Date); Attn confirmed as "Marie Ann" | SRD:      HTML Mock Up: |

## Comments (0)

## Attachments

1. association-payment-listing-mockup_20260731.html — 41080 bytes, 2026-07-31T17:04:37.015+0800, by Chee Mei Jia
1. association-payment-listing-mockup.html — 40669 bytes, 2026-07-27T16:57:08.972+0800, by Chee Mei Jia
1. association-payment-listing-mockup (19acf3b0-5af5-4944-86d8-04d3f039764b).html — 40669 bytes, 2026-07-30T11:19:49.688+0800, by Chee Mei Jia
1. EAINT-12028_SRD_v0.1_20260723.docx — 20665 bytes, 2026-07-27T16:57:09.478+0800, by Chee Mei Jia
1. EAINT-12028_SRD_v0.2_20260727.docx — 20008 bytes, 2026-07-27T16:57:09.211+0800, by Chee Mei Jia
1. EAINT-12028_SRD_v0.3_20260729.docx — 24098 bytes, 2026-07-30T11:19:50.032+0800, by Chee Mei Jia
1. EAINT-12028_SRD_v1.0_20260730.docx — 41111 bytes, 2026-07-30T12:12:50.002+0800, by Chee Mei Jia
1. EAINT-12028_SRD_v1.0_20260730.pdf — 318909 bytes, 2026-07-30T12:12:49.737+0800, by Chee Mei Jia
1. EAINT-12028_SRD_v1.1_20260731.docx — 41425 bytes, 2026-07-31T17:04:37.269+0800, by Chee Mei Jia
1. EAINT-12028_SRD_v1.1_20260731.pdf — 329325 bytes, 2026-07-31T17:04:36.698+0800, by Chee Mei Jia
1. Sample ASSOCIATIONS PAYMENT REQUISITION_20260728.xlsx — 64303 bytes, 2026-07-28T08:53:21.041+0800, by Chee Mei Jia