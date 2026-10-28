# EAINT-12412 — Jira capture (27/10/2026, 7:00:33 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** 🔴[eAuto-UCD & BackOffice] JomCheck: Split Invoice & e-Invoice Charge into JomCheck Service Charge and eAuto Service Charge
2. **Type:** Task · **Status:** Done · **Priority:** Medium
3. **Assignee:** Chee Mei Jia · **Reporter:** Chee Mei Jia · **QA (cf 10041):** Muhammad Faizuddin Bin Bidi
4. **Fix versions:** S34.13-20261021 🌞 (2026-10-21)
5. **Labels:** 260928-261002, ProductBacklog, September2026
6. **Created:** 2026-09-28T08:45:53.025+0800 · **Updated:** 2026-10-21T14:17:42.816+0800
7. **Exp. Deploy Date (cf 10087):** 2026-10-21 · **ETA for Testing (cf 10057):** 2026-10-12 · **[QA] Est Man-day (cf 10081):** 2
8. **Links:** —
9. **Sub-tasks:** EAINT-12554 [eAuto - BO] JomCheck Invoice still shows 1 line after resubmitting an old failed transaction
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | UCD & BackOffice |
| 2 | Affected Module | JomCheck – Invoice & e-Invoice |
| 3 | Request | Split single JomCheck charge on invoice into 2 line items to show actual fee breakdown. |
| 4 | Existing Issue/Behaviour | - Invoice shows only 1 line item: "JomCheck service charge" – RM20.00 + SST RM1.60 = RM21.60. - Amount and fees shown do not reflect actual fee breakdown. |
| 5 | Expected New Handling/Behaviour | - Line 1 – JomCheck report: RM18.00 + SST 8% (RM1.44) = RM19.44. - Line 2 – JomCheck service charge: RM2.00 + SST 8% (RM0.16) = RM2.16. - Total charge remains RM21.60 including SST. - Same breakdown to apply on both invoice and e-Invoice. |
| 6 | Additional Note | Only breakdown changes, total payable amount stays same. |
SRD:
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 28.09.2026 (Mon) | v0.1 | Initial Draft |  |
| 2 | 29.09.2026 (Tue) | v0.2 | Updated revenue split, scope and line item wording | SRD:   Invoice (Sample):    e-Invoice (Sample): |
| 3 | 30.09.2026 (Wed) | v0.3 | Updated line item names and classification code | SRD:   Invoice (Sample):    e-Invoice (Sample): |
| 4 | 30.09.2026 (Wed) | v1.0 | Baseline | SRD:   Invoice (Sample):    e-Invoice (Sample): |

## Comments (0)

## Attachments

1. sample_EAINT-12412_JomCheck e-Invoice_20260929.pdf — 17798 bytes, 2026-09-29T16:01:06.547+0800, by Chee Mei Jia
1. sample_EAINT-12412_JomCheck e-Invoice_20260930.pdf — 17700 bytes, 2026-09-30T15:52:34.712+0800, by Chee Mei Jia
1. sample_EAINT-12412_JomCheck e-Invoice_20260930 (0b413b78-f097-4204-a83e-021ae23281a7).pdf — 17700 bytes, 2026-09-30T15:52:34.914+0800, by Chee Mei Jia
1. sample_EAINT-12412_JomCheck Invoice_20260929.pdf — 14962 bytes, 2026-09-29T16:01:07.850+0800, by Chee Mei Jia
1. sample_EAINT-12412_JomCheck Invoice_20260930.pdf — 14964 bytes, 2026-09-30T15:52:33.997+0800, by Chee Mei Jia
1. sample_EAINT-12412_JomCheck Invoice_20260930 (dab0b0ea-21e0-4a55-8c10-1b69f4d0da28).pdf — 14964 bytes, 2026-09-30T15:52:35.437+0800, by Chee Mei Jia
1. SRD_EAINT-12412_v0.1_20260928.docx — 16369 bytes, 2026-09-28T10:15:48.274+0800, by Chee Mei Jia
1. SRD_EAINT-12412_v0.2_20260929.docx — 17108 bytes, 2026-09-29T16:01:07.536+0800, by Chee Mei Jia
1. SRD_EAINT-12412_v0.3_20260930.docx — 17099 bytes, 2026-09-30T15:52:35.141+0800, by Chee Mei Jia
1. SRD_EAINT-12412_v1.0_20260930.docx — 17145 bytes, 2026-09-30T15:52:34.235+0800, by Chee Mei Jia
1. SRD_EAINT-12412_v1.0_20260930 (df546cbb-b31e-46b9-90f1-3d73e05475c9).pdf — 212000 bytes, 2026-10-09T09:35:23.629+0800, by Chee Mei Jia