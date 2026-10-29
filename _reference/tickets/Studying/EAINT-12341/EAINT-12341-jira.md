# EAINT-12341 — Jira capture (27/10/2026, 5:29:09 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** 🔴[eAuto-BackEnd & UCD] Replace Approved Application Email with New Emails to UCD and RHB Support
2. **Type:** Task · **Status:** Done · **Priority:** Medium
3. **Assignee:** Chee Mei Jia · **Reporter:** Lim Yi Link · **QA (cf 10041):** Siti Nur Azila
4. **Fix versions:** S34.5-20261007🌞 (2026-10-07)
5. **Labels:** 260914-260918, ProductBacklog, September2026
6. **Created:** 2026-09-14T16:54:48.419+0800 · **Updated:** 2026-10-09T14:57:53.141+0800
7. **Exp. Deploy Date (cf 10087):** 2026-10-07 · **ETA for Testing (cf 10057):** 2026-09-23 · **[QA] Est Man-day (cf 10081):** 2
8. **Links:** Relates: EAINT-12338 🔴[eAuto-BackEnd] Disable Softcopy Document Request Email Notifications to Potential UCDs in Production; Relates: EAINT-12461 🔴[eAuto-Backend] Application: To Update Email Content for Request for Document Submission (Softcopy)
9. **Sub-tasks:** EAINT-12426 [eAuto - Application Approval Flow] Application Approved - Both new approval emails are sent without the CC apply@eauto.my; EAINT-12428 [eAuto - Application Approval Flow] Appointment Letter PDF - Margins do not follow the template, so the text area is narrower
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | - BackEnd - UCD |
| 2 | Affected Module | - Pre-Application - Application |
| 3 | Request | Replace the existing approved application email with a new two-prong email that sends the UCD appointment letter and the RHB account opening instructions to the UCD and to the RHB team. |
| 4 | Existing Issue/Behaviour | - eAuto sends 3 documents to the UCD upon application approval. - The email is triggered from the Application Approved status. - RHB requires the Offer Letter and Direct Debit form to be issued from the RHB system due to running number and authentication requirements. |
| 5 | Expected New Handling/Behaviour | - Send two emails upon Application approval: the RHB Account Registration Guideline to the UCD, and the Appointment Letter to RHB Support (BIS.Support@rhbgroup.com) with the UCD CC'd. - Determine the guideline provided based on the number of directors or business owners and whether there is a foreign director or business owner: - 4 or fewer directors or business owners and no foreigner: proceed with the RHB online account opening. - 5 or more directors or business owners, or at least one foreigner: obtain the required documents from RHB Support and register the i-Account at an RHB branch. - Generate the Appointment Letter by the system, with the required details pre-populated from the Application information, and attach it to the email sent to RHB Support. - Allow the UCD to upload the completed RHB documents for BackOffice verification before proceeding to payment. |
| 6 | Additional Note | - The 3 RHB documents are the Direct Debit Application form, Offer Letter, and Board of Resolution. - RHB online application link: https://smecaonline.rhbgroup.com/sme/online?tag=campaign - Refer to the attached Enhancement Request Form and RHB Islamic Account Opening proposal deck. - RHB has not confirmed technical feasibility, and no API specification or IDD has been confirmed as required. |
SRD:
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 15.09.2026 (Tues) | V0.1 | Sent out for external review |  |
| 2 | 15.09.2026 (Tues) | V1.0 | Sent out for external review |  |
| 3 | 17.09.2026 (Thurs) | V1.1 | Email templates confirmed by Operations |  |
| 4 | 24.09.2026 (Thurs) | V1.2 | Appointment Letter attached to the UCD emails - Email template 1 & 2 |  |
| 5 | 29.09.2026 (Tues) | V1.3 | Replaced UCD email templates with 1 combined template |  |
Supporting Document
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 14.09.2026 (Mon) | V1.0 | Shared by Nurul via EAUTO-1061 | Sample: |
| 2 | 18.09.2026 (Fri) | V2.0 | Shared by Nurul via email | Sample:      Template: |
| 3 | 29.09.2026 (Tues) | V3.0 | Shared by Yeng via email | Email Template: |

## Comments (0)

## Attachments

1. eAuto_UCD_Appointment_Letter_Template_v2.0_20260918.docx — 582680 bytes, 2026-09-24T12:36:31.191+0800, by Lim Yi Link
1. EMAIL TEMPLATE - RHB ACCOUNT OPENING.docx — 15205 bytes, 2026-09-29T15:21:12.717+0800, by Chee Mei Jia
1. Sample_Appointment Letter_v1.0_20260914.docx — 24876 bytes, 2026-09-24T12:36:31.542+0800, by Lim Yi Link
1. Sample_Appointment Letter_v2.0_20260918 (9abec23b-963a-4357-a5b5-3009ac829939).docx — 798666 bytes, 2026-09-24T17:37:11.039+0800, by Lim Yi Link
1. SRD_EAINT-12341_v0.1_20260915.docx — 19021 bytes, 2026-09-15T17:43:22.011+0800, by Lim Yi Link
1. SRD_EAINT-12341_v1.0_20260915.docx — 19070 bytes, 2026-09-15T17:43:22.239+0800, by Lim Yi Link
1. SRD_EAINT-12341_v1.0_20260915.pdf — 190665 bytes, 2026-09-15T17:43:21.762+0800, by Lim Yi Link
1. SRD_EAINT-12341_v1.1_20260917.docx — 19101 bytes, 2026-09-17T18:24:29.311+0800, by Lim Yi Link
1. SRD_EAINT-12341_v1.1_20260917.pdf — 192064 bytes, 2026-09-17T18:24:29.073+0800, by Lim Yi Link
1. SRD_EAINT-12341_v1.2_20260924.docx — 21487 bytes, 2026-09-24T12:21:51.839+0800, by Lim Yi Link
1. SRD_EAINT-12341_v1.2_20260924.pdf — 221696 bytes, 2026-09-24T12:21:51.581+0800, by Lim Yi Link
1. SRD_EAINT-12341_v1.3_20260929.docx — 22165 bytes, 2026-09-29T15:21:12.437+0800, by Chee Mei Jia
1. SRD_EAINT-12341_v1.3_20260929.pdf — 213956 bytes, 2026-09-29T15:21:12.175+0800, by Chee Mei Jia