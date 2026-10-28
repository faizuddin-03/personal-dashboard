# EAINT-12119 — Jira capture (27/10/2026, 7:00:32 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** 🔴[eAuto-UCD] Logistics: Interstate Price Tier for Logistics Delivery (Wholesale and Standalone Service)
2. **Type:** Task · **Status:** Done · **Priority:** Medium
3. **Assignee:** Chee Mei Jia · **Reporter:** Chee Mei Jia · **QA (cf 10041):** An Qi Lee, Hui Xin Lee
4. **Fix versions:** S34.9-20261012 🌚 (2026-10-12)
5. **Labels:** 260727-260731, July2026, ProductBacklog
6. **Created:** 2026-07-30T12:33:02.995+0800 · **Updated:** 2026-10-16T10:16:15.894+0800
7. **Exp. Deploy Date (cf 10087):** 2026-10-12 · **ETA for Testing (cf 10057):** 2026-09-14 · **[QA] Est Man-day (cf 10081):** —
8. **Links:** Relates: EAINT-11824 🔴[eAuto-Wholesale 2.0] Logistics Pricing - Matrix; Relates: EAINT-12453 🟣[eAuto-UCD] Wholesale Complete Payment - Request Approval fails after an approved deal is re-priced; Relates: EAINT-12454 🟣[eAuto-UCD] Wholesale Complete Payment - Requester not notified after the Decision Maker approves a full payment; Relates: EAINT-12456 🟣[eAuto-UCD] Complete Payment page labels the logistics row "Door-to-Door Logistic Fee" instead of "Logistic Fee"
9. **Sub-tasks:** —
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | UCD |
| 2 | Affected Module | Logistics (new standalone module) |
| 3 | Request | To introduce interstate price per car for each logistics delivery, charged based on a four-tier pricing structure. Applicable to both Wholesale and Standalone logistics service. |
| 4 | Existing Issue/Behaviour | - Current wholesale logistics does not have interstate price. - Delivery charges follow the existing tier only, with no separate interstate rate. |
| 5 | Expected New Handling/Behaviour | - To allow input of interstate price per car for each delivery. - Interstate price to follow the tier structure below: - Tier 1 (Base): original price range less than or equal to 250, suggested base rate 300 - Tier 2 (Standard): original price range 251 to 400, suggested base rate 450 - Tier 3 (Extended): original price range 401 to 600, suggested base rate 650 - Tier 4 (Premium): original price range more than 600, suggested base rate 1,000 - Interstate price follows the tier, corresponding to the charge given by the logistics company to eAuto. - Applicable to both Wholesale and Standalone logistics service. |
| 6 | Additional Note | Refer to the attached Excel file in EAUTO-1004 for the full interstate charges listing. |
SRD:
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 06.08.2026 (Thurs) | v0.1 | Initial Draft |  |
| 2 | 07.08.2026 (Fri) | v0.2 | Updated based on review feedback | SRD:     HTML Sample: |
| 3 | 13.08.2026 (Thurs) | v0.3 | Updated based on sync-up with Developer | SRD:      HTML (MockUp): |
| 4 | 20.08.2026 (Thurs) | v0.4 | Updated based on discussion with Nurul on 20.08.2026 | SRD:      HTML (MockUp): |
| 5 | 27.08.2026 (Thurs) | v0.5 | Updated Sections 2.2.5, 2.2.6 and 2.2.10 | SRD:      MockUp (Sample): |
| 6 | 08.09.2026 (Tues) | v0.6 |  | SRD:     MockUp (Sample): |
| 7 | 09.09.2026 (Wed) | v0.7 | Updated Sections 1.5, 2.2.6, 2.2.8 and 2.2.10 |  |
| 8 | 10.09.2026 (Thurs) | v0.8 | Updated Sections 2.2.6, 2.2.8 and 2.2.9 | SRD:     Mock Up (Sample): |
| 9 | 11.09.2026 (Fri) | v0.9 | Updated Sections 2.2.5 and 2.2.6 | SRD:   Mockup (Sample): |
| 10 | 11.09.2026 (Fri) | v1.0 | Sent out for external review | SRD:   Mockup (Sample): |
| 11 | 15.09.2026 (Tues) | v1.1 | Updated Section 2.2.6 | SRD: |
| 12 | 18.09.2026 (Fri) | v1.2 | Updated Section 2.2.9 | SRD: |
| 13 | 23.09.2026 (Wed) | v1.3 | Added Sections 2.2.11 and 2.2.12. Updated Sections 1.4, 2.2.3, 2.2.4 and 2.2.9 | SRD:   BackOffice MockUp (Sample): |

## Comments (0)

## Attachments

1. EAINT-12019_eMOVE_Logistics_Backoffice_20260807.html — 59293 bytes, 2026-08-07T17:03:23.964+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE_Logistics_Backoffice_20260814.html — 36570 bytes, 2026-08-14T17:02:33.205+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE_Logistics_Backoffice_20260821.html — 43060 bytes, 2026-08-21T16:36:33.197+0800, by Chee Mei Jia
1. EAINT-12019_eMOVE_Logistics_Backoffice_20260827.html — 46489 bytes, 2026-08-27T16:21:35.476+0800, by Chee Mei Jia
1. EAINT-12119_eMOVE_Logistics_Backoffice_20260908.html — 58953 bytes, 2026-09-08T17:04:07.525+0800, by Chee Mei Jia
1. EAINT-12119_eMOVE_Logistics_Backoffice_20260910.html — 57172 bytes, 2026-09-10T13:55:03.462+0800, by Chee Mei Jia
1. EAINT-12119_eMOVE_Logistics_Backoffice_20260911.html — 58039 bytes, 2026-09-11T17:24:22.942+0800, by Chee Mei Jia
1. EAINT-12119_eMOVE_Logistics_Backoffice_20260911 (356a5881-e0e2-4048-abf0-2fde963f7a28).html — 58039 bytes, 2026-09-11T17:24:24.006+0800, by Chee Mei Jia
1. EAINT-12119_eMOVE_Logistics_Backoffice_20260923.html — 70080 bytes, 2026-09-24T12:02:19.576+0800, by Chee Mei Jia
1. EAINT-12119_SRD_v0.1_20260806.docx — 19770 bytes, 2026-08-07T17:03:24.288+0800, by Chee Mei Jia
1. EAINT-12119_SRD_v0.2_20260807.docx — 21491 bytes, 2026-08-07T17:03:24.535+0800, by Chee Mei Jia
1. EAINT-12119_SRD_v0.3_20260813 (75490dfd-76cc-40bd-87c1-614d19a296d4).docx — 25109 bytes, 2026-08-14T17:02:32.946+0800, by Chee Mei Jia
1. EAINT-12119_SRD_v0.4_20260820.docx — 24791 bytes, 2026-08-21T16:36:33.537+0800, by Chee Mei Jia
1. EAINT-12119_SRD_v0.5_20260827.docx — 25468 bytes, 2026-08-27T16:21:35.187+0800, by Chee Mei Jia
1. EAINT-12119_SRD_v0.6_20260908.docx — 27668 bytes, 2026-09-08T17:04:07.832+0800, by Chee Mei Jia
1. SRD_EAINT-12119_v0.7_20260909.docx — 27942 bytes, 2026-09-10T13:55:03.732+0800, by Chee Mei Jia
1. SRD_EAINT-12119_v0.8_20260910.docx — 28714 bytes, 2026-09-10T13:55:03.170+0800, by Chee Mei Jia
1. SRD_EAINT-12119_v0.9_20260911.docx — 29163 bytes, 2026-09-11T17:24:23.470+0800, by Chee Mei Jia
1. SRD_EAINT-12119_v1.0_20260911.docx — 29111 bytes, 2026-09-11T17:24:23.214+0800, by Chee Mei Jia
1. SRD_EAINT-12119_v1.0_20260911.pdf — 346459 bytes, 2026-09-11T17:24:23.726+0800, by Chee Mei Jia
1. SRD_EAINT-12119_v1.1_20260915.docx — 29243 bytes, 2026-09-15T15:32:31.678+0800, by Chee Mei Jia
1. SRD_EAINT-12119_v1.1_20260915.pdf — 357151 bytes, 2026-09-15T15:32:31.982+0800, by Chee Mei Jia
1. SRD_EAINT-12119_v1.2_20260918.docx — 30822 bytes, 2026-09-18T15:43:40.606+0800, by Chee Mei Jia
1. SRD_EAINT-12119_v1.2_20260918.pdf — 374838 bytes, 2026-09-18T15:43:40.256+0800, by Chee Mei Jia
1. SRD_EAINT-12119_v1.3_20260923.docx — 63577 bytes, 2026-09-23T14:42:19.053+0800, by Lim Wei Ting
1. SRD_EAINT-12119_v1.3_20260923.pdf — 423464 bytes, 2026-09-23T14:42:19.429+0800, by Lim Wei Ting
1. SRD_EAINT-12119_v1.3_20260923 (0dc0b7a7-fad7-4e53-ade3-9f9092f79e7f).pdf — 431168 bytes, 2026-09-24T12:02:19.349+0800, by Chee Mei Jia
1. SRD_EAINT-12119_v1.3_20260923 (7a93c2d6-39d7-4403-b842-68c5e018e893).docx — 60088 bytes, 2026-09-24T12:02:19.053+0800, by Chee Mei Jia