# EAINT-8655 — Jira capture (27/10/2026, 5:19:01 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** 🔴🟠[eAuto-Dereg]  To issue eInvoice for successfully paid trx starting from 1 Nov 2025
2. **Type:** Task · **Status:** Done · **Priority:** High
3. **Assignee:** Lim Yi Link · **Reporter:** Izni Zurni · **QA (cf 10041):** Nabila Hanafi
4. **Fix versions:** S22.9-20251029 (2025-10-29)
5. **Labels:** 250804-250808, August2025, ProductBacklog
6. **Created:** 2025-08-06T19:00:21.091+0800 · **Updated:** 2025-11-06T09:27:09.715+0800
7. **Exp. Deploy Date (cf 10087):** 2025-10-29 · **ETA for Testing (cf 10057):** 2025-09-09 · **[QA] Est Man-day (cf 10081):** —
8. **Links:** Relates: EAINT-9043 🟠[eAuto-eDereg] To issue invoice for successfully paid trx starting from 1 Nov 2025
9. **Sub-tasks:** EAINT-9053 [AATF & BO][eDereg Pre-Checking] e-Invoice PDF - Incorrect 'Classification'; EAINT-9056 [AATF & BO][eDereg Pre-Checking] Listing page - To display Remarks for when LHDN Status = Failed and JPJ Pre-Checking = Failed; EAINT-9061 [AATF & BO][eDereg Pre-Checking][After Deployment, Before Cutoff] Listing & Details page - LHDN Status should be displayed with dash ( - ) for when Trx Status = Pending; EAINT-9084 QA Test Result & Test Evidence
10. **Parent:** EAINT-7548 eInvoice

## Description

Part 1 of 3: Figma Link
 https://www.figma.com/design/l3HOoBRG97sO3Nkjo9dx2l/eAuto-AATF?node-id=15-44&p=f&t=n4lURECR3w4tEKqn-0 

Part 2 of 3: SRD
| - Transaction Listing Page    (UCD + BO)  Applicable to: a. web app ✅ b. mobile app ❌ | 2.Transaction Details Page  (UCD + BO) Applicable to: a. web app ✅ b. mobile app ❌ | 3.eInvoice template  Applicable to: a. web app ✅ b. mobile app ✅ | 4.Issuance of eInvoice flow & logic  Applicable to:  a. web app ✅ b. mobile app ✅ |
| V0.1 - Initial Draft (25.08.2025 Mon) | V0.1 - Initial Draft (25.08.2025 Mon) | V0.1 - Initial Draft (24.10.2025 Fri) | High Level Process Flow: |
| V0.2 - Received feedback from internal (28.08.2025 Thurs) | V0.2 - Received feedback from internal (28.08.2025 Thurs) |  |  |
| V1.0 - Received feedback from internal (28.08.2025 Thurs)  Note: Same version as V0.2 | V1.0 - Received feedback from internal (28.08.2025 Thurs)  Note: Same version as V0.2 |  |  |
| V1.1 - Received feedback from internal (29.10.2025 Wed) | V1.1 - Received feedback from external and internal (23.10.2025 Thurs)   Changes made:   - Figure 2.2.1.1.2 - ⁠Figure 2.2.1.2.2 - Table 2.2.1.1.2 - Table 2.2.1.2.2 |  |  |
|  | V1.2 - Received feedback from external and internal (23.10.2025 Thurs)   Changes made:   - Table 2.2.1.1.2 - Table 2.2.1.2.2 |  |  |
|  | V1.3 - Received feedback from internal (29.10.2025 Wed) |  |  |

Part 3 of 3: e-invoice template from Marie
| # | Date | Attachment |
| 1 | 26.08.2025 (Tues)    Note: This is the draft version from BA team. will send this version and get Marie to feedback. |  |
| 2 | 03.09.2025 (Wed)  Note: Received feedback from Marie on 3 Sept |  |
| 3 | 29.10.2025 (Wed)  As confirmed with Marie, change classification code to “022“  Note: Received feedback from Marie on 3 Sept |  |

## Comments (1)

### Lim Yi Link — 2025-11-06T09:18:35.494+0800

Remarks: This ticket has been deployed on 29 October 2025 (Wednesday).

## Attachments

1. eDereg Pre-Checking Inv_030925.docx — 61826 bytes, 2025-10-22T18:15:48.852+0800, by Lim Yi Link
1. eDereg Pre-Checking Inv_26082025.docx — 40785 bytes, 2025-08-26T08:42:53.454+0800, by Chee Mei Jia
1. eDereg Pre-Checking Inv_291025.docx — 61940 bytes, 2025-10-29T16:02:23.977+0800, by Lim Yi Link
1. e-Invoice High Level Process Flow_20250519.png — 1384937 bytes, 2025-08-25T15:46:53.974+0800, by Lim Yi Link
1. SRD_EAINT-8655_[Listing]e-Invoice_eDereg Pre Checking_Transaction_Listing_V0.1_20250825.docx — 486357 bytes, 2025-08-25T15:46:54.208+0800, by Lim Yi Link
1. SRD_EAINT-8655_[Listing]e-Invoice_eDereg Pre Checking_Transaction_Listing_V0.2_20250828.docx — 485869 bytes, 2025-08-28T17:20:33.318+0800, by Lim Yi Link
1. SRD_EAINT-8655_[Listing]e-Invoice_eDereg Pre Checking_Transaction_Listing_V1.0_20250828.docx — 485742 bytes, 2025-08-28T17:20:33.713+0800, by Lim Yi Link
1. SRD_EAINT-8655_[Listing] e-Invoice_eDereg Pre Checking_Transaction_Listing_V1.0_20250828.pdf — 508679 bytes, 2025-08-28T17:20:33.914+0800, by Lim Yi Link
1. SRD_EAINT-8655_[Listing]e-Invoice_eDereg Pre Checking_Transaction_Listing_V1.1_20251029.docx — 497251 bytes, 2025-10-29T16:02:25.189+0800, by Lim Yi Link
1. SRD_EAINT-8655_[Listing]e-Invoice_eDereg Pre Checking_Transaction_Listing_V1.1_20251029.pdf — 537992 bytes, 2025-10-29T16:02:24.256+0800, by Lim Yi Link
1. SRD _EAINT-8655_[Transaction Detail]  Generate eInvoice For eDereg Pre-Checking Transaction Detail_20250825_V0.1.docx — 658705 bytes, 2025-08-25T15:46:53.010+0800, by Lim Yi Link
1. SRD _EAINT-8655_[Transaction Detail]  Generate eInvoice For eDereg Pre-Checking Transaction Detail_20250828_V0.2.docx — 543872 bytes, 2025-08-28T17:20:34.139+0800, by Lim Yi Link
1. SRD _EAINT-8655_[Transaction Detail]  Generate eInvoice For eDereg Pre-Checking Transaction Detail_20250828_V1.0.docx — 542980 bytes, 2025-08-28T17:20:33.012+0800, by Lim Yi Link
1. SRD _EAINT-8655_[Transaction Detail]  Generate eInvoice For eDereg Pre-Checking Transaction Detail_20250828_V1.0.pdf — 606247 bytes, 2025-08-28T17:20:33.526+0800, by Lim Yi Link
1. SRD _EAINT-8655_[Transaction Detail]  Generate eInvoice For eDereg Pre-Checking Transaction Detail_20251023_V1.1 (2ae3c05c-6495-4fd3-b267-3b7c47a058e0).pdf — 1103476 bytes, 2025-10-23T09:26:16.245+0800, by Lim Yi Link
1. SRD _EAINT-8655_[Transaction Detail]  Generate eInvoice For eDereg Pre-Checking Transaction Detail_20251023_V1.1 (52c75813-a2e2-4e70-8430-3bcb1126e2e2).docx — 1165889 bytes, 2025-10-23T09:26:15.967+0800, by Lim Yi Link
1. SRD _EAINT-8655_[Transaction Detail]  Generate eInvoice For eDereg Pre-Checking Transaction Detail_20251023_V1.2.docx — 1165346 bytes, 2025-10-23T16:34:26.013+0800, by Lim Yi Link
1. SRD _EAINT-8655_[Transaction Detail]  Generate eInvoice For eDereg Pre-Checking Transaction Detail_20251023_V1.2.pdf — 1101364 bytes, 2025-10-23T16:34:25.648+0800, by Lim Yi Link
1. SRD _EAINT-8655_[Transaction Detail]  Generate eInvoice For eDereg Pre-Checking Transaction Detail_20251029_V1.3.docx — 1165347 bytes, 2025-10-29T16:02:24.905+0800, by Lim Yi Link
1. SRD _EAINT-8655_[Transaction Detail]  Generate eInvoice For eDereg Pre-Checking Transaction Detail_20251029_V1.3.pdf — 1100323 bytes, 2025-10-29T16:02:24.584+0800, by Lim Yi Link
1. SRD_eDereg Pre-Checking_e-invoice template_20251024_v0.1.docx — 372742 bytes, 2025-10-24T16:40:54.890+0800, by Lim Yi Link