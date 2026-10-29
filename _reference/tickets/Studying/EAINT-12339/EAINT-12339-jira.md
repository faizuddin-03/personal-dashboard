# EAINT-12339 — Jira capture (27/10/2026, 8:18:26 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** 🟤[eAuto-JomCheck] Upgrade JomCheck Gateway API Integration from v1.9 to v2.0
2. **Type:** Task · **Status:** Done · **Priority:** Medium
3. **Assignee:** Chee Mei Jia · **Reporter:** Chee Mei Jia · **QA (cf 10041):** Muhammad Amirul Azfar Bin Kamarulazam, Muhammad Faizuddin Bin Bidi
4. **Fix versions:** S34.4-20261005🌚 (2026-10-05)
5. **Labels:** 260914-260918, ProductBacklog, September2026
6. **Created:** 2026-09-14T15:30:54.704+0800 · **Updated:** 2026-10-08T09:33:52.509+0800
7. **Exp. Deploy Date (cf 10087):** 2026-10-05 · **ETA for Testing (cf 10057):** 2026-09-29 · **[QA] Est Man-day (cf 10081):** 3
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | eAuto UCD, BackOffice & Service Portal |
| 2 | Affected Module | JomCheck |
| 3 | Request | - ezAuto (JomCheck provider) informed that JomCheck Gateway API will be upgraded from v1.9 to v2.0. - Deployment confirmed with ezAuto for the 05.10.2026 (Mon) night session. ezAuto completes their deployment at 11:30pm on the same night. - eAuto integration logic must be updated to read the new response fields. |
| 4 | Existing Issue/Behaviour | - eAuto currently integrates with JomCheck Gateway API v1.9. - Claim type is read from ClaimType (free text). - Approved parts is read from ApprovedParts (exact count). - Mileage is read from Mileage (exact figure). - No total loss / BER indicator available in the current response. |
| 5 | Expected New Handling/Behaviour | - New claim-level fields: ClaimsType (numeric claim type code, replaces ClaimType), PossibleTotalLoss (flag for Actual Total Loss), PossibleBER (flag for Constructive Total Loss / Beyond Economical Repair), TotalPartsChanged (replaces ApprovedParts, returned as a range e.g. "0 to 10 parts"), MileageRange (replaces Mileage, returned as a 10,000km band e.g. "0 to 10,000 km"). - New vehicle-level fields: PossibleTotalLoss and PossibleBER — true if any claim on the vehicle qualifies. - Deprecated fields ClaimType, ApprovedParts and Mileage will remain in the response for backward compatibility but will always return "N/A" (null for Mileage). Integration logic relying on these fields must switch to the new equivalents. - Severity expanded to six bands: LOW, MEDIUM, HIGH, SEVERE, CRITICAL, CATASTROPHIC. - Display and report logic across UCD, BackOffice and Service Portal to be updated to show range-based mileage and parts count instead of exact figures. |
| 6 | Additional Note | - Staging has already been updated to v2.0 using the existing credentials — testing can start before the deployment date. - Updated API specification document is attached to this ticket. - eAuto dev and QA timeline to be planned against the 05.10.2026 (Mon) night deployment. |
JomCheck Gateway API v2.0 Technical Documentation
| # | Date / Version | Type | Attachment |
| 1 | 14.09.2026 (Mon) | API Technical Documentation |  |
| 2 | 02.10.2026 (Fri) | API Technical Documentation shared by ezAuto via email |  |
SRD:
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 18.09.2026 (Fri) | v0.1 | Initial Draft | SRD: |
| 2 | 25.09.2026 (Fri) | v0.2 | Updated Draft | SRD:      BackOffice Mock Up (Sample):      Service Portal Mock Up (Sample): |
| 3 | 28.09.2026 (Mon) | v0.3 | Updated Draft | SRD:   BackOffice Mock Up (Sample): |
| 4 | 29.09.2026 (Tue) | v1.0 | Sent out for Requestor to review | SRD:   BackOffice Mock Up (Sample):    Service Portal Mock Up (Sample): |

## Comments (0)

## Attachments

1. ezAuto Technical Spec 2.0.pdf — 491116 bytes, 2026-09-14T15:36:21.252+0800, by Chee Mei Jia
1. ezAuto Technical Spec 2.0 (updated production url).pdf — 491039 bytes, 2026-10-08T09:30:53.370+0800, by Chee Mei Jia
1. Mockup_EAINT-12339_JomCheck_Report_Listing_20260925.html — 37038 bytes, 2026-09-25T21:05:18.448+0800, by Chee Mei Jia
1. Mockup_EAINT-12339_JomCheck_Report_Listing_20260928.html — 37177 bytes, 2026-09-28T17:02:06.483+0800, by Chee Mei Jia
1. Mockup_EAINT-12339_JomCheck_Report_Listing_20260928 (54abd748-0e74-4fdf-8142-aaed3a915005).html — 37177 bytes, 2026-09-29T10:04:46.651+0800, by Chee Mei Jia
1. Mockup_EAINT-12339_Service_Portal_JomCheck_Report_Listing_20260925.html — 20736 bytes, 2026-09-25T21:05:18.161+0800, by Chee Mei Jia
1. Mockup_EAINT-12339_Service_Portal_JomCheck_Report_Listing_20260925 (9dd16247-9db7-476d-be0b-380f4b58a016).html — 20736 bytes, 2026-09-29T10:04:46.404+0800, by Chee Mei Jia
1. SRD_EAINT-12339_v0.1_20260918.docx — 18622 bytes, 2026-09-25T21:05:18.998+0800, by Chee Mei Jia
1. SRD_EAINT-12339_v0.2_20260925.docx — 22333 bytes, 2026-09-25T21:05:18.766+0800, by Chee Mei Jia
1. SRD_EAINT-12339_v0.3_20260928.docx — 22839 bytes, 2026-09-28T17:02:06.773+0800, by Chee Mei Jia
1. SRD_EAINT-12339_v1.0_20260929.docx — 40674 bytes, 2026-09-29T10:04:46.899+0800, by Chee Mei Jia
1. SRD_EAINT-12339_v1.0_20260929.pdf — 270947 bytes, 2026-09-29T10:04:46.071+0800, by Chee Mei Jia