# EAINT-10937 — Jira capture (27/10/2026, 8:18:25 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** 🔴[eAuto-Service Portal] JomCheck Report Access & Jomcheck Report Listing
2. **Type:** Task · **Status:** Done · **Priority:** Medium
3. **Assignee:** Lim Yi Link · **Reporter:** Chee Mei Jia · **QA (cf 10041):** Charmain Ea Chiang, Siti Nur Azila, Teck Yung Chin
4. **Fix versions:** S32.X-20260810🌚 [Last Minutes On Hold] (2026-08-10), S33.5-20260914🌚 (2026-09-14)
5. **Labels:** 260420-260424, April2026, ProductBacklog
6. **Created:** 2026-04-22T09:13:53.395+0800 · **Updated:** 2026-09-15T16:53:08.878+0800
7. **Exp. Deploy Date (cf 10087):** 2026-09-14 · **ETA for Testing (cf 10057):** 2026-06-08 · **[QA] Est Man-day (cf 10081):** 4
8. **Links:** Relates: EAINT-10089 🔴[eAuto-UCD & BackOffice] JomCheck Enhancement - Sharing Feature for JomCheck Report & Increase JomCheck Fees from RM 18 to RM 20; Relates: EAINT-11175 🔴[eAuto-BackOffice] Update Bank/Credit Company Account Page - Add 3 New Permission Checkboxes
9. **Sub-tasks:** EAINT-11742 [eAuto - Service Portal] JomCheck Report Listing - Shared Date Filters Marked Mandatory Not Specified in SRD; EAINT-11751 [eAuto - Service Portal] Search & Filter - Vehicle No. filter accepts Special Character and Chinese / non-ASCII Character by copy and paste; EAINT-11753 [eAuto - Service Portal] Search & Filter - Incorrect validation for Chassis No. filter; EAINT-11765 [eAuto - Service Portal] Search & Filter - Incorrect error prompt message when Shared Date From remains blank; EAINT-11766 [eAuto - Service Portal] View Hyperlink - Dummy Report is displayed for JomCheck Report purchased using Chassis Number; EAINT-11767 [eAuto - Service Portal] Reset Hyperlink - Clears out filters and the searched listing; EAINT-11768 [eAuto - Service Portal] JomCheck Report Listing - Incorrect column naming for JomCheck Report Sharing Date; EAINT-11769 [eAuto - Service Portal] Export Hyperlink - Credit Company unable to export Jomcheck Report listing; EAINT-11771 [eAuto - Service Portal] Search & Filter - Shared Date (From) & (To) to be optional when user search by Vehicle No. or Chassis Number; EAINT-11773 [eAuto - Service Portal] Download - Incorrect file naming for JomCheck Report purchased using Chassis No.; EAINT-11774 [eAuto - Service Portal] Search & Filter - Incorrect error prompt message when Payment Date From remains blank; EAINT-11782 [eAuto - Service Portal] Export File - Incorrect column naming for Vehicle No & Chassis No; EAINT-11792 [eAuto - BO] JomCheck Share feature not displayed after deployment; EAINT-11794 [eAuto - BO] Allow UCD to share JomCheck Report feature is auto unticked without human intervention; EAINT-11802 [eAuto - BO] Concurrency issue error popup not displayed.; EAINT-11825 [eAuto - UCD] No success message displayed during concurrent report sharing; EAINT-11826 [eAuto - UCD] Incorrect error popup displayed when users attempt to share jomcheck report after 30 days with link opened; EAINT-12129 [eAuto - Service Portal] JomCheck report does not show up on the Transaction Details page; EAINT-12136 [eAuto - Service Portal] JomCheck shows YES (should be "-") for eSTM transaction approved before deployment; EAINT-12144 [eAuto - Service Portal] eAuto Sdn Bhd user cannot see latest JomCheck transaction when it is not shared to any credit company
10. **Parent:** —

## Description

General Information
| # | Item | Description |
| 1 | Affected Portal | Service Portal |
| 2 | Affected Module | - Ownership Claim Listing - Jomcheck Transaction Listing |
| 3 | Request | - Ownership Claim Listing > Transaction Details — for newly approved eSTM transactions, allow banks/credit companies (with UCD-granted permission) to view the JomCheck report. - Create a new "Jomcheck Transaction Listing" page where all banks/credit companies can view approved JomCheck transactions. - Report access is controlled via a permission checkbox that UCD can tick during or after purchasing the JomCheck report. |
| 4 | Existing Issue/Behaviour | - No dedicated JomCheck transaction listing page exists for banks/credit companies. - JomCheck report visibility on the Transaction Details page is not permission-controlled. |
| 5 | Expected New Handling/Behaviour | - UCD can grant permission to specific banks/credit companies via a checkbox during or after JomCheck report purchase. - Permitted banks/credit companies can view the JomCheck report on the Transaction Details page. - A new "Jomcheck Report Listing" page will list all approved JomCheck transactions for banks/credit companies. |
| 6 | Additional Note | - |
SRD:
| # | Date | Version | Status / Remarks | Attachment |
| 1 | 22.04.2026 (Wed) | v0.1 | Initial Draft |  |
| 2 | 15.05.2026 (Fri) | v0.2 | Updated Sections 1.5, 2.1.3, 2.2.2; replaced original NFR and Open Items sub-sections with new Section 2.2.3 Expected Behaviour. |  |
| 3 | 19.05.2026 (Tues) | v0.3 | Updated Section 2.2.3.1 and 2.2.3.2; Added Filters and Columns and Updated Display of JomCheck Details |  |
| 4 | 19.05.2026 (Tues) | v1.0 | Send out for external review |  |
| 5 | 25.05.2026 (Mon) | v1.1 | a. Update JomCheck Transaction Listing to JomCheck Report Listing  b. Added figma link for JomCheck Report Listing  c. Updated JomCheck Report Listing: i. Filter ii. Columns  iii. Hyperlinks  d. Updated the period of sharing JomCheck report to 30 days |  |
| 5 | 03.06.2026 (Wed) | v1.2 | Updated the JomCheck report sharing feature in Section 2.2.2. |  |

## Comments (0)

## Attachments

1. EAINT-10937_SRD_v0.1_20260422.docx — 21713 bytes, 2026-04-22T16:59:05.149+0800, by Chee Mei Jia
1. SRD_EAINT-10937_[eAuto-Service Portal] JomCheck Report Access & Jomcheck Report Listing_v1.1_20260525.docx — 35270 bytes, 2026-05-25T18:39:10.135+0800, by Lim Yi Link
1. SRD_EAINT-10937_[eAuto-Service Portal] JomCheck Report Access & Jomcheck Report Listing_v1.1_20260525.pdf — 158143 bytes, 2026-05-25T18:39:09.863+0800, by Lim Yi Link
1. SRD_EAINT-10937_[eAuto-Service Portal] JomCheck Report Access & Jomcheck Report Listing_v1.2_20260603.docx — 35680 bytes, 2026-06-03T09:55:57.946+0800, by Lim Yi Link
1. SRD_EAINT-10937_[eAuto-Service Portal] JomCheck Report Access & Jomcheck Report Listing_v1.2_20260603.pdf — 158301 bytes, 2026-06-03T09:55:57.698+0800, by Lim Yi Link
1. SRD_EAINT-10937_[eAuto-Service Portal] JomCheck Report Access & Jomcheck Transaction Listing_v0.3_20260519.docx — 28656 bytes, 2026-05-19T12:29:13.050+0800, by Lim Yi Link
1. SRD_EAINT-10937_[eAuto-Service Portal] JomCheck Report Access & Jomcheck Transaction Listing_v1.0_20260519.docx — 28357 bytes, 2026-05-19T12:32:00.644+0800, by Lim Yi Link
1. SRD_EAINT-10937_[eAuto-Service Portal] JomCheck Report Access & Jomcheck Transaction Listing_v1.0_20260519.pdf — 138208 bytes, 2026-05-19T12:31:59.719+0800, by Lim Yi Link
1. SRD_EAINT-10937_v0_2_20260515.docx — 20459 bytes, 2026-05-17T16:50:28.699+0800, by Chee Mei Jia