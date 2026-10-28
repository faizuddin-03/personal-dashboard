# EAINT-12107 — Jira capture (27/10/2026, 5:32:23 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** ⚪[Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay
2. **Type:** Task · **Status:** Done · **Priority:** Medium
3. **Assignee:** Lim Yi Link · **Reporter:** Chee Mei Jia · **QA (cf 10041):** Muhammad Faizuddin Bin Bidi
4. **Fix versions:** S34.13-20261021 🌞 (2026-10-21)
5. **Labels:** 260727-260731, July2026, ProductBacklog
6. **Created:** 2026-07-29T09:48:03.108+0800 · **Updated:** 2026-10-21T10:02:17.403+0800
7. **Exp. Deploy Date (cf 10087):** 2026-10-21 · **ETA for Testing (cf 10057):** 2026-09-15 · **[QA] Est Man-day (cf 10081):** 2
8. **Links:** Relates: EAINT-12327 ⚪[CIBO] To Enhance Payment Mode Column Format in Transaction Listing and Payment Report
9. **Sub-tasks:** —
10. **Parent:** —

## Description

Design Reference 
| # | Date | Revision | Attachment |
| 1 | 03.09.2026 (Thurs) | v0.1 |  |
General Information
| # | Item | Description |
| 1 | Affected Portal | Secarang |
| 2 | Affected Module | Fiuu Payment |
| 3 | Request | Enhance the Secarang Fiuu payment gateway to enable two additional payment options:  1. SPAY Later - activation date: 26 May 2026  2. PayLater by Grab - activation date: 21 June 2026 |
| 4 | Existing Issue/Behaviour | Nil |
| 5 | Expected New Handling/Behaviour | SPAY Later and PayLater by Grab available as payment options in Secarang. |
| 6 | Additional Note | To allow more payment options in Secarang. |
SRD
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 03.09.2025 (Thurs) | V0.1 | Initial |  |
| 2 | 10.09.2025 (Thurs) | V0.2 | - Updated Sections 2.1 to 2.2.5 - Added Section 2.2.6 Payment Flow - Added Section 2.2.7 Payment Channel Filter - Added Section 2.2.8 Testing Eligibility |  |
| 3 | 10.09.2025 (Thurs) | V1.0 | Send out for external review |  |
| 4 | 11.09.2025 (Fri) | V1.1 | Updated Section 2.2.3  Added Section 2.2.9 Payment Reference ID |  |
| 5 | 20.09.2025 (Tues) | V1.2 | Updated Section 2.2.7 |  |

## Comments (3)

### Shane — 2026-09-07T17:46:53.228+0800

hi @Lim Yi Link ,

changes are up in staging ya, showing both grabpay and shopeepay, all payment method working fine except for shopeepay (this 1 has to do with fiuu shopeepay, its stimulator in sandbox doesn't work as well). and as mentioned, we wont be able to select the paylater option.
12107

### Shane — 2026-09-09T14:04:46.735+0800

cibo staging changes are up as well, added filter for fiuu ewallet payment and introduced this payment method in transaction management.

cc @Lim Yi Link

### Shane — 2026-09-09T14:05:40.334+0800

it’s confirmed that we can disable any payment method by data patching

@Lim Yi Link

## Attachments

1. secarang_payment_channels_prototype.html — 190233 bytes, 2026-09-03T12:18:17.059+0800, by Lim Yi Link
1. SRD_EAINT-12107_[Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay_v0.2_20260910.docx — 35090 bytes, 2026-09-10T16:45:03.516+0800, by Lim Yi Link
1. SRD_EAINT-12107_[Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay_v1.0_20260910.docx — 35628 bytes, 2026-09-10T16:45:02.590+0800, by Lim Yi Link
1. SRD_EAINT-12107_[Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay_v1.0_20260910.pdf — 158467 bytes, 2026-09-10T16:45:03.743+0800, by Lim Yi Link
1. SRD_EAINT-12107_[Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay_v1.1_20260911 (2facb141-2990-498c-8a06-d433f156f3e9).docx — 32473 bytes, 2026-09-11T15:18:37.593+0800, by Lim Yi Link
1. SRD_EAINT-12107_[Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay_v1.1_20260911 (54f13c43-5bd7-4e31-809a-6bf54bfc553f).pdf — 229430 bytes, 2026-09-11T15:18:37.327+0800, by Lim Yi Link
1. SRD_EAINT-12107_[Secarang-Fiuu] Enhance Payment Gateway to Enable SPAY Later and PayLater by Grab_v0.1_20260903 (8814533a-d15d-4543-9b6f-0485d85445a1).docx — 30504 bytes, 2026-09-03T12:21:07.703+0800, by Lim Yi Link
1. SRD_EAINT-12107_v1.2_20261020.docx — 32713 bytes, 2026-10-20T13:03:16.245+0800, by Lim Yi Link
1. SRD_EAINT-12107_v1.2_20261020.pdf — 233801 bytes, 2026-10-20T13:03:16.398+0800, by Lim Yi Link